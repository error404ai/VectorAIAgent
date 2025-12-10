import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIModelProvider, ModelConfig } from "../../../types/model";

export const defaultConfigs: Record<
  AIModelProvider,
  Omit<ModelConfig, "apiKey">
> = {
  openai: {
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 4096,
  },
  anthropic: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 4096,
  },
  google: {
    provider: "google",
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    maxTokens: 4096,
  },
  deepseek: {
    provider: "deepseek",
    model: "deepseek-reasoner",
    baseUrl: "https://api.deepseek.com/v1",
    temperature: 0.7,
    maxTokens: 32768,
  },
  openrouter: {
    provider: "openrouter",
    model: "moonshotai/kimi-k2",
    baseUrl: "https://openrouter.ai/api/v1",
    temperature: 0.7,
    maxTokens: 4096,
    useVision: false, // Kimi-K2 doesn't support vision
  },
  groq: {
    provider: "groq",
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    baseUrl: "https://api.groq.com/openai/v1",
    temperature: 0.7,
    maxTokens: 4096,
  },
  ollama: {
    provider: "ollama",
    model: "llama3.1",
    baseUrl: "http://localhost:11434/v1",
    temperature: 0.7,
    maxTokens: 4096,
  },
  azure: {
    provider: "azure",
    model: "gpt-4o",
    baseUrl: "https://YOUR_RESOURCE_NAME.openai.azure.com",
    temperature: 0.7,
    maxTokens: 4096,
  },
  "aws-bedrock": {
    provider: "aws-bedrock",
    model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    temperature: 0.7,
    maxTokens: 4096,
  },
  "aws-anthropic": {
    provider: "aws-anthropic",
    model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    temperature: 0.7,
    maxTokens: 4096,
  },
};

export interface AIModelState {
  activeProvider: AIModelProvider;
  selectedProvider: AIModelProvider;
  configs: Record<AIModelProvider, ModelConfig>;
  hasUnsavedChanges: boolean;
  fileUploadDirectory: string;
  setActiveProvider: (
    provider: AIModelProvider,
    hasUnsavedChanges?: boolean,
  ) => void;
  setSelectedProvider: (
    provider: AIModelProvider,
    hasUnsavedChanges?: boolean,
  ) => void;
  updateConfig: (
    provider: AIModelProvider,
    config: Partial<ModelConfig>,
    hasUnsavedChanges?: boolean,
  ) => void;
  setFileUploadDirectory: (path: string, hasUnsavedChanges?: boolean) => void;
  setHasUnsavedChanges: (val: boolean) => void;
}

const initialConfigs = Object.fromEntries(
  Object.entries(defaultConfigs).map(([provider, config]) => [
    provider,
    { ...config, apiKey: "" },
  ]),
) as Record<AIModelProvider, ModelConfig>;

export const useAISettingsStore = create<AIModelState>()(
  persist(
    (set) => ({
      activeProvider: "openai",
      selectedProvider: "openai",
      configs: initialConfigs,
      hasUnsavedChanges: false,
      fileUploadDirectory: "",
      setActiveProvider: (provider, hasUnsavedChanges = true) =>
        set(() => ({ activeProvider: provider, hasUnsavedChanges })),
      setSelectedProvider: (provider, hasUnsavedChanges = true) =>
        set({ selectedProvider: provider, hasUnsavedChanges }),
      updateConfig: (provider, config, hasUnsavedChanges = true) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [provider]: { ...state.configs[provider], ...config },
          },
          hasUnsavedChanges,
        })),
      setFileUploadDirectory: (path, hasUnsavedChanges = true) =>
        set(() => ({
          fileUploadDirectory: path,
          hasUnsavedChanges,
        })),
      setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
    }),
    {
      name: "ai-settings-storage",
      // Only persist the essential data, not UI state
      partialize: (state) => ({
        activeProvider: state.activeProvider,
        selectedProvider: state.selectedProvider,
        configs: state.configs,
        fileUploadDirectory: state.fileUploadDirectory,
      }),
    },
  ),
);
