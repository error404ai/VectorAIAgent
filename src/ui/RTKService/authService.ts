import authManager from "../helpers/authManager";
import { logout, setUser } from "../store/authSlice";
import type {
  AuthResponse,
  LoginRequest,
  ProfileResponse,
  RefreshTokenResponse,
  SignupRequest,
} from "../types/auth";
import { baseApi, TAGS } from "./baseApi";

// Re-export types for consumers
export type {
  AuthResponse,
  LoginRequest,
  ProfileResponse,
  RefreshTokenResponse,
  SignupRequest,
  User,
} from "../types/auth";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await authManager.handleLoginOnQueryStarted(queryFulfilled, dispatch);
      },
    }),

    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (userData) => ({
        url: "/auth/signup",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await authManager.handleLoginOnQueryStarted(queryFulfilled, dispatch);
      },
    }),

    guestSignup: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "/auth/signup",
        method: "POST",
        body: { isGuest: true },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await authManager.handleLoginOnQueryStarted(queryFulfilled, dispatch);
      },
    }),

    getProfile: builder.query<ProfileResponse, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(setUser(data.data));
          }
        } catch {
          // ignore profile fetch errors; refresh manager will handle retries/401s
        }
      },
      providesTags: [TAGS.PROFILE, TAGS.ACCOUNT_INFO],
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          authManager.clearAccessToken();
          authManager.clearGuestCredentials();
          dispatch(logout());
        } catch {
          // Still clear tokens on logout even if API fails
          authManager.clearAccessToken();
          authManager.clearGuestCredentials();
          dispatch(logout());
        }
      },
      invalidatesTags: [TAGS.ACCOUNT_INFO, TAGS.PROFILE],
    }),

    refreshToken: builder.mutation<
      RefreshTokenResponse,
      { refresh_token?: string } | void
    >({
      query: (body) => ({
        url: "/auth/refresh-token",
        method: "POST",
        body: body || {},
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGuestSignupMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi;

export default authApi;
