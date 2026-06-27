import { apiRequest } from '../../../lib/api';
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from '../schemas/authSchemas';

type AuthResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    onboardingCompleted: boolean;
  };
  accessToken: string;
};

type MessageResponse = {
  message: string;
};

export type CurrentUser = AuthResponse['user'] & {
  preferredCurrency: 'PEN' | 'USD';
  timezone: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
};

export function login(values: LoginFormValues) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: values,
  });
}

export function register(values: RegisterFormValues) {
  return apiRequest<MessageResponse>('/auth/register', {
    method: 'POST',
    body: {
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    },
  });
}
export function verifyEmail(token: string) {
  return apiRequest<MessageResponse>('/auth/verify-email', {
    method: 'POST',
    body: { token },
  });
}

export function forgotPassword(values: ForgotPasswordFormValues) {
  return apiRequest<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: values,
  });
}

export function resetPassword(token: string, values: ResetPasswordFormValues) {
  return apiRequest<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: {
      token,
      password: values.password,
    },
  });
}

export function refreshSession() {
  return apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
  });
}

export function logout() {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
  });
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>('/auth/me');
}
