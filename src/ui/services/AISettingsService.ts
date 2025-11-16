import type { ModelConfig } from "../../../types/model";
import { useAISettingsStore } from "../stores/AISettingsStore";

interface AISettingsSyncService {
  getActiveSettings: () => Promise<ModelConfig>;
}

const AISettingsService: AISettingsSyncService = {
  getActiveSettings: async (): Promise<ModelConfig> => {
    // Return the current active settings from the persistent store
    const { activeProvider, configs } = useAISettingsStore.getState();
    const activeConfig = configs[activeProvider];

    return {
      provider: activeConfig.provider,
      model: activeConfig.model,
      apiKey: activeConfig.apiKey,
      baseUrl: activeConfig.baseUrl,
      temperature: activeConfig.temperature ?? 0.7,
      maxTokens: activeConfig.maxTokens ?? 4096,
      useVision: activeConfig.useVision ?? true,
    };
  },
};

export default AISettingsService;
