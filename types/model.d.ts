export interface ModelConfig {
  provider: AIModelProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  useVision?: boolean;
}

export type AIModelProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "openrouter"
  | "groq"
  | "ollama"
  | "azure"
  | "aws-bedrock"
  | "aws-anthropic";
