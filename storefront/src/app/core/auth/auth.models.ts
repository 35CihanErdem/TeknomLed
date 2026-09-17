export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  profileComplete: boolean;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  phone: string;
  fullName?: string | null;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}
