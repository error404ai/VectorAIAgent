import React, { useState } from "react";
import {
  useGuestSignupMutation,
  useLoginMutation,
} from "../RTKService/authService";
import {
  setAuthInitialized,
  setGuestSignupAttempted,
  setNeedsAuthChoice,
  setUser,
} from "../store/authSlice";
import { useAppDispatch } from "../store/store";

interface AuthChoiceModalProps {
  isOpen: boolean;
}

const AuthChoiceModal: React.FC<AuthChoiceModalProps> = ({ isOpen }) => {
  const dispatch = useAppDispatch();
  const [guestSignup, { isLoading: isGuestLoading }] = useGuestSignupMutation();
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();

  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleContinueAsGuest = async () => {
    setError("");
    try {
      dispatch(setGuestSignupAttempted(true));
      const result = await guestSignup().unwrap();

      if (result.data?.user) {
        dispatch(setUser(result.data.user));
        console.log(
          "Guest account created successfully:",
          result.data.user.name,
        );
      }

      dispatch(setNeedsAuthChoice(false));
      dispatch(setAuthInitialized(true));
    } catch (err) {
      console.error("Failed to create guest account:", err);
      setError("Failed to create guest account. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password: password.trim(),
      }).unwrap();

      if (result.data?.user) {
        dispatch(setUser(result.data.user));
        console.log("Logged in successfully:", result.data.user.name);
      }

      dispatch(setNeedsAuthChoice(false));
      dispatch(setAuthInitialized(true));
    } catch (err: unknown) {
      console.error("Login failed:", err);
      const errorMessage =
        (err as { data?: { message?: string } })?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
    }
  };

  const [show, setShow] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setShow(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!show) return null;

  const isLoading = isGuestLoading || isLoginLoading;

  return (
    <div
      className={
        `fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 transition-opacity duration-300 ease-in-out ` +
        (visible ? "opacity-100" : "opacity-0")
      }
    >
      <div
        className={
          `w-full max-w-md transform border border-white/20 bg-[#091E38] p-8 transition-transform duration-300 ease-in-out ` +
          (visible ? "scale-100" : "scale-95")
        }
      >
        {!showLogin ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">
                Welcome to Vector AI Agent
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Choose how you want to continue
              </p>
            </div>

            {error && (
              <div className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => setShowLogin(true)}
                disabled={isLoading}
                className="w-full border border-blue-500/50 bg-blue-500/20 py-3 font-medium text-white transition-colors hover:bg-blue-500/30 disabled:opacity-50"
              >
                Login with Account
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#091E38] px-4 text-gray-400">or</span>
                </div>
              </div>

              <button
                onClick={handleContinueAsGuest}
                disabled={isLoading}
                className="w-full border border-white/20 bg-white/5 py-3 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {isGuestLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating guest account...
                  </span>
                ) : (
                  "Continue as Guest"
                )}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Guest accounts have limited data sync capabilities.
              <br />
              Create an account for full features.
            </p>
          </>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowLogin(false);
                  setError("");
                }}
                className="mb-4 text-sm text-gray-400 hover:text-white"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-white">Login</h2>
              <p className="mt-2 text-sm text-gray-400">
                Enter your credentials to continue
              </p>
            </div>

            {error && (
              <div className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your email"
                  className="w-full border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="w-full border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full border border-blue-500/50 bg-blue-500/20 py-3 font-medium text-white transition-colors hover:bg-blue-500/30 disabled:opacity-50"
              >
                {isLoginLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthChoiceModal;
