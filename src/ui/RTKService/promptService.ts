import type {
  EnhancePromptRequest,
  EnhancePromptResponse,
} from "../types/prompt";
import { baseApi } from "./baseApi";

// Re-export types for consumers
export type {
  EnhancePromptRequest,
  EnhancePromptResponse,
} from "../types/prompt";

const promptApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    enhancePrompt: builder.mutation<
      EnhancePromptResponse,
      EnhancePromptRequest
    >({
      query: (params) => ({
        url: "/prompts/enhance",
        method: "POST",
        body: params,
      }),
    }),
  }),
});

export const { useEnhancePromptMutation } = promptApi;
