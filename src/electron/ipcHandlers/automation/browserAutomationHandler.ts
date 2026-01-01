import { ChildProcess, exec, spawn } from "child_process";
import { app, BrowserWindow } from "electron";
import * as path from "path";
import type {
  AutomationResultData,
  AutomationRuntimeOptions,
} from "../../../../types/global-types";
import { AIModelProvider, ModelConfig } from "../../../../types/model.js";
import AISettingsService from "../../services/AISettingsService.js";
import BrowserSettingsService from "../../services/BrowserSettingsService.js";
import SettingsFileManager from "../../services/SettingsFileManager.js";
import WalletService from "../../services/WalletService.js";
import { ipcMainHandle, isDev } from "../../util.js";

const CDP_PORT = 9222;

// Map to store multiple running processes by task ID
const runningProcesses = new Map<string, ChildProcess>();

// Legacy single process for backward compatibility
let currentPythonProcess: ChildProcess | null = null;

interface WalletPreparationResult {
  args: string[];
  env: NodeJS.ProcessEnv;
  logs: string[];
  error?: {
    message: string;
    logs: string[];
  };
}

async function prepareWalletIntegration(
  taskTag: string,
  runtimeOptions?: AutomationRuntimeOptions,
  profileName?: string,
): Promise<WalletPreparationResult> {
  const envVars: NodeJS.ProcessEnv = { ...process.env };
  const logs: string[] = [];
  const args: string[] = [];

  if (!runtimeOptions?.useWallet) {
    return { args, env: envVars, logs };
  }

  let walletPublicKey = runtimeOptions.walletPublicKey?.trim();
  let walletSecretKey = runtimeOptions.walletSecretKey?.trim();
  const walletSecretEnv = runtimeOptions.walletSecretEnv?.trim();
  let walletName: string | undefined;

  if (!walletPublicKey || (!walletSecretKey && !walletSecretEnv)) {
    let wallet = null;

    try {
      if (runtimeOptions.walletId) {
        const wallets = await WalletService.getWallets();
        wallet = wallets.find((w) => w.id === runtimeOptions.walletId) || null;
      } else if (profileName) {
        wallet = await WalletService.getWalletForProfile(profileName);
      }
    } catch (error) {
      console.error(`[WALLET] Failed to resolve wallet for ${taskTag}:`, error);
      return {
        args,
        env: envVars,
        logs,
        error: {
          message:
            "Failed to resolve wallet configuration. Please review wallet settings.",
          logs: [
            "ERROR: Unable to resolve wallet configuration. Check wallet settings and try again.",
          ],
        },
      };
    }

    if (!wallet) {
      return {
        args,
        env: envVars,
        logs,
        error: {
          message:
            "No wallet assigned to this profile. Please assign a wallet to the profile.",
          logs: [
            "ERROR: No wallet found for profile. Configure wallet in Wallet Management.",
          ],
        },
      };
    }

    walletPublicKey = walletPublicKey ?? wallet.publicKey?.trim();
    walletSecretKey = walletSecretKey ?? wallet.secretKeyEncrypted?.trim();
    walletName = wallet.name;
  }

  if (!walletPublicKey) {
    return {
      args,
      env: envVars,
      logs,
      error: {
        message: "Wallet public key is missing.",
        logs: ["ERROR: Wallet public key is missing for automation run."],
      },
    };
  }

  if (walletSecretEnv && !walletSecretKey) {
    const existing = process.env[walletSecretEnv];
    if (existing) {
      walletSecretKey = existing.trim();
    }
  }

  if (!walletSecretKey && !walletSecretEnv) {
    return {
      args,
      env: envVars,
      logs,
      error: {
        message:
          "Wallet secret key is missing. Unable to attach wallet for automation.",
        logs: [
          "ERROR: Wallet secret key is missing. Update wallet configuration and try again.",
        ],
      },
    };
  }

  args.push("--use-wallet", "true");
  args.push("--wallet-public-key", walletPublicKey);

  let resolvedSecretEnv = walletSecretEnv;

  if (walletSecretKey) {
    if (!resolvedSecretEnv) {
      const sanitized = taskTag.replace(/[^A-Za-z0-9]/g, "_").toUpperCase();
      const fallback = "WB_WALLET_SECRET";
      resolvedSecretEnv = (
        sanitized ? `WB_WALLET_SECRET_${sanitized}` : fallback
      ).slice(0, 60);
    }

    if (resolvedSecretEnv) {
      envVars[resolvedSecretEnv] = walletSecretKey;
    }
  }

  if (resolvedSecretEnv) {
    args.push("--wallet-secret-env", resolvedSecretEnv);
  } else if (walletSecretKey) {
    // As a last resort include the secret directly. Avoid when possible.
    args.push("--wallet-secret-key", walletSecretKey);
  }

  if (walletName) {
    logs.push(`[WALLET] Wallet integration enabled: ${walletName}`);
  } else {
    logs.push("[WALLET] Wallet integration enabled");
  }

  return { args, env: envVars, logs };
}

