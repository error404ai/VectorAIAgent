import { ChildProcess, spawn } from "child_process";
import { app, BrowserWindow } from "electron";
import * as fs from "fs";
import * as path from "path";
import { BROWSER_PATHS } from "../../constants.js";
import BrowserSettingsService from "../../services/BrowserSettingsService.js";
import SettingsFileManager from "../../services/SettingsFileManager.js";
import { ipcMainHandle, isDev } from "../../util.js";

// Keep track of any open browser processes
let currentBrowserProcess: ChildProcess | null = null;

// Default Chrome path for Windows
const DEFAULT_CHROME_PATH = BROWSER_PATHS.WINDOWS_CHROME;

export function registerBrowserOpenerHandlers() {
  ipcMainHandle(
    "openBrowser",
    async (
      url: string = "https://www.google.com",
      useSystemBrowser?: boolean,
      systemBrowserPath?: string,
    ) => {
      console.log(`Opening browser with URL: ${url}`);

      // Get the browser settings
      const settings = await BrowserSettingsService.getSettings();

      // Use the parameter if provided, otherwise use the settings
      if (useSystemBrowser === undefined) {
        useSystemBrowser = settings.useSystemBrowser ?? true; // Default to system browser
      }

      // If there's an existing browser process, we don't need to kill it
      // Users can have multiple browser windows open
      const logs: string[] = [];
      try {
        // Get the path to the Python executable
        const appExePath = isDev()
          ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
          : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe"); // Prepare the command arguments
        const args = ["browser", "--url", url];

        if (useSystemBrowser) {
          // Get the browser path:
          // 1. Use path provided directly in the function call if available
          // 2. Otherwise use path from settings if available
          // 3. Finally fall back to default Chrome path
          const browserPath =
            systemBrowserPath ||
            settings.systemBrowserPath ||
            DEFAULT_CHROME_PATH;

          logs.push(`🌐 Opening URL in system browser: ${url}`);
          logs.push(`Browser path: ${browserPath}`);

          // Check if the browser path exists
          if (!fs.existsSync(browserPath)) {
            logs.push(
              `⚠️ Warning: Browser path does not exist: ${browserPath}`,
            );
            logs.push(`Falling back to Installed Chromium browser`);
          } else {
            // Add the browser path argument
            args.push("--browser-path", browserPath);
          }
        } else {
          // Using Installed Chromium Browser
          const chromiumStatus = SettingsFileManager.getChromiumStatus();
          if (chromiumStatus.installPath) {
            logs.push(`🌐 Opening URL in Installed Chromium browser: ${url}`);
            logs.push(`Chromium path: ${chromiumStatus.installPath}`);
            args.push("--browser-path", chromiumStatus.installPath);
          } else {
            logs.push(`🌐 Opening URL in Installed Chromium browser: ${url}`);
            logs.push(
              `⚠️ Warning: Chromium install path not found, using default behavior`,
            );
          }
        }

        // Spawn the Python process with the appropriate arguments
        currentBrowserProcess = spawn(appExePath, args, {
          windowsHide: true, // Hide console window on Windows
        });

        const logHandler = (log: string) => {
          logs.push(log);
          // Use BrowserWindow.getAllWindows() to find the automation window
          const windows = BrowserWindow.getAllWindows();
          const mainWindow = windows.find((w) =>
            w.title.includes("Automation:"),
          );
          mainWindow?.webContents.send("browserAutomationLog", log);
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
        if (currentBrowserProcess.stdout) {
          currentBrowserProcess.stdout.on("data", (data: Buffer) => {
            const logMsg = data.toString().trim();
            logs.push(logMsg);
            console.log(`Python stdout: ${logMsg}`);
            logHandler(logMsg);
          });
        }

        if (currentBrowserProcess.stderr) {
          currentBrowserProcess.stderr.on("data", (data: Buffer) => {
            const errorMsg = data.toString().trim();
            logs.push(`ERROR: ${errorMsg}`);
            console.error(`Python stderr: ${errorMsg}`);
            errorHandler(errorMsg);
          });
        }

        // Wait for the process to complete
        const exitCode = await new Promise<number>((resolve) => {
          if (currentBrowserProcess) {
            currentBrowserProcess.on("close", (code: number | null) => {
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
            message: `Failed to open browser (exit code ${exitCode})`,
            logs: logs,
          };
        }

        return {
          success: true,
          message: "Browser opened successfully",
          logs: logs,
        };
      } catch (error) {
        console.error("Error opening browser:", error);
        return {
          success: false,
          message: `Failed to open browser: ${(error as Error).message}`,
          logs: logs,
        };
      }
    },
  );

  // Profile handlers have been moved to browserSettingsHandler.ts to avoid conflicts
}
