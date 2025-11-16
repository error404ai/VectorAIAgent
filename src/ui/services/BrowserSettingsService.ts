import type { Window } from "../../../types/global-types";
import { useBrowserSettingsStore } from "../stores/BrowserSettingsStore";

export interface BrowserInfo {
  profiles: string[];
  browser_path: string;
  browser_name: string;
}

export interface BrowserSettings {
  useSystemBrowser: boolean;
  systemBrowserPath?: string;
  defaultUrl: string;
  selectedProfile?: string;
  availableProfiles?: string[];
  browserProfiles?: Record<string, BrowserInfo>; // Enhanced field with browser metadata
  chromiumInstalled?: boolean;
  chromiumVersion?: string;
  chromiumInstallPath?: string;
}

class BrowserSettingsService {
  async getAvailableProfiles(): Promise<string[]> {
    const settings = useBrowserSettingsStore.getState().settings;
    return settings.availableProfiles || ["default_profile"];
  }

  async refreshProfilesFromBackend(): Promise<{
    success: boolean;
    profiles?: string[];
    message?: string;
  }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;

      // Call backend to get fresh profile list (Python exe integration)
      const result = await electronAPI.getBrowserProfiles();

      // result is the raw profile data object (all browsers)
      if (result && typeof result === "object") {
        // Get current browser settings
        const store = useBrowserSettingsStore.getState();
        const currentSettings = store.settings;

        // Update settings with the complete browser profiles data
        const updatedSettings = {
          ...currentSettings,
          browserProfiles: result, // Store the complete data
        };

        // Filter profiles based on current browser selection
        let currentProfiles: string[] = ["default_profile"];

        if (updatedSettings.browserProfiles) {
          if (updatedSettings.useSystemBrowser) {
            // For system browser, match by exact browser_path
            const systemPath = updatedSettings.systemBrowserPath || "";
            for (const browserInfo of Object.values(
              updatedSettings.browserProfiles,
            )) {
              if (browserInfo.browser_path === systemPath) {
                currentProfiles = browserInfo.profiles;
                console.log(
                  "Found system browser profiles:",
                  currentProfiles,
                  "for path:",
                  systemPath,
                );
                break;
              }
            }
          } else {
            // For Chromium browser, prioritize built-in chromium first
            let found = false;

            // First try to find built-in chromium
            for (const browserInfo of Object.values(
              updatedSettings.browserProfiles,
            )) {
              if (browserInfo.browser_name === "builtin_chromium") {
                currentProfiles = browserInfo.profiles;
                console.log(
                  "Found builtin chromium profiles:",
                  currentProfiles,
                );
                found = true;
                break;
              }
            }

            // If no built-in chromium found and we have a chromium install path, match by that
            if (!found && updatedSettings.chromiumInstallPath) {
              for (const browserInfo of Object.values(
                updatedSettings.browserProfiles,
              )) {
                if (
                  browserInfo.browser_path ===
                  updatedSettings.chromiumInstallPath
                ) {
                  currentProfiles = browserInfo.profiles;
                  console.log(
                    "Found chromium install profiles:",
                    currentProfiles,
                    "for path:",
                    updatedSettings.chromiumInstallPath,
                  );
                  found = true;
                  break;
                }
              }
            }

            if (!found) {
              console.log(
                "No matching chromium browser found, using default profiles",
              );
            }
          }
        }

        // Update availableProfiles with filtered profiles for current browser
        updatedSettings.availableProfiles = currentProfiles;

        // Save to Zustand store
        store.setSettings(updatedSettings);

        console.log("Refreshed browser profiles:", {
          allBrowsers: Object.keys(result),
          useSystemBrowser: updatedSettings.useSystemBrowser,
          systemBrowserPath: updatedSettings.systemBrowserPath,
          chromiumInstallPath: updatedSettings.chromiumInstallPath,
          filteredProfiles: currentProfiles,
        });

        return { success: true, profiles: currentProfiles };
      } else {
        return {
          success: false,
          message: "Failed to get profiles - no valid data received",
        };
      }
    } catch (error) {
      console.error("Error refreshing profiles:", error);
      return {
        success: false,
        message: "Failed to refresh profiles from backend",
      };
    }
  }

  async createProfile(
    profileName: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;

      // Call backend to create profile (Python exe integration)
      const result = await electronAPI.createBrowserProfile(profileName, "");

      if (result.success) {
        // Update Zustand state instead of database
        const store = useBrowserSettingsStore.getState();
        const settings = store.settings;

        if (!(settings.availableProfiles || []).includes(profileName)) {
          const currentProfiles = settings.availableProfiles || [
            "default_profile",
          ];
          const updatedProfiles = [...currentProfiles, profileName];
          store.setSettings({
            ...settings,
            availableProfiles: updatedProfiles,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error creating profile:", error);
      return { success: false, message: "Failed to create profile" };
    }
  }

  async deleteProfile(
    profileName: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;

      // Call backend to delete profile (Python exe integration)
      const result = await electronAPI.deleteBrowserProfile(profileName);

      if (result.success) {
        // Update Zustand state instead of database
        const store = useBrowserSettingsStore.getState();
        const settings = store.settings;

        const currentProfiles = settings.availableProfiles || [
          "default_profile",
        ];
        const updatedProfiles = currentProfiles.filter(
          (p: string) => p !== profileName,
        );
        const updatedSettings = {
          ...settings,
          availableProfiles: updatedProfiles,
          selectedProfile:
            settings.selectedProfile === profileName
              ? "default_profile"
              : settings.selectedProfile,
        };

        store.setSettings(updatedSettings);
      }

      return result;
    } catch (error) {
      console.error("Error deleting profile:", error);
      return { success: false, message: "Failed to delete profile" };
    }
  }

  async deleteAllProfiles(): Promise<{ success: boolean; message?: string }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;

      // Call backend to delete all profiles (Python exe integration)
      const result = await electronAPI.deleteAllBrowserProfiles();

      if (result.success) {
        // Update Zustand state instead of database
        const store = useBrowserSettingsStore.getState();
        const settings = store.settings;

        const updatedSettings = {
          ...settings,
          availableProfiles: ["default_profile"],
          selectedProfile: "default_profile",
        };

        store.setSettings(updatedSettings);
      }

      return result;
    } catch (error) {
      console.error("Error deleting all profiles:", error);
      return { success: false, message: "Failed to delete all profiles" };
    }
  }

  async saveSettings(
    settings: Partial<BrowserSettings>,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Update Zustand state (persisted automatically)
      const store = useBrowserSettingsStore.getState();
      const updatedSettings = { ...store.settings, ...settings };
      store.setSettings(updatedSettings);

      // Also sync to backend for Electron main process
      const electronAPI = (window as unknown as Window).electronAPI;
      await electronAPI.saveBrowserSettings(updatedSettings);

      return { success: true };
    } catch (error) {
      console.error("Error saving settings:", error);
      return { success: false, message: "Failed to save settings" };
    }
  }

  async loadSettings(): Promise<BrowserSettings> {
    try {
      // Get initial settings from backend for sync
      const electronAPI = (window as unknown as Window).electronAPI;
      const backendSettings = await electronAPI.getBrowserSettings();

      // Update Zustand state with backend data
      const store = useBrowserSettingsStore.getState();
      const mergedSettings = { ...store.settings, ...backendSettings };
      store.setSettings(mergedSettings);

      return mergedSettings;
    } catch (error) {
      console.error("Error loading settings:", error);
      // Return current state if backend fails
      return useBrowserSettingsStore.getState().settings;
    }
  }

  async getSettings(): Promise<BrowserSettings> {
    return useBrowserSettingsStore.getState().settings;
  }

  async getBrowserProfiles(): Promise<Record<string, BrowserInfo>> {
    try {
      // Get browser profiles from Python exe via backend
      const electronAPI = (window as unknown as Window).electronAPI;
      const profiles = await electronAPI.getBrowserProfiles();

      // Extract profile names and update Zustand state
      const profileNames: string[] = [];
      Object.values(profiles).forEach((browserInfo: BrowserInfo) => {
        profileNames.push(...browserInfo.profiles);
      });

      if (profileNames.length > 0) {
        const store = useBrowserSettingsStore.getState();
        const settings = store.settings;
        const currentProfiles = settings.availableProfiles || [
          "default_profile",
        ];
        const updatedSettings = {
          ...settings,
          availableProfiles: [
            ...new Set([...currentProfiles, ...profileNames]),
          ],
        };
        store.setSettings(updatedSettings);
      }

      return profiles;
    } catch (error) {
      console.error("Error getting browser profiles:", error);
      return {
        default: {
          profiles: ["default_profile"],
          browser_path: "",
          browser_name: "System Default",
        },
      };
    }
  }

  async openBrowser(
    url: string,
    profile?: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;
      const result = await electronAPI.openBrowser(url, false, profile);
      return result;
    } catch (error) {
      console.error("Error opening browser:", error);
      return { success: false, message: "Failed to open browser" };
    }
  }

  async checkChromiumStatus(): Promise<{
    isInstalled: boolean;
    version?: string;
    installPath?: string;
  }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;
      const result = await electronAPI.checkChromiumStatus();
      return result;
    } catch (error) {
      console.error("Error checking chromium status:", error);
      return { isInstalled: false };
    }
  }

  async installChromium(): Promise<{ success: boolean; message?: string }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;
      const result = await electronAPI.installChromium();
      return result;
    } catch (error) {
      console.error("Error installing chromium:", error);
      return { success: false, message: "Failed to install chromium" };
    }
  }

  async uninstallChromium(): Promise<{ success: boolean; message?: string }> {
    try {
      const electronAPI = (window as unknown as Window).electronAPI;
      const result = await electronAPI.uninstallChromium();
      return result;
    } catch (error) {
      console.error("Error uninstalling chromium:", error);
      return { success: false, message: "Failed to uninstall chromium" };
    }
  }
}

export default new BrowserSettingsService();
