import type { ModelConfig } from "../../../types/model.js";
import SettingsFileManager from "./SettingsFileManager.js";

export default class AISettingsService {
  static async getAllSettings(): Promise<ModelConfig[]> {
    const settings = SettingsFileManager.getAISettings();
    return Object.values(settings.configs);
  }

  static async getActiveSettings(): Promise<ModelConfig | null> {
    const settings = SettingsFileManager.getAISettings();
    return settings.configs[settings.activeProvider] || null;
  }

  static async getProviderSettings(
    provider: string,
  ): Promise<ModelConfig | null> {
    const settings = SettingsFileManager.getAISettings();
    return settings.configs[provider as keyof typeof settings.configs] || null;
  }

  static async updateProviderSettings(
    provider: string,
    newSettings: Partial<ModelConfig>,
  ): Promise<void> {
    const settings = SettingsFileManager.getAISettings();

    if (settings.configs[provider as keyof typeof settings.configs]) {
      settings.configs[provider as keyof typeof settings.configs] = {
        ...settings.configs[provider as keyof typeof settings.configs],
        ...newSettings,
      };

      SettingsFileManager.saveAISettings(settings);
    }
  }

  static async setActiveProvider(provider: string): Promise<void> {
    const settings = SettingsFileManager.getAISettings();
    settings.activeProvider = provider as keyof typeof settings.configs;
    settings.selectedProvider = provider as keyof typeof settings.configs;
    SettingsFileManager.saveAISettings(settings);
  }

  static async updateSettings(
    provider: string,
    newSettings: Partial<ModelConfig>,
  ): Promise<void> {
    return this.updateProviderSettings(provider, newSettings);
  }
}
