// src/electron/ipcHandlers/browser/browserSettingsHandler.ts
import { spawn } from "child_process";
import { app } from "electron";
import * as path from "path";
import { BROWSER_PATHS } from "../../constants.js";
import BrowserSettingsService, {
  BrowserSettings,
} from "../../services/BrowserSettingsService.js";
import SettingsFileManager from "../../services/SettingsFileManager.js";
import { ipcMainHandle } from "../../util.js";

// Helper to check if we're in development mode
function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export default function registerBrowserSettingsHandlers() {
  ipcMainHandle("getBrowserSettings", async () => {
    try {
      const settings = await BrowserSettingsService.getSettings();
      const chromiumStatus = SettingsFileManager.getChromiumStatus();

      return {
        useSystemBrowser: settings.useSystemBrowser ?? true, // Default to system browser
        defaultUrl: settings.defaultUrl ?? "https://www.google.com",
        availableProfiles: settings.availableProfiles || ["default_profile"],
        browserProfiles: {}, // Legacy field for backward compatibility
        chromiumInstalled: chromiumStatus.isInstalled,
        chromiumVersion: chromiumStatus.version || undefined,
        chromiumInstallPath: chromiumStatus.installPath || undefined,
        ...(settings.systemBrowserPath !== undefined &&
        settings.systemBrowserPath !== null
          ? { systemBrowserPath: settings.systemBrowserPath }
          : { systemBrowserPath: BROWSER_PATHS.WINDOWS_CHROME }), // Default Chrome path
      };
    } catch (error) {
      console.error("Error getting browser settings:", error);
      // Return default settings if there is an error
      return {
        useSystemBrowser: true, // Default to system browser
        systemBrowserPath: BROWSER_PATHS.WINDOWS_CHROME, // Default Chrome path
        defaultUrl: "https://www.google.com",
        availableProfiles: ["default_profile"],
        browserProfiles: {},
        chromiumInstalled: false,
        chromiumVersion: undefined,
        chromiumInstallPath: undefined,
      };
    }
  });

  ipcMainHandle(
    "saveBrowserSettings",
    async (settings: Partial<BrowserSettings>) => {
      try {
        await BrowserSettingsService.saveSettings(settings);
        return { success: true };
      } catch (error) {
        console.error("Error saving browser settings:", error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // Get browser profiles from python exe
  ipcMainHandle("getBrowserProfiles", async () => {
    try {
      console.log("Getting browser profiles from Python exe...");

      // Get the Python exe path based on environment - same logic as other handlers
      const appExePath = isDev()
        ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
        : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

      console.log(`Calling Python exe at: ${appExePath}`);

      return new Promise((resolve, reject) => {
        console.log(`Running command: ${appExePath} profiles --list`);

        const child = spawn(appExePath, ["profiles", "--list"], {
          stdio: ["inherit", "pipe", "pipe"],
          windowsHide: true, // Hide console window on Windows
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
            PYTHONUNBUFFERED: "1",
          },
        });

        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr?.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", (code) => {
          console.log(`Python process exited with code: ${code}`);
          console.log(`Stdout: ${stdout}`);
          console.log(`Stderr: ${stderr}`);

          if (code === 0) {
            try {
              // Extract JSON from the output (ignoring log messages)
              const jsonMatch = stdout.match(/\{.*\}/s);
              if (jsonMatch) {
                const profileData = JSON.parse(jsonMatch[0]);
                console.log("Parsed profiles:", profileData);

                // Return the raw profile data as expected by the type definition
                resolve(profileData);
              } else {
                console.error("No JSON found in output:", stdout);
                reject(new Error("No valid JSON response found"));
              }
            } catch (parseError) {
              console.error("Failed to parse Python response:", parseError);
              console.error("Raw stdout:", stdout);
              reject(new Error(`Failed to parse profiles data: ${parseError}`));
            }
          } else {
            console.error("Python process failed with code:", code);
            console.error("Error output:", stderr);
            reject(
              new Error(
                `Failed to get profiles: ${stderr || "Python process failed"}`,
              ),
            );
          }
        });

        child.on("error", (error) => {
          console.error("Failed to spawn Python process:", error);
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });
      });
    } catch (error) {
      console.error("Error in getBrowserProfiles:", error);
      throw new Error(
        `Failed to get profiles: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  // Create browser profile
  ipcMainHandle(
    "createBrowserProfile",
    async (profileName: string, browserPath: string) => {
      try {
        if (!profileName || profileName.trim() === "") {
          return {
            success: false,
            message: "Profile name cannot be empty",
          };
        }

        const sanitizedName = profileName.replace(/[^a-zA-Z0-9_]/g, "_");

        const appExePath = isDev()
          ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
          : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

        const args = [
          "profiles",
          "--create",
          sanitizedName,
          "--browser-path",
          browserPath,
        ];

        console.log(`Creating browser profile with args: ${args.join(" ")}`);

        const pythonProcess = spawn(appExePath, args, {
          windowsHide: true, // Hide console window on Windows
        });

        return new Promise<{ success: boolean; message: string }>((resolve) => {
          let error = "";

          pythonProcess.stdout.on("data", (data) => {
            // Process stdout if needed
            console.log("Profile creation output:", data.toString());
          });

          pythonProcess.stderr.on("data", (data) => {
            error += data.toString();
          });

          pythonProcess.on("close", (code) => {
            if (code !== 0) {
              console.error(`Python process exited with code ${code}`);
              return resolve({
                success: false,
                message: `Failed to create profile: ${error || "Unknown error"}`,
              });
            }

            return resolve({
              success: true,
              message: `Browser profile '${sanitizedName}' created successfully`,
            });
          });
        });
      } catch (error) {
        console.error("Error creating browser profile:", error);
        return {
          success: false,
          message: `Failed to create profile: ${(error as Error).message}`,
        };
      }
    },
  );

  // Delete browser profile
  ipcMainHandle(
    "deleteBrowserProfile",
    async (profileName: string, browserPath?: string) => {
      try {
        if (!profileName || profileName.trim() === "") {
          return {
            success: false,
            message: "Profile name cannot be empty",
          };
        }

        // Don't allow deleting the default profile
        if (profileName === "default_profile") {
          return {
            success: false,
            message: "Cannot delete the default profile",
          };
        }

        // Get the path to the Python executable
        const appExePath = isDev()
          ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
          : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

        // Create a command to execute using the compiled exe
        const args = ["profiles", "--delete", profileName];

        // Add browser path if provided
        if (browserPath && browserPath.trim() !== "") {
          args.push("--browser-path", browserPath);
        }

        console.log(`Deleting browser profile with args: ${args.join(" ")}`);

        const pythonProcess = spawn(appExePath, args, {
          windowsHide: true, // Hide console window on Windows
        });

        return new Promise<{ success: boolean; message: string }>((resolve) => {
          let error = "";

          pythonProcess.stdout.on("data", (data) => {
            // Process stdout if needed
            console.log("Profile deletion output:", data.toString());
          });

          pythonProcess.stderr.on("data", (data) => {
            error += data.toString();
          });

          pythonProcess.on("close", (code) => {
            if (code !== 0) {
              console.error(`Python process exited with code ${code}`);
              return resolve({
                success: false,
                message: `Failed to delete profile: ${error || "Unknown error"}`,
              });
            }

            return resolve({
              success: true,
              message: `Browser profile '${profileName}' deleted successfully`,
            });
          });
        });
      } catch (error) {
        console.error("Error deleting browser profile:", error);
        return {
          success: false,
          message: `Failed to delete profile: ${(error as Error).message}`,
        };
      }
    },
  );

  // Delete all browser profiles
  ipcMainHandle("deleteAllBrowserProfiles", async () => {
    try {
      // Get the path to the Python executable
      const appExePath = isDev()
        ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
        : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

      // Create a command to execute using the compiled exe
      const args = ["profiles", "--delete-all"];

      console.log(
        `Deleting all browser profiles with command: ${appExePath} ${args.join(" ")}`,
      );

      const pythonProcess = spawn(appExePath, args, {
        windowsHide: true, // Hide console window on Windows
      });

      return new Promise<{ success: boolean; message: string }>((resolve) => {
        let error = "";

        pythonProcess.stdout.on("data", (data) => {
          // Process stdout if needed
          console.log("Delete all profiles output:", data.toString());
        });

        pythonProcess.stderr.on("data", (data) => {
          error += data.toString();
        });

        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            console.error(`Python process exited with code ${code}`);
            return resolve({
              success: false,
              message: `Failed to delete all profiles: ${error || "Unknown error"}`,
            });
          }

          return resolve({
            success: true,
            message: "All browser profiles deleted successfully",
          });
        });
      });
    } catch (error) {
      console.error("Error deleting all browser profiles:", error);
      return {
        success: false,
        message: `Failed to delete all profiles: ${(error as Error).message}`,
      };
    }
  });

  ipcMainHandle("updateAvailableProfiles", async (profiles: string[]) => {
    try {
      await BrowserSettingsService.updateAvailableProfiles(profiles);
      return { success: true };
    } catch (error) {
      console.error("Error updating available profiles:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Handler for opening browser with specific profile
  ipcMainHandle(
    "openBrowserWithProfile",
    async (
      url: string = "https://www.google.com",
      profileName: string = "default_profile",
      useSystemBrowser?: boolean,
      browserPath?: string,
    ) => {
      console.log(
        `Opening browser with profile: ${profileName} at URL: ${url}`,
      );

      try {
        // Get the browser settings to determine browser configuration
        const settings = await BrowserSettingsService.getSettings();

        // Use parameter values if provided, otherwise use settings
        const actualUseSystemBrowser =
          useSystemBrowser !== undefined
            ? useSystemBrowser
            : (settings.useSystemBrowser ?? true);
        let actualBrowserPath = browserPath;

        if (!actualBrowserPath) {
          if (actualUseSystemBrowser) {
            actualBrowserPath =
              settings.systemBrowserPath || BROWSER_PATHS.WINDOWS_CHROME;
          } else {
            const chromiumStatus = SettingsFileManager.getChromiumStatus();
            actualBrowserPath = chromiumStatus.installPath || "";
          }
        }

        // Get the path to the Python executable
        const appExePath = isDev()
          ? path.join(app.getAppPath(), "python", "dist", "whiskey_app.exe")
          : path.join(app.getAppPath(), "..", "automation", "whiskey_app.exe");

        // Prepare the command arguments
        const args = ["browser", "--url", url, "--profile", profileName];

        // Add browser path if provided
        if (actualBrowserPath) {
          args.push("--browser-path", actualBrowserPath);
        }

        console.log(
          `Opening browser with profile command: ${appExePath} ${args.join(" ")}`,
        );

        const pythonProcess = spawn(appExePath, args, {
          windowsHide: true, // Hide console window on Windows
        });

        // Don't wait for the process to finish, as the browser should stay open
        // Just check if the process started successfully
        let hasStarted = false;
        const startTimeout = setTimeout(() => {
          if (!hasStarted) {
            console.log(
              "Browser process started successfully (timeout reached)",
            );
          }
        }, 2000);

        pythonProcess.stdout.on("data", (data) => {
          const output = data.toString();
          console.log("Browser startup output:", output);

          // Look for success indicators in the output
          if (
            output.includes("[SUCCESS]") ||
            output.includes("Browser opened successfully")
          ) {
            hasStarted = true;
            clearTimeout(startTimeout);
          }
        });

        pythonProcess.stderr.on("data", (data) => {
          console.error("Browser startup error:", data.toString());
        });

        pythonProcess.on("close", (code) => {
          console.log(`Browser process exited with code ${code}`);
        });

        // Return success immediately since we don't want to wait for the browser to close
        return {
          success: true,
          message: `Browser opened with profile: ${profileName}`,
        };
      } catch (error) {
        console.error("Error opening browser with profile:", error);
        return {
          success: false,
          message: `Failed to open browser: ${(error as Error).message}`,
        };
      }
    },
  );
}
