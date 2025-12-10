import { useEffect, useState } from "react";
import type { AIModelProvider } from "../../../types/model";
import { defaultConfigs, useAISettingsStore } from "../stores/AISettingsStore";
import { cn } from "../utils/cn";
import { SelectDropdown } from "./SelectDropdown";

interface ModelOption {
  id: AIModelProvider;
  name: string;
  description: string;
  models: { id: string; name: string; useVision?: boolean }[];
}

const modelOptions: ModelOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models from OpenAI (requires API key)",
    models: [
      { id: "gpt-5", name: "GPT-5", useVision: true },
      { id: "gpt-5-mini", name: "GPT-5 Mini", useVision: true },
      { id: "gpt-5-nano", name: "GPT-5 Nano", useVision: true },
      { id: "gpt-4.1", name: "GPT-4.1", useVision: true },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", useVision: true },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", useVision: true },
      { id: "gpt-4o", name: "GPT-4o", useVision: true },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", useVision: true },
      { id: "o1", name: "o1", useVision: false },
      { id: "o1-pro", name: "o1 Pro", useVision: false },
      { id: "o3", name: "o3", useVision: false },
      { id: "o3-mini", name: "o3 Mini", useVision: false },
      { id: "o3-pro", name: "o3 Pro", useVision: false },
      { id: "o4-mini", name: "o4 Mini", useVision: true },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models from Anthropic (requires API key)",
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        useVision: true,
      },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", useVision: true },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        useVision: true,
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        useVision: true,
      },
    ],
  },
  {
    id: "google",
    name: "Google AI",
    description: "Gemini models from Google (requires API key)",
    models: [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash Experimental",
        useVision: true,
      },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", useVision: true },
      {
        id: "gemini-2.0-flash-lite-preview-02-05",
        name: "Gemini 2.0 Flash Lite Preview",
        useVision: true,
      },
      {
        id: "Gemini-2.0-exp",
        name: "Gemini 2.0 Experimental",
        useVision: true,
      },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", useVision: true },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", useVision: true },
      { id: "gemini-pro", name: "Gemini Pro", useVision: true },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek models (requires API key)",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", useVision: false },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner", useVision: false },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access multiple AI models via OpenRouter (requires API key)",
    models: [{ id: "moonshotai/kimi-k2", name: "Kimi-K2", useVision: false }],
  },
  {
    id: "groq",
    name: "Groq",
    description: "Fast inference with Groq (requires API key)",
    models: [
      {
        id: "meta-llama/llama-4-maverick-17b-128e-instruct",
        name: "Llama 4 Maverick 17B",
        useVision: false,
      },
      {
        id: "meta-llama/llama-4-scout-17b-16e-instruct",
        name: "Llama 4 Scout 17B",
        useVision: false,
      },
      { id: "qwen/qwen3-32b", name: "Qwen 3 32B", useVision: false },
      {
        id: "moonshotai/kimi-k2-instruct",
        name: "Kimi K2 Instruct",
        useVision: false,
      },
      { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", useVision: false },
      { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", useVision: false },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Local AI models via Ollama (no API key needed)",
    models: [
      { id: "llama3.1", name: "Llama 3.1", useVision: false },
      { id: "llama3.1:8b", name: "Llama 3.1 8B", useVision: false },
      { id: "llama3.1:70b", name: "Llama 3.1 70B", useVision: false },
      { id: "phi3", name: "Phi-3", useVision: false },
      { id: "codellama", name: "Code Llama", useVision: false },
      { id: "mistral", name: "Mistral", useVision: false },
      { id: "qwen2", name: "Qwen 2", useVision: false },
    ],
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    description:
      "OpenAI models via Azure (requires Azure API key and endpoint)",
    models: [
      { id: "gpt-4o", name: "GPT-4o", useVision: true },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", useVision: true },
      { id: "gpt-4", name: "GPT-4", useVision: true },
      { id: "gpt-35-turbo", name: "GPT-3.5 Turbo", useVision: false },
    ],
  },
  {
    id: "aws-bedrock",
    name: "AWS Bedrock",
    description: "AI models via AWS Bedrock (requires AWS credentials)",
    models: [
      {
        id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        name: "Claude 3.5 Sonnet",
        useVision: true,
      },
      {
        id: "anthropic.claude-3-opus-20240229:0",
        name: "Claude 3 Opus",
        useVision: true,
      },
      {
        id: "anthropic.claude-3-haiku-20240307:0",
        name: "Claude 3 Haiku",
        useVision: true,
      },
      {
        id: "amazon.titan-text-premier-v1:0",
        name: "Amazon Titan Text Premier",
        useVision: false,
      },
      {
        id: "meta.llama3-1-70b-instruct-v1:0",
        name: "Llama 3.1 70B Instruct",
        useVision: false,
      },
    ],
  },
  {
    id: "aws-anthropic",
    name: "AWS Anthropic Bedrock",
    description: "Anthropic models via AWS Bedrock (requires AWS credentials)",
    models: [
      {
        id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
        name: "Claude 3.5 Sonnet",
        useVision: true,
      },
      {
        id: "anthropic.claude-3-opus-20240229:0",
        name: "Claude 3 Opus",
        useVision: true,
      },
      {
        id: "anthropic.claude-3-sonnet-20240229:0",
        name: "Claude 3 Sonnet",
        useVision: true,
      },
      {
        id: "anthropic.claude-3-haiku-20240307:0",
        name: "Claude 3 Haiku",
        useVision: true,
      },
    ],
  },
];

export function AIModelSettings() {
  const { selectedProvider, configs, setSelectedProvider, updateConfig } =
    useAISettingsStore();
  const currentConfig = configs[selectedProvider];
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Only reset model to default if the current model doesn't exist for the selected provider
  useEffect(() => {
    const currentProvider = modelOptions.find((o) => o.id === selectedProvider);
    const availableModels = currentProvider?.models.map((m) => m.id) || [];

    // Only reset if the current model is not available for this provider
    if (!availableModels.includes(currentConfig.model)) {
      const defaultModel = defaultConfigs[selectedProvider].model;
      // Don't mark as unsaved changes since this is an automatic correction
      updateConfig(selectedProvider, { model: defaultModel }, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider]);

  // Update useVision when model changes
  useEffect(() => {
    const currentProvider = modelOptions.find((o) => o.id === selectedProvider);
    const currentModelInfo = currentProvider?.models.find(
      (m) => m.id === currentConfig.model,
    );

    if (currentModelInfo && currentModelInfo.useVision !== undefined) {
      if (currentConfig.useVision !== currentModelInfo.useVision) {
        // Don't mark as unsaved changes since this is an automatic adjustment
        updateConfig(
          selectedProvider,
          {
            useVision: currentModelInfo.useVision,
          },
          false,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, currentConfig.model]);

  return (
    <div className="p-0">
      <div className="mb-3">
        <label className="mb-2 block text-sm font-medium">Model Provider</label>
        <div className="flex flex-wrap gap-2">
          {modelOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedProvider(option.id)}
              className={cn(
                "px-3 py-1 text-center text-[15px] transition-all",
                selectedProvider === option.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-[#091E38]/60 text-gray-200 hover:bg-[#091E38]",
              )}
            >
              <span className="font-medium">{option.name}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Selected Provider Details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {modelOptions.find((o) => o.id === selectedProvider)?.name}{" "}
              Settings
            </h3>
            <span className="rounded bg-blue-400/10 px-2 py-1 text-xs text-blue-400">
              {selectedProvider.toUpperCase()}
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-300">
            {modelOptions.find((o) => o.id === selectedProvider)?.description}
          </p>
          <div className="mb-4">
            <SelectDropdown
              label="Model"
              value={currentConfig.model}
              onChange={(modelId) =>
                updateConfig(selectedProvider, { model: modelId })
              }
              options={
                modelOptions
                  .find((o) => o.id === selectedProvider)
                  ?.models.map((model) => ({
                    id: model.id,
                    label: model.name,
                  })) || []
              }
              placeholder="Select Model"
              helperText="Select an AI model to use"
              searchable={true}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="api-key" className="mb-1 block text-sm font-medium">
              {selectedProvider === "azure"
                ? "Azure API Key"
                : selectedProvider.startsWith("aws-")
                  ? "AWS Access Key ID"
                  : selectedProvider === "ollama"
                    ? "API Key (optional)"
                    : "API Key"}
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={isApiKeyVisible ? "text" : "password"}
                value={currentConfig.apiKey}
                onChange={(e) =>
                  updateConfig(selectedProvider, { apiKey: e.target.value })
                }
                className="w-full appearance-none rounded-none border border-white/10 bg-black/20 px-4 py-2 pr-10 text-white placeholder-gray-400 ring-0 focus:border-blue-500/50 focus:ring-0 focus:outline-none"
                placeholder={
                  selectedProvider === "azure"
                    ? "Enter Azure OpenAI API key"
                    : selectedProvider.startsWith("aws-")
                      ? "Enter AWS Access Key ID"
                      : selectedProvider === "ollama"
                        ? "API key (leave empty for local Ollama)"
                        : `Enter ${selectedProvider} API key`
                }
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300"
                onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
              >
                {isApiKeyVisible ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {selectedProvider === "ollama"
                ? "Ollama runs locally and typically doesn't need an API key"
                : selectedProvider.startsWith("aws-")
                  ? "AWS providers also need AWS Secret Access Key and region configured"
                  : "Your API key is stored locally and never shared"}
            </p>
          </div>
        </div>

        <div>
          {/* Base URL (for providers that support custom endpoints) */}
          {(selectedProvider === "openrouter" ||
            selectedProvider === "deepseek" ||
            selectedProvider === "groq" ||
            selectedProvider === "ollama" ||
            selectedProvider === "azure") && (
            <div className="mb-4">
              <label
                htmlFor="base-url"
                className="mb-1 block text-sm font-medium"
              >
                Base URL
                {selectedProvider === "azure" && " / Azure Endpoint"}
                {selectedProvider === "ollama" && " / Ollama Host"}
              </label>
              <input
                id="base-url"
                type="text"
                value={currentConfig.baseUrl || ""}
                onChange={(e) =>
                  updateConfig(selectedProvider, { baseUrl: e.target.value })
                }
                className="w-full appearance-none rounded-none border border-white/10 bg-black/20 px-4 py-2 text-white placeholder-gray-400 ring-0 focus:border-blue-500/50 focus:ring-0 focus:outline-none"
                placeholder={
                  selectedProvider === "openrouter"
                    ? "https://openrouter.ai/api/v1"
                    : selectedProvider === "deepseek"
                      ? "https://api.deepseek.com/v1"
                      : selectedProvider === "groq"
                        ? "https://api.groq.com/openai/v1"
                        : selectedProvider === "ollama"
                          ? "http://localhost:11434/v1"
                          : selectedProvider === "azure"
                            ? "https://YOUR_RESOURCE_NAME.openai.azure.com"
                            : "Enter base URL"
                }
              />
              {/* <p className="mt-1 text-xs text-gray-400">
                {selectedProvider === "openrouter"
                  ? "OpenRouter API endpoint URL"
                  : selectedProvider === "deepseek"
                    ? "DeepSeek API endpoint URL"
                    : selectedProvider === "groq"
                      ? "Groq API endpoint URL"
                      : selectedProvider === "ollama"
                        ? "Ollama server host (e.g., http://localhost:11434/v1)"
                        : selectedProvider === "azure"
                          ? "Your Azure OpenAI resource endpoint"
                          : "Custom API endpoint URL (optional)"}
              </p> */}
            </div>
          )}
          {/* Temperature Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="temperature"
                className="block text-sm font-medium"
              >
                Temperature
              </label>
              <span className="rounded bg-black/30 px-2 py-0.5 font-mono text-sm">
                {currentConfig.temperature}
              </span>
            </div>
            <input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={currentConfig.temperature}
              onChange={(e) =>
                updateConfig(selectedProvider, {
                  temperature: parseFloat(e.target.value),
                })
              }
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-black/20 accent-blue-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          {/* Max Tokens */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label htmlFor="max-tokens" className="block text-sm font-medium">
                Max Tokens
              </label>
              <span className="rounded bg-black/30 px-2 py-0.5 font-mono text-sm">
                {currentConfig.maxTokens}
              </span>
            </div>
            <input
              id="max-tokens"
              type="range"
              min="256"
              max="8192"
              step="256"
              value={currentConfig.maxTokens}
              onChange={(e) =>
                updateConfig(selectedProvider, {
                  maxTokens: parseInt(e.target.value),
                })
              }
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-black/20 accent-blue-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Shorter responses</span>
              <span>Longer responses</span>
            </div>
          </div>
          {/* Vision Support Status (Read-only) */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Vision Support
              </label>
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium",
                    currentConfig.useVision !== false
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400",
                  )}
                >
                  {currentConfig.useVision !== false
                    ? "Enabled"
                    : "Not Available"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
