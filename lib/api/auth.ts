/**
 * Auth API service – replaces all direct Supabase auth calls.
 *
 * Every function hits the backend, which owns the auth provider integration,
 * session management, and token issuance.
 */

import { get, post } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResult {
  user: AuthUser | null;
  token?: string;
  message?: string;
  redirectTo?: string;
  pending?: boolean;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/** Sign in with email + password. */
export function login(payload: LoginPayload) {
  return post<AuthResult>('/auth/login', payload);
}

/** Register a new account with email + password. */
export function register(payload: RegisterPayload) {
  return post<AuthResult>('/auth/register', payload);
}

/** Initiate OAuth sign-in (Google, etc.). Returns a redirect URL. */
export function oAuthSignIn(provider: string, redirectTo: string) {
  return post<{ url: string }>('/auth/oauth', { provider, redirectTo });
}

/** Get the currently authenticated user (session validation). */
export function getUser() {
  return get<AuthUser>('/auth/me');
}

/** Log out the current user (invalidate server session). */
export function logout() {
  return post<{ success: boolean }>('/auth/logout');
}

/** Verify an email with a token (e.g., from a confirmation link). */
export function verifyEmail(token: string) {
  return post<AuthResult>('/auth/verify-email', { token });
}

export function resendVerification(email: string) {
  return post<{ message: string }>('/auth/resend-verification', { email });
}
