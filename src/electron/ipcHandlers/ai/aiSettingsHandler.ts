import { dialog } from "electron";
import type { ModelConfig } from "../../../../types/model.js";
import AISettingsService from "../../services/AISettingsService.js";
import SettingsFileManager from "../../services/SettingsFileManager.js";
import { ipcMainHandle } from "../../util.js";

export function aiSettingsHandler() {
  ipcMainHandle("getAISettings", async () => {
    const settings = await AISettingsService.getAllSettings();
    return settings.map((setting) => ({
      id: 1, // Dummy ID for backward compatibility
      provider: setting.provider,
      is_active: true, // All settings are considered active now
      model: setting.model,
      api_key: setting.apiKey || "",
      base_url: setting.baseUrl || undefined,
      temperature: setting.temperature ?? 0.7,
      max_tokens: setting.maxTokens ?? 4096,
      use_vision: setting.useVision ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  ipcMainHandle("getAgentSettings", async () => {
    try {
      const agent = SettingsFileManager.getAgentSettings();
      return agent;
    } catch (error) {
      console.error("Failed to get agent settings:", error);
      return {};
    }
  });

  ipcMainHandle("selectUploadDirectory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true };
    }

    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMainHandle("saveAgentSettings", async (payload) => {
    try {
      SettingsFileManager.saveAgentSettings(payload || {});
      return { success: true, message: "Agent settings saved" };
    } catch (error) {
      console.error("Failed to save agent settings:", error);
      return { success: false, message: `${error}` };
    }
  });

  ipcMainHandle("saveAISettings", async (settings) => {
    try {
      const { activeProvider, configs, fileUploadDirectory } = settings;

      for (const [provider, config] of Object.entries(configs)) {
        const typedConfig = config as ModelConfig;
        await AISettingsService.updateSettings(provider, {
          model: typedConfig.model,
          apiKey: typedConfig.apiKey,
          baseUrl: typedConfig.baseUrl,
          temperature: typedConfig.temperature,
          maxTokens: typedConfig.maxTokens,
          useVision: typedConfig.useVision,
        });
      }

      const activeConfig = configs[activeProvider] as ModelConfig;
      await AISettingsService.updateProviderSettings(activeProvider, {
        model: activeConfig.model,
        apiKey: activeConfig.apiKey,
        baseUrl: activeConfig.baseUrl,
        temperature: activeConfig.temperature,
        maxTokens: activeConfig.maxTokens,
        useVision: activeConfig.useVision,
      });

      await AISettingsService.setActiveProvider(activeProvider);

      if (fileUploadDirectory !== undefined) {
        SettingsFileManager.saveAISettings({
          fileUploadDirectory: fileUploadDirectory || "",
        });
      }

      return { success: true, message: "AI settings saved successfully" };
    } catch (error) {
      console.error("Failed to save AI settings:", error);
      return {
        success: false,
        message: `Failed to save AI settings: ${error}`,
      };
    }
  });
}
