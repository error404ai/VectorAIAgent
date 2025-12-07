import { baseApi, TAGS } from "./baseApi";

// Types for agent task API
export interface AgentTaskStep {
  step_number: number;
  url?: string;
  title?: string;
  thinking?: string;
  evaluation_previous_goal?: string;
  memory?: string;
  next_goal?: string;
  actions?: Record<string, unknown>[];
  results?: {
    is_done?: boolean;
    success?: boolean;
    extracted_content?: string;
    error?: string;
  }[];
  duration_seconds?: number;
  step_start_time?: number;
  step_end_time?: number;
  interacted_elements?: {
    tag_name?: string;
    xpath?: string;
    text?: string;
  }[];
}

export interface CreateAgentTaskRequest {
  prompt: string;
  logs?: string;
  steps?: string;
  provider?: string;
  model?: string;
  success?: boolean;
  message?: string;
  total_steps?: number;
  total_duration_seconds?: number;
  urls_visited?: string;
  model_actions?: string;
  errors?: string;
}

export interface AgentTask {
  id: number;
  user_id: number;
  prompt: string;
  logs?: string;
  steps?: string;
  provider?: string;
  model?: string;
  success: boolean;
  message?: string;
  total_steps: number;
  total_duration_seconds: number;
  urls_visited?: string;
  model_actions?: string;
  errors?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentTaskResponse {
  message: string;
  data: AgentTask;
}

export interface AgentTaskListResponse {
  message: string;
  data: AgentTask[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const agentTaskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAgentTask: builder.mutation<
      AgentTaskResponse,
      CreateAgentTaskRequest
    >({
      query: (taskData) => ({
        url: "/agent-task/create",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: [TAGS.USER],
    }),

    getAgentTasks: builder.query<
      AgentTaskListResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/agent-task/list",
        method: "GET",
        params: { page, limit },
      }),
      providesTags: [TAGS.USER],
    }),

    getAgentTaskDetails: builder.query<AgentTaskResponse, number>({
      query: (id) => ({
        url: `/agent-task/details/${id}`,
        method: "GET",
      }),
    }),

    deleteAgentTask: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/agent-task/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAGS.USER],
    }),
  }),
});

export const {
  useCreateAgentTaskMutation,
  useGetAgentTasksQuery,
  useLazyGetAgentTasksQuery,
  useGetAgentTaskDetailsQuery,
  useLazyGetAgentTaskDetailsQuery,
  useDeleteAgentTaskMutation,
} = agentTaskApi;

export default agentTaskApi;
