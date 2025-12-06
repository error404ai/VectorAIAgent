import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { User } from "../types/auth";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: {
    isError: boolean;
    message: string;
    trace: string;
  };
  tokenExpired: boolean;
  loggingOut: boolean;
  authInitialized: boolean;
  guestSignupAttempted: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isGuest: false,
  error: { isError: false, message: "", trace: "" },
  tokenExpired: false,
  loggingOut: false,
  authInitialized: false,
  guestSignupAttempted: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isGuest = action.payload?.role === "guest";
    },

    setError: (
      state,
      action: PayloadAction<{
        isError: boolean;
        message: string;
        trace: string;
      }>,
    ) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = { isError: false, message: "", trace: "" };
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.tokenExpired = false;
      state.loggingOut = false;
      state.authInitialized = false;
      // Don't reset guestSignupAttempted - we want to remember we tried
    },

    setTokenExpired: (state, action: PayloadAction<boolean>) => {
      state.tokenExpired = action.payload;
    },

    setLoggingOut: (state, action: PayloadAction<boolean>) => {
      state.loggingOut = action.payload;
    },

    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.authInitialized = action.payload;
    },

    setGuestSignupAttempted: (state, action: PayloadAction<boolean>) => {
      state.guestSignupAttempted = action.payload;
    },
  },
});

export const {
  setUser,
  setError,
  clearError,
  logout,
  setTokenExpired,
  setLoggingOut,
  setAuthInitialized,
  setGuestSignupAttempted,
} = authSlice.actions;

export default authSlice.reducer;
