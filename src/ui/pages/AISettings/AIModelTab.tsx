import { Folder, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Window } from "../../../../types/global-types";
import type { AIModelProvider } from "../../../../types/model";
import { AIModelSettings } from "../../components/AIModelSettings";
import PageTitle from "../../components/PageTitle";
import { SelectDropdown } from "../../components/SelectDropdown";
import { useAISettingsStore } from "../../stores/AISettingsStore";

declare const window: Window;

function AIModelTab() {
  type SavePayload = Parameters<typeof window.electronAPI.saveAISettings>[0];

  const [savedStatus, setSavedStatus] = useState<{
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  }>({ status: "idle" });
  const {
    selectedProvider,
    activeProvider,
    configs,
    fileUploadDirectory,
    setSelectedProvider,
    setActiveProvider,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setFileUploadDirectory,
  } = useAISettingsStore();

  useEffect(() => {
    // Settings are automatically loaded by Zustand persist middleware
    setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  const handleSaveSettings = async () => {
    setSavedStatus({ status: "saving" });
    try {
      const payloadConfigs = Object.fromEntries(
        Object.entries(configs).map(([provider, config]) => [
          provider,
          {
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 4096,
            useVision: config.useVision,
          },
        ]),
      ) as SavePayload["configs"];

      // Persist settings in the backend so automation can use them even after reload
      const response = await window.electronAPI.saveAISettings({
        activeProvider: selectedProvider,
        configs: payloadConfigs,
        fileUploadDirectory: fileUploadDirectory?.trim() || "",
      });

      if (!response.success) {
        throw new Error(response.message || "Unknown error");
      }

      // Set the selected provider as the active provider for automation
      setActiveProvider(selectedProvider, false);
      setSavedStatus({
        status: "saved",
        message: "AI Model Settings saved successfully",
      });
      setHasUnsavedChanges(false);
      setTimeout(() => {
        setSavedStatus({ status: "idle" });
      }, 3000);
    } catch (error) {
      console.error("Failed to save AI model settings:", error);
      setSavedStatus({
        status: "error",
        message: "Failed to save AI model settings",
      });
      setTimeout(() => {
        setSavedStatus({ status: "idle" });
      }, 5000);
    }
  };

  const handleBrowseUploadDirectory = async () => {
    try {
      const result = await window.electronAPI.selectUploadDirectory();
      if (!result.canceled && result.path) {
        setFileUploadDirectory(result.path, true);
      }
    } catch (error) {
      console.error("Failed to select upload directory:", error);
    }
  };

  const handleClearUploadDirectory = () => {
    setFileUploadDirectory("", true);
  };

  const handleResetSettings = async () => {
    try {
      setSavedStatus({ status: "idle" });
      setHasUnsavedChanges(false);
    } catch {
      setSavedStatus({
        status: "error",
        message: "Failed to reset settings",
      });
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      <PageTitle
        title="AI Model Settings"
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

      {/* Content area */}
      <div className="max-h-full flex-1 p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-white">
                Configuration
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-sm text-white/50">Active:</div>
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-blue-700/70 via-blue-600/60 to-teal-400/40 px-2 py-1 text-sm text-white shadow-sm">
                    {activeProvider.charAt(0).toUpperCase() +
                      activeProvider.slice(1)}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="bg-gradient-to-r from-blue-600/40 to-blue-500/20 px-2 py-1 text-sm text-white/90 shadow-sm">
                    {configs[activeProvider]?.model || "No model selected"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-white/50">Configure Provider:</div>
                <div className="min-w-[200px]">
                  <SelectDropdown
                    options={Object.keys(configs).map((provider) => ({
                      id: provider,
                      label:
                        provider.charAt(0).toUpperCase() + provider.slice(1),
                    }))}
                    value={selectedProvider}
                    onChange={(provider) =>
                      setSelectedProvider(provider as AIModelProvider)
                    }
                    placeholder="Select Provider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* <div className="mb-2 flex items-center justify-between text-sm text-white/70">
            {fileUploadDirectory ? (
              <span className="text-xs text-white/40">
                {fileUploadDirectory}
              </span>
            ) : (
              <span className="text-xs text-white/40">
                No directory selected
              </span>
            )}
          </div> */}
          <div className="mt-2 flex items-center gap-3">
            <input
              type="text"
              value={fileUploadDirectory}
              readOnly
              className="flex-1 border border-white/10 bg-black/40 px-3 py-1 text-sm text-white placeholder-white/40 focus:outline-none"
              placeholder="Select a folder to expose files for automation uploads"
            />
            <button
              type="button"
              className="flex items-center gap-2 border border-white/30 px-3 py-[3px] text-sm text-white transition-colors hover:bg-white/10"
              onClick={handleBrowseUploadDirectory}
            >
              <Folder size={14} />
              Browse
            </button>
            <button
              type="button"
              className="flex items-center gap-2 border border-white/30 px-3 py-[3px] text-sm text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleClearUploadDirectory}
              disabled={!fileUploadDirectory}
            >
              <X size={14} />
              Clear
            </button>
          </div>
        </div>

        {/* AI Model Settings with scroll container */}
        <div className="max-h-[calc(100vh-170px)]">
          <AIModelSettings />
        </div>
      </div>
    </div>
  );
}

export default AIModelTab;
