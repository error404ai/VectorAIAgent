import { useCallback, useEffect } from "react";
import authManager from "../helpers/authManager";
import { useLazyGetProfileQuery } from "../RTKService/authService";
import {
  setAuthInitialized,
  setNeedsAuthChoice,
  setUser,
} from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/store";
import AuthChoiceModal from "./AuthChoiceModal";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider handles authentication on first app launch.
 *
 * Flow:
 * 1. Check if we have stored credentials and try to refresh token
 * 2. If refresh succeeds, get profile and set user
 * 3. If no credentials or refresh fails (401), show auth choice modal
 * 4. User can choose to login or continue as guest
 * 5. Guest account is only created when user clicks "Continue as Guest"
 */
function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { authInitialized, needsAuthChoice } = useAppSelector(
    (state) => state.auth,
  );

  const [getProfile] = useLazyGetProfileQuery();

  const initializeAuth = useCallback(async () => {
    const clearStaleSession = () => {
      authManager.clearAccessToken();
      authManager.clearGuestCredentials();
    };

    // Try to restore an existing session using refresh-token + /auth/me flow
    // RefreshTokenManager inside baseApi will retry on 401 using the cookie
    try {
      const profileResult = await getProfile().unwrap();
      if (profileResult?.data) {
        dispatch(setUser(profileResult.data));
        dispatch(setAuthInitialized(true));
        console.log(
          "Restored session from refresh token for user:",
          profileResult.data.name,
        );
        return;
      }
    } catch (error) {
      console.log("No active session found, showing auth choice modal", error);
      clearStaleSession();
    }

    // No valid session - show auth choice modal
    // Don't auto-create guest account, let user choose
    dispatch(setNeedsAuthChoice(true));
    dispatch(setAuthInitialized(true));
  }, [dispatch, getProfile]);

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

  // Show auth choice modal if user needs to authenticate
  if (needsAuthChoice) {
    return (
      <>
        <AuthChoiceModal isOpen={needsAuthChoice} />
      </>
    );
  }

  return <>{children}</>;
}

export default AuthProvider;
