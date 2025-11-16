import { Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Input from "../components/Input";
import PageTitle from "../components/PageTitle";
import BrowserSettingsService from "../services/BrowserSettingsService";
import { useBrowserSettingsStore } from "../stores/BrowserSettingsStore";

function BrowserSettingsPage() {
  const { settings, setSettings } = useBrowserSettingsStore();

  const [savedStatus, setSavedStatus] = useState<{
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  }>({ status: "idle" });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper to update settings and track changes
  const updateSettings = useCallback(
    (updates: Partial<typeof settings>) => {
      setSettings({ ...settings, ...updates });
      setHasUnsavedChanges(true);
    },
    [settings, setSettings],
  );

  // Load settings from service
  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await BrowserSettingsService.getSettings();
      setSettings(loadedSettings);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to load browser settings:", error);
    }
  }, [setSettings]);

  // Load initial data
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save browser settings
  const handleSaveSettings = async () => {
    if (!hasUnsavedChanges) return;

    setSavedStatus({ status: "saving" });
    try {
      await BrowserSettingsService.saveSettings(settings);
      setSavedStatus({
        status: "saved",
        message: "Settings saved successfully",
      });
      setHasUnsavedChanges(false);

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSavedStatus({ status: "idle" });
      }, 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSavedStatus({
        status: "error",
        message: "Failed to save settings",
      });
    }
  };

  // Reset browser settings to defaults
  const handleResetSettings = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all browser settings to defaults? This cannot be undone.",
      )
    ) {
      return;
    }

    setSavedStatus({ status: "saving" });
    try {
      // Reset to default settings
      const defaultSettings = {
        useSystemBrowser: true,
        systemBrowserPath:
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
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
      };

      setSettings(defaultSettings);
      setHasUnsavedChanges(true);
      setSavedStatus({ status: "idle" });
    } catch (error) {
      console.error("Failed to reset settings:", error);
      setSavedStatus({
        status: "error",
        message: "Failed to reset settings",
      });
    }
  };

  // Handle browser type change (system vs built-in chromium)
  const handleBrowserTypeChange = (useSystemBrowser: boolean) => {
    updateSettings({ useSystemBrowser });
  };

  return (
    <div className="flex h-full flex-col select-none">
      <div className="flex-shrink-0">
        <PageTitle
          title="Browser Settings"
          savedStatus={savedStatus}
          hasUnsavedChanges={hasUnsavedChanges}
        >
          <button
            className="border px-3 py-1 text-sm text-white transition-colors hover:bg-white/10"
            onClick={handleResetSettings}
          >
            Reset
          </button>
          <button
            className="flex items-center gap-2 bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
            onClick={handleSaveSettings}
          >
            {savedStatus.status === "saving" ? (
              "Saving..."
            ) : (
              <>
                <Save size={14} />
                <span>Save</span>
              </>
            )}
          </button>
        </PageTitle>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="flex gap-3">
          <div className="w-full">
            {/* Browser Type Selection Card */}
            <div className="w-full">
              <div className="p-4">
                <h3 className="mb-3 text-sm font-medium text-white">
                  Browser Selection
                </h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="built-in"
                      name="browser-type"
                      checked={!settings.useSystemBrowser}
                      onChange={() => handleBrowserTypeChange(false)}
                      className="mr-2 h-4 w-4 cursor-pointer accent-blue-500"
                    />
                    <label
                      htmlFor="built-in"
                      className="cursor-pointer text-sm text-white/80"
                    >
                      Installed Chromium Browser
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="system"
                      name="browser-type"
                      checked={settings.useSystemBrowser}
                      onChange={() => handleBrowserTypeChange(true)}
                      className="mr-2 h-4 w-4 cursor-pointer accent-blue-500"
                    />
                    <label
                      htmlFor="system"
                      className="cursor-pointer text-sm text-white/80"
                    >
                      System Browser (Chrome/Edge)
                    </label>
                  </div>

                  {settings.useSystemBrowser && (
                    <div className="mt-2">
                      <Input
                        label="Browser Path"
                        value={settings.systemBrowserPath || ""}
                        onChange={(e) =>
                          updateSettings({
                            systemBrowserPath: e.target.value,
                          })
                        }
                        placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
                        helperText="Path to system browser executable"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Default URL Card */}
            <div>
              <div className="p-4">
                <h3 className="mb-3 text-sm font-medium text-white">
                  Browser Startup
                </h3>

                <div className="space-y-4">
                  <Input
                    label="Default URL"
                    value={settings.defaultUrl}
                    onChange={(e) =>
                      updateSettings({
                        defaultUrl: e.target.value,
                      })
                    }
                    placeholder="https://www.example.com"
                    helperText="URL to open when browser starts"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Placeholder for future browser settings */}
          <div className="w-full">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                Additional Browser Settings
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-white/50">
                  Additional browser configuration options will be added here.
                  For profile management, use the dedicated "Profiles" tab in
                  the navigation.
                </p>
                <div className="flex h-32 items-center justify-center border border-dashed border-white/20">
                  <span className="text-sm text-white/40">
                    Future browser settings area
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrowserSettingsPage;
