/**
 * Authentication related types
 */

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  role: "admin" | "user" | "guest";
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  isGuest?: boolean;
}

export interface GuestSignupRequest {
  isGuest: true;
}

export interface AuthResponse {
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expireAt?: string;
  };
}

export interface ProfileResponse {
  message: string;
  data: User;
}

export interface RefreshTokenResponse {
  status: string;
  message: string;
  data: {
    accessToken: string;
    expire_at: string;
  };
}
