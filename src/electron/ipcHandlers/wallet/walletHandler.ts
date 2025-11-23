// src/electron/ipcHandlers/wallet/walletHandler.ts

import { spawn } from "child_process";
import { app } from "electron";
import * as path from "path";
import WalletService from "../../services/WalletService.js";
import { ipcMainHandle } from "../../util.js";

// Helper to check if we're in development mode
function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function extractJsonPayload(output: string): unknown | null {
  const tryParse = (candidate: string): { ok: true; value: unknown } | null => {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      return null;
    }
  };

  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }

  // Attempt to parse the entire trimmed output first (in case it is pure JSON)
  const wholeOutput = tryParse(trimmed);
  if (wholeOutput?.ok) {
    return wholeOutput.value;
  }

  // Attempt to slice from the first opening brace to the last closing brace
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const sliceCandidate = trimmed.slice(firstBrace, lastBrace + 1);
    const parsedSlice = tryParse(sliceCandidate.trim());
    if (parsedSlice?.ok) {
      return parsedSlice.value;
    }
  }

  // Fallback: walk the string and collect balanced brace segments
  const segments: string[] = [];
  let depth = 0;
  let startIndex = -1;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (char === "{") {
      if (depth === 0) {
        startIndex = i;
      }
      depth += 1;
    } else if (char === "}") {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0 && startIndex !== -1) {
          segments.push(trimmed.slice(startIndex, i + 1));
          startIndex = -1;
        }
      }
    }
  }

  for (const segment of segments) {
    const parsedSegment = tryParse(segment.trim());
    if (parsedSegment?.ok) {
      return parsedSegment.value;
    }
  }

  return null;
}

// Execute Python command using the compiled exe - consistent with other handlers
function executePythonCommand(
  args: string[],
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    // Get the path to the compiled Python exe - same pattern as other handlers
    const appExePath = isDev()
      ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
      : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

    console.log(`[WALLET] Executing command: ${appExePath} ${args.join(" ")}`);

    const childProcess = spawn(appExePath, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true, // Hide console window on Windows
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    childProcess.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    childProcess.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    childProcess.on("close", (code: number | null) => {
      console.log(`[WALLET] Process exited with code ${code}`);
      console.log(`[WALLET] stdout: ${stdout}`);
      if (stderr) console.error(`[WALLET] stderr: ${stderr}`);

      if (code === 0) {
        const data = extractJsonPayload(stdout);

        if (data) {
          console.log("[WALLET] Parsed response:", data);
          resolve({ success: true, data });
        } else {
          console.error(
            "[WALLET] No JSON payload could be parsed from output:",
            stdout,
          );
          resolve({ success: false, error: "Failed to parse response" });
        }
      } else {
        resolve({ success: false, error: stderr || "Command failed" });
      }
    });

    childProcess.on("error", (error: Error) => {
      console.error("[WALLET] Process error:", error);
      resolve({ success: false, error: error.message });
    });
  });
}

export default function registerWalletHandlers() {
  // Get all wallets
  ipcMainHandle("getWallets", async () => {
    try {
      const wallets = await WalletService.getWallets();
      return { success: true, wallets };
    } catch (error) {
      console.error("Error getting wallets:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Generate a new wallet
  ipcMainHandle("generateWallet", async (name: string) => {
    try {
      console.log(`[WALLET] Generating wallet: ${name}`);

      // Call Python to generate wallet
      const result = await executePythonCommand(["wallet", "--generate", name]);

      if (!result.success || !result.data) {
        return {
          success: false,
          message: result.error || "Failed to generate wallet",
        };
      }

      const walletData = result.data as Record<string, unknown>;

      if (!walletData.success) {
        return {
          success: false,
          message: (walletData.error as string) || "Failed to generate wallet",
        };
      }

      // Save wallet to settings
      const addResult = await WalletService.addWallet({
        name: walletData.name as string,
        publicKey: walletData.publicKey as string,
        secretKeyEncrypted: walletData.secretKey as string, // TODO: Add encryption
        balance: 0,
        profileId: null,
      });

      return addResult;
    } catch (error) {
      console.error("Error generating wallet:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Update wallet balance
  ipcMainHandle(
    "updateWalletBalance",
    async (walletId: string, rpcUrl?: string) => {
      try {
        const wallets = await WalletService.getWallets();
        const wallet = wallets.find((w) => w.id === walletId);

        if (!wallet) {
          return { success: false, message: "Wallet not found" };
        }

        console.log(`[WALLET] Updating balance for: ${wallet.publicKey}`);

        // Call Python to get balance
        const args = ["wallet", "--balance", wallet.publicKey];
        if (rpcUrl) {
          args.push("--rpc-url", rpcUrl);
        }

        const result = await executePythonCommand(args);

        if (!result.success || !result.data) {
          return {
            success: false,
            message: result.error || "Failed to get balance",
          };
        }

        const balanceData = result.data as Record<string, unknown>;

        if (!balanceData.success) {
          return {
            success: false,
            message: (balanceData.error as string) || "Failed to get balance",
          };
        }

        // Update wallet balance
        await WalletService.updateWallet(walletId, {
          balance: balanceData.balance as number,
        });

        return { success: true, balance: balanceData.balance as number };
      } catch (error) {
        console.error("Error updating wallet balance:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // Delete wallet
  ipcMainHandle("deleteWallet", async (walletId: string) => {
    return await WalletService.deleteWallet(walletId);
  });

  // Set wallet profile
  ipcMainHandle(
    "setWalletProfile",
    async (walletId: string, profileId: string | null) => {
      return await WalletService.setWalletProfile(walletId, profileId);
    },
  );

  // Update wallet name
  ipcMainHandle("updateWalletName", async (walletId: string, name: string) => {
    return await WalletService.updateWallet(walletId, { name });
  });

  console.log("Wallet IPC handlers registered");
}