export function registerBrowserAutomationHandlers() {
  ipcMainHandle("stopBrowserAutomation", async () => {
    console.log("Stopping browser automation");
    if (currentPythonProcess) {
      try {
        const pythonPID = currentPythonProcess.pid;

        if (process.platform === "win32" && pythonPID) {
          // Force kill the entire process tree on Windows (like Task Manager)
          exec(
            `taskkill /F /T /PID ${pythonPID}`,
            (error: Error | null, stdout: string, stderr: string) => {
              if (error) {
                console.error(`taskkill error: ${error.message}`);
              }
              if (stderr) {
                console.error(`taskkill stderr: ${stderr}`);
              }
              if (stdout) {
                console.log(`taskkill stdout: ${stdout}`);
              }
            },
          );
        } else {
          // Fallback for non-Windows platforms
          currentPythonProcess.kill();
        }

        currentPythonProcess = null;
        return { success: true, message: "Automation stopped successfully" };
      } catch (e) {
        console.error("Error killing Python process:", e);
        return {
          success: false,
          message: `Failed to stop automation: ${(e as Error).message}`,
        };
      }
    }
    return { success: true, message: "No active automation to stop" };
  });
  ipcMainHandle(
    "runBrowserAutomation",
    async (
      prompt: string,
      modelConfig?: ModelConfig,
      runtimeOptions?: AutomationRuntimeOptions,
    ) => {
      console.log(`Running browser automation with prompt: ${prompt}`);

      // Get settings from database if no model config provided
      if (!modelConfig) {
        try {
          const dbSettings = await AISettingsService.getActiveSettings();
          if (dbSettings) {
            modelConfig = {
              provider: dbSettings.provider as AIModelProvider,
              apiKey: dbSettings.apiKey || "",
              model: dbSettings.model,
              baseUrl: dbSettings.baseUrl || undefined,
              temperature: dbSettings.temperature,
              maxTokens: dbSettings.maxTokens,
              useVision: dbSettings.useVision ?? true,
            };
            console.log(
              `Using database settings: ${modelConfig.provider} model: ${modelConfig.model}`,
            );
          } else {
            console.log("No active AI settings found in database");
          }
        } catch (error) {
          console.error("Error retrieving AI settings from database:", error);
        }
      } else {
        console.log(
          `Using provided settings: ${modelConfig.provider} model: ${modelConfig.model}`,
        );
      }

      // Validate required settings
      if (!modelConfig || !modelConfig.model || !modelConfig.provider) {
        return {
          success: false,
          message:
            "Missing required AI model configuration. Please configure AI settings first.",
          logs: ["ERROR: Missing required AI model configuration"],
        };
      } // Check for API key for providers that require it
      if (
        [
          "openai",
          "anthropic",
          "google",
          "deepseek",
          "openrouter",
          "groq",
        ].includes(modelConfig.provider) &&
        !modelConfig.apiKey
      ) {
        return {
          success: false,
          message: `API key is required for ${modelConfig.provider}. Please add your API key in AI settings.`,
          logs: [`ERROR: Missing API key for ${modelConfig.provider}`],
        };
      }

      if (currentPythonProcess) {
        try {
          currentPythonProcess.kill();
        } catch (e) {
          console.error("Error killing previous Python process:", e);
        }
      }

      const logs: string[] = [];

      try {
        const appExePath = isDev()
          ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
          : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe"); // Build command-line arguments
        const args = [
          "automation",
          "--prompt",
          prompt,
          "--port",
          CDP_PORT.toString(),
        ]; // Get browser settings to check browser path and profile
        // Add agent settings (wait_between_actions) if present
        try {
          const agentSettings = SettingsFileManager.getAgentSettings();
          if (
            agentSettings &&
            typeof agentSettings.wait_between_actions === "number"
          ) {
            args.push(
              "--wait-between-actions",
              agentSettings.wait_between_actions.toString(),
            );
          }
        } catch (e) {
          console.warn("Failed to read agent settings:", e);
        }
        try {
          const browserSettings = await BrowserSettingsService.getSettings(); // Add browser path based on which browser is selected
          if (
            browserSettings.useSystemBrowser &&
            browserSettings.systemBrowserPath
          ) {
            console.log(
              `Using system browser for automation: ${browserSettings.systemBrowserPath}`,
            );
            args.push("--browser-path", browserSettings.systemBrowserPath);
          } else if (!browserSettings.useSystemBrowser) {
            // Using Installed Chromium Browser
            const chromiumStatus = SettingsFileManager.getChromiumStatus();
            if (chromiumStatus.installPath) {
              console.log(
                `Using Installed Chromium Browser for automation: ${chromiumStatus.installPath}`,
              );
              args.push("--browser-path", chromiumStatus.installPath);
            } else {
              console.warn(
                "Installed Chromium Browser selected but no install path found!",
              );
              return {
                success: false,
                message:
                  "Installed Chromium Browser is selected but Chromium is not properly installed. Please reinstall Chromium or switch to system browser.",
                logs: [
                  "ERROR: Missing Chromium install path for Installed Chromium Browser",
                ],
              };
            }
          }

          // Always use default profile for legacy single automation handler
          console.log("Using default profile for single automation task");
          args.push("--profile", "default_profile");
        } catch (error) {
          console.error("Error getting browser settings:", error);
          // Continue with default browser if there's an error
        }

        // Add model configuration parameters if provided
        if (modelConfig) {
          args.push("--provider", modelConfig.provider);
          args.push("--model", modelConfig.model);

          if (modelConfig.apiKey) {
            args.push("--api-key", modelConfig.apiKey);
          }

          if (modelConfig.baseUrl) {
            args.push("--base-url", modelConfig.baseUrl);
          }

          if (typeof modelConfig.temperature === "number") {
            args.push("--temperature", modelConfig.temperature.toString());
          }

          if (typeof modelConfig.maxTokens === "number") {
            args.push("--max-tokens", modelConfig.maxTokens.toString());
          }

          // Add use-vision parameter
          if (typeof modelConfig.useVision === "boolean") {
            args.push("--use-vision", modelConfig.useVision.toString());
          }
        }

        const configuredUploadDirectory =
          runtimeOptions?.fileUploadDirectory?.trim() ||
          SettingsFileManager.getAISettings().fileUploadDirectory?.trim();
        if (configuredUploadDirectory) {
          console.log(
            `[FILES] Using upload directory for automation: ${configuredUploadDirectory}`,
          );
          args.push("--upload-directory", configuredUploadDirectory);
        }

        const walletPreparation = await prepareWalletIntegration(
          "LEGACY",
          runtimeOptions,
          "default_profile",
        );

        if (walletPreparation.logs.length) {
          logs.push(...walletPreparation.logs);
        }

        if (walletPreparation.error) {
          logs.push(...walletPreparation.error.logs);
          return {
            success: false,
            message: walletPreparation.error.message,
            logs,
          };
        }

        args.push(...walletPreparation.args);

        const spawnEnv = walletPreparation.env;

        currentPythonProcess = spawn(appExePath, args, {
          windowsHide: true, // Hide console window on Windows
          env: spawnEnv,
        });

        const logHandler = (log: string) => {
          logs.push(log);
          // Use BrowserWindow.getAllWindows() to send to all windows
          const windows = BrowserWindow.getAllWindows();
          windows.forEach((window) => {
            if (!window.isDestroyed()) {
              window.webContents.send("browserAutomationLog", log);
            }
          });
        };

        const errorHandler = (error: string) => {
          logs.push(`ERROR: ${error}`);
          const windows = BrowserWindow.getAllWindows();
          const mainWindow = windows.find((w) =>
            w.title.includes("Automation:"),
          );
          mainWindow?.webContents.send("browserAutomationError", error);
          console.error(`Python stderr: ${error}`);
        };

        // Send logs back to the renderer process
        if (currentPythonProcess.stdout) {
          currentPythonProcess.stdout.on("data", (data: Buffer) => {
            const logMsg = data.toString().trim();
            logs.push(logMsg);
            console.log(`Python stdout: ${logMsg}`);
            logHandler(logMsg);
          });
        }

        if (currentPythonProcess.stderr) {
          currentPythonProcess.stderr.on("data", (data: Buffer) => {
            const errorMsg = data.toString().trim();
            logs.push(`ERROR: ${errorMsg}`);
            console.error(`Python stderr: ${errorMsg}`);
            errorHandler(errorMsg);
          });
        }

        // Wait for the process to complete
        const exitCode = await new Promise<number>((resolve) => {
          if (currentPythonProcess) {
            currentPythonProcess.on("close", (code: number | null) => {
              currentPythonProcess = null;
              console.log(`Python process exited with code ${code}`);
              resolve(code || 0);
            });
          } else {
            resolve(1); // Error code if process wasn't created
          }
        });

        if (exitCode !== 0) {
          return {
            success: false,
            message: `Automation script exited with code ${exitCode}`,
            logs: logs,
          };
        }

        return {
          success: true,
          message: "Automation completed successfully",
          logs: logs,
          cdpPort: CDP_PORT,
        };
      } catch (error: unknown) {
        console.error("Error during browser automation:", error);
        // Kill Python process if it's still running
        if (currentPythonProcess) {
          try {
            currentPythonProcess.kill();
            currentPythonProcess = null;
          } catch (e) {
            console.error("Error killing Python process:", e);
          }
        }

        return {
          success: false,
          message: `Automation failed: ${(error as Error).message}`,
          logs: logs,
        };
      }
    },
  );

  // New handler for multiple tasks
  ipcMainHandle(
    "runBrowserAutomationTask",
    async (
      taskId: string,
      profile: string,
      prompt: string,
      modelConfig?: ModelConfig,
      runtimeOptions?: AutomationRuntimeOptions,
    ) => {
      console.log(
        `Running browser automation task ${taskId} with prompt: ${prompt} for profile: ${profile}`,
      );

      // Get settings from database if no model config provided
      if (!modelConfig) {
        try {
          const dbSettings = await AISettingsService.getActiveSettings();
          if (dbSettings) {
            modelConfig = {
              provider: dbSettings.provider as AIModelProvider,
              apiKey: dbSettings.apiKey || "",
              model: dbSettings.model,
              baseUrl: dbSettings.baseUrl || undefined,
              temperature: dbSettings.temperature,
              maxTokens: dbSettings.maxTokens,
              useVision: dbSettings.useVision ?? true,
            };
            console.log(
              `Using database settings for task ${taskId}: ${modelConfig.provider} model: ${modelConfig.model}`,
            );
          } else {
            console.log(
              `No active AI settings found in database for task ${taskId}`,
            );
          }
        } catch (error) {
          console.error(
            `Error retrieving AI settings from database for task ${taskId}:`,
            error,
          );
        }
      } else {
        console.log(
          `Using provided settings for task ${taskId}: ${modelConfig.provider} model: ${modelConfig.model}`,
        );
      }

      // Validate required settings
      if (!modelConfig || !modelConfig.model || !modelConfig.provider) {
        return {
          success: false,
          message:
            "Missing required AI model configuration. Please configure AI settings first.",
          logs: ["ERROR: Missing required AI model configuration"],
        };
      }

      // Check for API key for providers that require it
      if (
        [
          "openai",
          "anthropic",
          "google",
          "deepseek",
          "openrouter",
          "groq",
        ].includes(modelConfig.provider) &&
        !modelConfig.apiKey
      ) {
        return {
          success: false,
          message: `API key is required for ${modelConfig.provider}. Please add your API key in AI settings.`,
          logs: [`ERROR: Missing API key for ${modelConfig.provider}`],
        };
      }

      // Clean up any existing process for this task
      if (runningProcesses.has(taskId)) {
        try {
          const existingProcess = runningProcesses.get(taskId);
          existingProcess?.kill();
          runningProcesses.delete(taskId);
        } catch (e) {
          console.error(
            `Error killing previous Python process for task ${taskId}:`,
            e,
          );
        }
      }

      const logs: string[] = [];

      try {
        const appExePath = isDev()
          ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
          : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

        // Build command-line arguments
        const args = [
          "automation",
          "--prompt",
          prompt,
          "--port",
          (CDP_PORT + runningProcesses.size).toString(), // Use different ports for concurrent tasks
        ]; // Get browser settings to check browser path and profile
        // Add agent settings (wait_between_actions) if present
        try {
          const agentSettings = SettingsFileManager.getAgentSettings();
          if (
            agentSettings &&
            typeof agentSettings.wait_between_actions === "number"
          ) {
            args.push(
              "--wait-between-actions",
              agentSettings.wait_between_actions.toString(),
            );
          }
        } catch (e) {
          console.warn(`Failed to read agent settings for task ${taskId}:`, e);
        }
        try {
          const browserSettings = await BrowserSettingsService.getSettings(); // Add browser path based on which browser is selected
          if (
            browserSettings.useSystemBrowser &&
            browserSettings.systemBrowserPath
          ) {
            console.log(
              `Using system browser for task ${taskId}: ${browserSettings.systemBrowserPath}`,
            );
            args.push("--browser-path", browserSettings.systemBrowserPath);
          } else if (!browserSettings.useSystemBrowser) {
            // Using Installed Chromium Browser
            const chromiumStatus = SettingsFileManager.getChromiumStatus();
            if (chromiumStatus.installPath) {
              console.log(
                `Using Installed Chromium Browser for task ${taskId}: ${chromiumStatus.installPath}`,
              );
              args.push("--browser-path", chromiumStatus.installPath);
            } else {
              console.warn(
                `Installed Chromium Browser selected but no install path found for task ${taskId}!`,
              );
              return {
                success: false,
                message:
                  "Installed Chromium Browser is selected but Chromium is not properly installed. Please reinstall Chromium or switch to system browser.",
                logs: [
                  `ERROR: Missing Chromium install path for Installed Chromium Browser (task ${taskId})`,
                ],
              };
            }
          }

          // Use the specified profile for this task
          console.log(`Using browser profile for task ${taskId}: ${profile}`);
          args.push("--profile", profile);
        } catch (error) {
          console.error(
            `Error getting browser settings for task ${taskId}:`,
            error,
          );
          // Continue with default browser if there's an error
        }

        // Add model configuration parameters if provided
        if (modelConfig) {
          args.push("--provider", modelConfig.provider);
          args.push("--model", modelConfig.model);

          if (modelConfig.apiKey) {
            args.push("--api-key", modelConfig.apiKey);
          }

          if (modelConfig.baseUrl) {
            args.push("--base-url", modelConfig.baseUrl);
          }

          if (typeof modelConfig.temperature === "number") {
            args.push("--temperature", modelConfig.temperature.toString());
          }

          if (typeof modelConfig.maxTokens === "number") {
            args.push("--max-tokens", modelConfig.maxTokens.toString());
          }

          // Add use-vision parameter
          if (typeof modelConfig.useVision === "boolean") {
            args.push("--use-vision", modelConfig.useVision.toString());
          }
        }

        const configuredUploadDirectory =
          runtimeOptions?.fileUploadDirectory?.trim() ||
          SettingsFileManager.getAISettings().fileUploadDirectory?.trim();
        if (configuredUploadDirectory) {
          console.log(
            `[FILES] Using upload directory for task ${taskId}: ${configuredUploadDirectory}`,
          );
          args.push("--upload-directory", configuredUploadDirectory);
        }

        const walletPreparation = await prepareWalletIntegration(
          taskId,
          runtimeOptions,
          profile,
        );

        if (walletPreparation.logs.length) {
          logs.push(...walletPreparation.logs);

          const windows = BrowserWindow.getAllWindows();
          const mainWindow = windows.find((w) =>
            w.title.includes("Automation:"),
          );
          walletPreparation.logs.forEach((log) =>
            mainWindow?.webContents.send("browserAutomationLog", {
              taskId,
              log,
            }),
          );
        }

        if (walletPreparation.error) {
          logs.push(...walletPreparation.error.logs);
          return {
            success: false,
            message: walletPreparation.error.message,
            logs,
          };
        }

        args.push(...walletPreparation.args);

        const spawnEnv = {
          ...walletPreparation.env,
          PYTHONUNBUFFERED: "1", // Force unbuffered stdout/stderr for live logging
        };

        const pythonProcess = spawn(appExePath, args, {
          windowsHide: true, // Hide console window on Windows
          env: spawnEnv,
        });
        runningProcesses.set(taskId, pythonProcess);

        const logHandler = (log: string) => {
          logs.push(log);
          // Send logs to all windows to ensure they reach the UI
          const windows = BrowserWindow.getAllWindows();
          windows.forEach((window) => {
            if (!window.isDestroyed()) {
              window.webContents.send("browserAutomationLog", { taskId, log });
            }
          });
        };

        const errorHandler = (error: string) => {
          logs.push(`ERROR: ${error}`);
          const windows = BrowserWindow.getAllWindows();
          const mainWindow = windows.find((w) =>
            w.title.includes("Automation:"),
          );
          mainWindow?.webContents.send("browserAutomationError", {
            taskId,
            error,
          });
          console.error(`Python stderr for task ${taskId}: ${error}`);
        };

        // Variable to capture the final result JSON from Python output
        let automationResultData: AutomationResultData | undefined = undefined;

        // Send logs back to the renderer process
        if (pythonProcess.stdout) {
          pythonProcess.stdout.on("data", (data: Buffer) => {
            const logMsg = data.toString().trim();
            logs.push(logMsg);
            console.log(`Python stdout for task ${taskId}: ${logMsg}`);
            logHandler(logMsg);

            // Parse the final result JSON if present
            const completeMatch = logMsg.match(
              /\[COMPLETE\] Final result:\s*(.+)$/,
            );
            if (completeMatch) {
              try {
                automationResultData = JSON.parse(completeMatch[1]);
                console.log(`Parsed automation result data for task ${taskId}`);
              } catch (parseErr) {
                console.error(
                  `Failed to parse automation result for task ${taskId}:`,
                  parseErr,
                );
              }
            }
          });
        }

        if (pythonProcess.stderr) {
          pythonProcess.stderr.on("data", (data: Buffer) => {
            const errorMsg = data.toString().trim();
            logs.push(`ERROR: ${errorMsg}`);
            console.error(`Python stderr for task ${taskId}: ${errorMsg}`);
            errorHandler(errorMsg);
          });
        }

        // Wait for the process to complete
        const exitCode = await new Promise<number>((resolve) => {
          pythonProcess.on("close", (code: number | null) => {
            runningProcesses.delete(taskId);
            console.log(
              `Python process for task ${taskId} exited with code ${code}`,
            );
            resolve(code || 0);
          });
        });

        if (exitCode !== 0) {
          return {
            success: false,
            message: `Automation script for task ${taskId} exited with code ${exitCode}`,
            logs: logs,
            automationData: automationResultData,
          };
        }

        return {
          success: true,
          message: `Automation for task ${taskId} completed successfully`,
          logs: logs,
          automationData: automationResultData,
        };
      } catch (error: unknown) {
        console.error(
          `Error during browser automation for task ${taskId}:`,
          error,
        );
        // Kill Python process if it's still running
        if (runningProcesses.has(taskId)) {
          try {
            const process = runningProcesses.get(taskId);
            process?.kill();
            runningProcesses.delete(taskId);
          } catch (e) {
            console.error(
              `Error killing Python process for task ${taskId}:`,
              e,
            );
          }
        }

        return {
          success: false,
          message: `Automation failed for task ${taskId}: ${(error as Error).message}`,
          logs: logs,
          automationData: undefined,
        };
      }
    },
  );

  ipcMainHandle("stopBrowserAutomationTask", async (taskId: string) => {
    console.log(`Stopping browser automation task ${taskId}`);
    if (runningProcesses.has(taskId)) {
      try {
        const pythonProcess = runningProcesses.get(taskId);
        const pythonPID = pythonProcess?.pid;

        if (process.platform === "win32" && pythonPID) {
          // Force kill the entire process tree on Windows
          exec(
            `taskkill /F /T /PID ${pythonPID}`,
            (error: Error | null, stdout: string, stderr: string) => {
              if (error) {
                console.error(
                  `taskkill error for task ${taskId}: ${error.message}`,
                );
              }
              if (stderr) {
                console.error(`taskkill stderr for task ${taskId}: ${stderr}`);
              }
              if (stdout) {
                console.log(`taskkill stdout for task ${taskId}: ${stdout}`);
              }
            },
          );
        } else {
          // Fallback for non-Windows platforms
          pythonProcess?.kill();
        }

        runningProcesses.delete(taskId);
        return {
          success: true,
          message: `Task ${taskId} stopped successfully`,
        };
      } catch (e) {
        console.error(`Error killing Python process for task ${taskId}:`, e);
        return {
          success: false,
          message: `Failed to stop task ${taskId}: ${(e as Error).message}`,
        };
      }
    }
    return {
      success: true,
      message: `No active automation to stop for task ${taskId}`,
    };
  });
}
