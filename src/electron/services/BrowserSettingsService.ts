// src/electron/services/BrowserSettingsService.ts

import SettingsFileManager from "./SettingsFileManager.js";

// Define the browser info interface
interface BrowserInfo {
  profiles: string[];
  browser_path: string;
  browser_name: string;
}

interface ChromiumStatus {
  isInstalled: boolean;
  version?: string;
  installPath?: string;
  lastChecked?: Date;
}

export interface BrowserSettings {
  useSystemBrowser: boolean;
  systemBrowserPath: string;
  defaultUrl: string;
  selectedProfile: string;
  availableProfiles: string[];
}

class BrowserSettingsService {
  async getSettings(): Promise<BrowserSettings> {
    return SettingsFileManager.getBrowserSettings();
  }

  async saveSettings(
    settings: Partial<BrowserSettings>,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      SettingsFileManager.saveBrowserSettings(settings);
      return { success: true };
    } catch (error) {
      console.error("Error saving browser settings:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getAvailableProfiles(): Promise<string[]> {
    const settings = SettingsFileManager.getBrowserSettings();
    return settings.availableProfiles;
  }

  async createProfile(
    profileName: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const settings = SettingsFileManager.getBrowserSettings();

      if (settings.availableProfiles.includes(profileName)) {
        return { success: false, message: "Profile already exists" };
      }

      settings.availableProfiles.push(profileName);
      SettingsFileManager.saveBrowserSettings(settings);

      return { success: true };
    } catch (error) {
      console.error("Error creating profile:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteProfile(
    profileName: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const settings = SettingsFileManager.getBrowserSettings();

      if (!settings.availableProfiles.includes(profileName)) {
        return { success: false, message: "Profile not found" };
      }

      if (profileName === "default_profile") {
        return { success: false, message: "Cannot delete default profile" };
      }

      settings.availableProfiles = settings.availableProfiles.filter(
        (p) => p !== profileName,
      );

      // If the deleted profile was selected, switch to default
      if (settings.selectedProfile === profileName) {
        settings.selectedProfile = "default_profile";
      }

      SettingsFileManager.saveBrowserSettings(settings);

      return { success: true };
    } catch (error) {
      console.error("Error deleting profile:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteAllProfiles(): Promise<{ success: boolean; message?: string }> {
    try {
      const settings = SettingsFileManager.getBrowserSettings();
      settings.availableProfiles = ["default_profile"];
      settings.selectedProfile = "default_profile";
      SettingsFileManager.saveBrowserSettings(settings);

      return { success: true };
    } catch (error) {
      console.error("Error deleting all profiles:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Legacy methods for backward compatibility
  async getBrowserInfo(): Promise<BrowserInfo> {
    return {
      profiles: ["default_profile"],
      browser_path: "",
      browser_name: "chrome",
    };
  }

  async updateBrowserProfiles(_profiles: unknown): Promise<void> {
    // No-op since we don't manage browser profiles anymore
    console.log(
      "updateBrowserProfiles is deprecated - profiles managed differently now",
    );
    // Suppress unused parameter warning
    void _profiles;
  }

  async updateAvailableProfiles(profiles: string[]): Promise<void> {
    const settings = SettingsFileManager.getBrowserSettings();
    settings.availableProfiles = profiles;
    SettingsFileManager.saveBrowserSettings(settings);
  }

  async updateChromiumStatus(status: unknown): Promise<void> {
    SettingsFileManager.saveChromiumStatus(status as ChromiumStatus);
  }
}

export default new BrowserSettingsService();
