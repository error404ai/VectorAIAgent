// src/electron/ipcHandlers/browser/chromiumHandler.ts
import { spawn } from "child_process";
import { app } from "electron";
import * as path from "path";
import BrowserSettingsService from "../../services/BrowserSettingsService.js";
import { ipcMainHandle, isDev } from "../../util.js";

export function registerChromiumHandlers() {
  // Check Chromium installation status
  ipcMainHandle("checkChromiumStatus", async () => {
    console.log("Checking Chromium installation status");

    try {
      // Get the path to the Python executable
      const appExePath = isDev()
        ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
        : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

      // Run the Python command to check Chromium status
      console.log(`Running command: ${appExePath} chromium --status`);
      const pythonProcess = spawn(appExePath, ["chromium", "--status"], {
        windowsHide: true, // Hide console window on Windows
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUNBUFFERED: "1",
        },
      });

      return new Promise<{
        isInstalled: boolean;
        version?: string;
        installPath?: string;
      }>((resolve, reject) => {
        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data: Buffer) => {
          output += data.toString();
        });

        pythonProcess.stderr.on("data", (data: Buffer) => {
          errorOutput += data.toString();
        });

        pythonProcess.on("close", async (code: number | null) => {
          console.log(`Chromium status check process exited with code ${code}`);

          if (code !== 0) {
            console.error("Error checking Chromium status:", errorOutput);
            resolve({
              isInstalled: false,
            });
            return;
          }

          try {
            // Parse the JSON output
            const jsonMatch = output.match(/\{.*\}/s);
            if (jsonMatch) {
              const status = JSON.parse(jsonMatch[0]);

              // Update database with the status
              await BrowserSettingsService.updateChromiumStatus({
                installed: status.isInstalled || false,
                version: status.version,
                installPath: status.installPath,
              });

              resolve({
                isInstalled: status.isInstalled || false,
                version: status.version,
                installPath: status.installPath,
              });
            } else {
              console.error("Could not parse Chromium status output");
              resolve({
                isInstalled: false,
              });
            }
          } catch (error) {
            console.error("Error parsing Chromium status:", error);
            resolve({
              isInstalled: false,
            });
          }
        });

        pythonProcess.on("error", (error) => {
          console.error("Error running Chromium status check:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error checking Chromium status:", error);
      throw error;
    }
  });

  // Install Chromium
  ipcMainHandle("installChromium", async () => {
    console.log("Starting Chromium installation");

    try {
      // Get the path to the Python executable
      const appExePath = isDev()
        ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
        : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

      // Run the Python command to install Chromium
      console.log(`Running command: ${appExePath} chromium --install`);
      const pythonProcess = spawn(appExePath, ["chromium", "--install"], {
        windowsHide: true, // Hide console window on Windows
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUNBUFFERED: "1",
        },
      });

      return new Promise<{
        success: boolean;
        message: string;
        progress?: number;
      }>((resolve, reject) => {
        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data: Buffer) => {
          const chunk = data.toString();
          output += chunk;

          // Log progress to console
          console.log("Install progress:", chunk.trim());
        });

        pythonProcess.stderr.on("data", (data: Buffer) => {
          errorOutput += data.toString();
        });

        pythonProcess.on("close", async (code: number | null) => {
          console.log(`Chromium installation process exited with code ${code}`);

          if (code !== 0) {
            console.error("Error installing Chromium:", errorOutput);
            resolve({
              success: false,
              message: `Installation failed: ${errorOutput}`,
            });
            return;
          }

          try {
            // Parse the JSON output
            const jsonMatch = output.match(/\{.*\}/s);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);

              // Update database with the new status if installation was successful
              if (result.success && result.status) {
                await BrowserSettingsService.updateChromiumStatus({
                  installed: result.status.isInstalled || false,
                  version: result.status.version,
                  installPath: result.status.installPath,
                });
              }

              resolve({
                success: result.success || false,
                message: result.message || "Installation completed",
                progress: result.progress || 100,
              });
            } else {
              console.error("Could not parse Chromium installation output");
              resolve({
                success: false,
                message: "Installation completed but could not parse result",
              });
            }
          } catch (error) {
            console.error("Error parsing Chromium installation result:", error);
            resolve({
              success: false,
              message: `Installation may have completed but could not parse result: ${error}`,
            });
          }
        });

        pythonProcess.on("error", (error) => {
          console.error("Error running Chromium installation:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error installing Chromium:", error);
      throw error;
    }
  });

  // Uninstall Chromium
  ipcMainHandle("uninstallChromium", async () => {
    console.log("Starting Chromium uninstallation");

    try {
      // Get the path to the Python executable
      const appExePath = isDev()
        ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
        : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

      // Run the Python command to uninstall Chromium
      console.log(`Running command: ${appExePath} chromium --uninstall`);
      const pythonProcess = spawn(appExePath, ["chromium", "--uninstall"], {
        windowsHide: true, // Hide console window on Windows
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUNBUFFERED: "1",
        },
      });

      return new Promise<{
        success: boolean;
        message: string;
      }>((resolve, reject) => {
        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data: Buffer) => {
          const chunk = data.toString();
          output += chunk;

          // Log progress to console
          console.log("Uninstall progress:", chunk.trim());
        });

        pythonProcess.stderr.on("data", (data: Buffer) => {
          errorOutput += data.toString();
        });

        pythonProcess.on("close", async (code: number | null) => {
          console.log(
            `Chromium uninstallation process exited with code ${code}`,
          );

          if (code !== 0) {
            console.error("Error uninstalling Chromium:", errorOutput);
            resolve({
              success: false,
              message: `Uninstallation failed: ${errorOutput}`,
            });
            return;
          }

          try {
            // Parse the JSON output
            const jsonMatch = output.match(/\{.*\}/s);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);

              // Update database - mark as uninstalled
              await BrowserSettingsService.updateChromiumStatus({
                installed: false,
                version: undefined,
                installPath: undefined,
              });

              resolve({
                success: result.success || false,
                message: result.message || "Uninstallation completed",
              });
            } else {
              console.error("Could not parse Chromium uninstallation output");

              // Still mark as uninstalled in database
              await BrowserSettingsService.updateChromiumStatus({
                installed: false,
                version: undefined,
                installPath: undefined,
              });

              resolve({
                success: true,
                message: "Uninstallation completed",
              });
            }
          } catch (error) {
            console.error(
              "Error parsing Chromium uninstallation result:",
              error,
            );

            // Still mark as uninstalled in database
            await BrowserSettingsService.updateChromiumStatus({
              installed: false,
              version: undefined,
              installPath: undefined,
            });

            resolve({
              success: true,
              message: "Uninstallation may have completed",
            });
          }
        });

        pythonProcess.on("error", (error) => {
          console.error("Error running Chromium uninstallation:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error uninstalling Chromium:", error);
      throw error;
    }
  });
}
