/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import { baseApi, TAGS } from "../RTKService/baseApi";
import { setTokenExpired } from "../store/authSlice";

let inMemoryAccessToken: string | null = null;

// Storage key for guest credentials
const GUEST_CREDENTIALS_KEY = "vector_guest_credentials";

export interface GuestCredentials {
  email: string;
  refreshToken: string;
  userId: number;
}

const sanitizeAccessToken = (token: unknown): string | null => {
  if (typeof token === "string" && token.trim().length > 0) {
    return token.trim();
  }
  return null;
};

const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

const authManager = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  clearAccessToken(): void {
    console.log("clearing access token from auth manager");
    setAccessToken(null);
  },

  saveAccessToken(token: string): void {
    const sanitized = sanitizeAccessToken(token);
    if (!sanitized) {
      console.warn("Attempted to save invalid access token", token);
      return;
    }
    setAccessToken(sanitized);
  },

  // Guest credentials management
  saveGuestCredentials(credentials: GuestCredentials): void {
    try {
      localStorage.setItem(GUEST_CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error("Failed to save guest credentials:", error);
    }
  },

  getGuestCredentials(): GuestCredentials | null {
    try {
      const stored = localStorage.getItem(GUEST_CREDENTIALS_KEY);
      if (stored) {
        return JSON.parse(stored) as GuestCredentials;
      }
    } catch (error) {
      console.error("Failed to get guest credentials:", error);
    }
    return null;
  },

  clearGuestCredentials(): void {
    try {
      localStorage.removeItem(GUEST_CREDENTIALS_KEY);
    } catch (error) {
      console.error("Failed to clear guest credentials:", error);
    }
  },

  hasGuestCredentials(): boolean {
    return this.getGuestCredentials() !== null;
  },

  async handleLoginOnQueryStarted(
    queryFulfilled: Promise<any>,
    dispatch: ThunkDispatch<any, any, UnknownAction>,
  ): Promise<void> {
    try {
      const { data } = await queryFulfilled;

      const token = data?.data?.token;
      if (token) {
        this.saveAccessToken(token);
      }

      // Save refresh token for guest users
      const refreshToken = data?.data?.refreshToken;
      const user = data?.data?.user;
      if (refreshToken && user) {
        this.saveGuestCredentials({
          email: user.email,
          refreshToken,
          userId: user.id,
        });
      }

      try {
        const allTags = Object.values(TAGS)
          .filter(Boolean)
          .map((t) => ({ type: t }));
        dispatch(baseApi.util.invalidateTags(allTags));
      } catch (invErr) {
        console.error("Failed to invalidate RTK Query tags on login:", invErr);
      }
    } catch {
      // ignore
    }
  },

  async handleApiError(
    result: QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>,
    api: any,
  ): Promise<void> {
    if (result.error) {
      const { status } = result.error;

      if (status === 401) {
        const tokenExpired = api.getState().auth?.tokenExpired;
        if (!tokenExpired) {
          api.dispatch(setTokenExpired(true));
        }
      }
    }
  },
};

export default authManager;
