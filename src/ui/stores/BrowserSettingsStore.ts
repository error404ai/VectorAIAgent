import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BrowserSettings } from "../services/BrowserSettingsService";

export interface BrowserSettingsState {
  // Save status for browser settings
  savedStatus: {
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  };

  // Browser settings
  settings: BrowserSettings;
  hasUnsavedChanges: boolean;

  // Actions
  setSavedStatus: (status: BrowserSettingsState["savedStatus"]) => void;
  setSettings: (settings: BrowserSettings, hasUnsavedChanges?: boolean) => void;
  setHasUnsavedChanges: (val: boolean) => void;
}

export const useBrowserSettingsStore = create<BrowserSettingsState>()(
  persist(
    (set) => ({
      // Browser settings initial state
      savedStatus: { status: "idle" },
      settings: {
        useSystemBrowser: true, // Default to system browser
        systemBrowserPath:
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Default Chrome path
        defaultUrl: "https://www.google.com",
        selectedProfile: "default_profile",
        availableProfiles: ["default_profile"],
        browserProfiles: {
          builtin_chromium: {
            profiles: ["default_profile"],
            browser_path: "",
            browser_name: "builtin_chromium",
          },
        },
        chromiumInstalled: false,
        chromiumVersion: undefined,
        chromiumInstallPath: "",
      },
      hasUnsavedChanges: false,

      // Actions
      setSavedStatus: (savedStatus) => set({ savedStatus }),
      setSettings: (settings, hasUnsavedChanges = true) =>
        set({ settings, hasUnsavedChanges }),
      setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
    }),
    {
      name: "browser-settings-storage",
      // Only persist the essential settings, not UI state
      partialize: (state) => ({
        settings: state.settings,
      }),
    },
  ),
);
