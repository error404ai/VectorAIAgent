import type {
  SearchAiRulesRequest,
  SearchAiRulesResponse,
} from "../types/aiRule";
import { baseApi } from "./baseApi";

// Re-export types for consumers
export type {
  AiRule,
  SearchAiRulesRequest,
  SearchAiRulesResponse,
} from "../types/aiRule";

const aiRuleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchAiRules: builder.mutation<
      SearchAiRulesResponse,
      SearchAiRulesRequest
    >({
      query: (params) => ({
        url: "/ai-rules/search",
        method: "POST",
        body: params,
      }),
    }),
  }),
});

export const { useSearchAiRulesMutation } = aiRuleApi;
