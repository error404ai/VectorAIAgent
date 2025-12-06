import { useCallback, useEffect } from "react";
import authManager from "../helpers/authManager";
import {
  useGuestSignupMutation,
  useLazyGetProfileQuery,
  useRefreshTokenMutation,
} from "../RTKService/authService";
import {
  setAuthInitialized,
  setGuestSignupAttempted,
  setUser,
} from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/store";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider handles automatic guest authentication on first app launch.
 *
 * Flow:
 * 1. Check if we have stored guest credentials
 * 2. If yes, try to refresh the token and get profile
 * 3. If no credentials or refresh fails, create a new guest account
 * 4. Once authenticated, fetch and store the user profile
 */
function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { authInitialized, guestSignupAttempted } = useAppSelector(
    (state) => state.auth,
  );

  const [guestSignup] = useGuestSignupMutation();
  const [refreshToken] = useRefreshTokenMutation();
  const [getProfile] = useLazyGetProfileQuery();

  const initializeAuth = useCallback(async () => {
    // Check if we have existing guest credentials
    const existingCredentials = authManager.getGuestCredentials();

    if (existingCredentials) {
      console.log(
        "Found existing guest credentials, attempting to refresh token...",
      );
      try {
        // Try to refresh the access token using stored refresh token
        const refreshResult = await refreshToken({
          refresh_token: existingCredentials.refreshToken,
        }).unwrap();

        if (refreshResult.data?.accessToken) {
          authManager.saveAccessToken(refreshResult.data.accessToken);

          // Fetch the user profile
          const profileResult = await getProfile().unwrap();
          if (profileResult.data) {
            dispatch(setUser(profileResult.data));
            console.log(
              "Successfully restored session for user:",
              profileResult.data.name,
            );
          }

          dispatch(setAuthInitialized(true));
          return;
        }
      } catch (error) {
        console.log(
          "Failed to refresh token, will create new guest account:",
          error,
        );
        // Clear invalid credentials
        authManager.clearGuestCredentials();
        authManager.clearAccessToken();
      }
    }

    // No valid credentials, create a new guest account
    if (!guestSignupAttempted) {
      console.log("Creating new guest account...");
      dispatch(setGuestSignupAttempted(true));

      try {
        const signupResult = await guestSignup().unwrap();

        if (signupResult.data?.user) {
          dispatch(setUser(signupResult.data.user));
          console.log(
            "Guest account created successfully:",
            signupResult.data.user.name,
          );
        }
      } catch (error) {
        console.error("Failed to create guest account:", error);
        // Even if guest signup fails, we should mark auth as initialized
        // The app can still function, just without authentication
      }
    }

    dispatch(setAuthInitialized(true));
  }, [dispatch, guestSignup, refreshToken, getProfile, guestSignupAttempted]);

  useEffect(() => {
    if (!authInitialized) {
      initializeAuth();
    }
  }, [authInitialized, initializeAuth]);

  // Show loading state while initializing auth
  if (!authInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#091E38]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthProvider;
