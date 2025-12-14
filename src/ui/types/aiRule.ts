// Types for AI Rule integration with Vector-Brain API

export interface AiRule {
  id: number;
  name: string;
  description: string;
  rule: string;
  is_active: boolean;
  similarity_score?: number;
}

export interface SearchAiRulesRequest {
  prompt: string;
  limit?: number;
}

export interface SearchAiRulesResponse {
  message: string;
  data: AiRule[];
}

export interface AttachedRuleState {
  rule: AiRule | null;
  isRetrieving: boolean;
  error: string | null;
}
