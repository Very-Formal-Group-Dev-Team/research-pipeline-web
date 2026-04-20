/**
 * Users API service – replaces all direct Supabase user/profile queries.
 */

import { get, post, patch } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  status_text?: string;
}

export interface CompleteProfilePayload {
  displayName: string;
  role: 'student' | 'teacher' | 'coordinator';
  email: string;
  avatarFile?: File | null;
  googlePhotoUrl?: string | null;
  institutionName?: string;
}

export interface CompleteProfileResult {
  success: boolean;
  redirectPath?: string;
  error?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
  status_text?: string;
}

export interface SearchUserResult {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/** Fetch the current user's profile via /api/user/profile. */
export function getUserProfile() {
  return get<UserProfile>('/user/profile');
}

/** Update the current user's profile via /api/user/profile. */
export function updateUserProfile(payload: UpdateProfilePayload) {
  return patch<UserProfile>('/user/profile', payload);
}

/** Upload avatar via /api/user/avatar and auto-update profile. */
export async function uploadUserAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return post<{ publicUrl: string; profile: UserProfile }>('/user/avatar', formData);
}

/** Fetch the current user's profile. */
export function getMyProfile() {
  return get<UserProfile>('/users/me');
}

/** Fetch a user profile by ID. */
export function getUserById(userId: string) {
  return get<UserProfile>(`/users/${userId}`);
}

/** Check whether the current user has completed onboarding. */
export function checkProfileExists() {
  return get<{ exists: boolean; role?: string }>('/users/me/exists');
}

/** Complete first-time profile setup (onboarding). */
export async function completeProfile(payload: CompleteProfilePayload): Promise<CompleteProfileResult> {
  let avatarUrl: string | null = null;

  if (payload.avatarFile) {
    const formData = new FormData();
    formData.append('avatar', payload.avatarFile);
    const uploadRes = await post<{ publicUrl: string }>('/upload/avatar', formData);
    if (uploadRes.error) return { success: false, error: `Avatar upload failed: ${uploadRes.error}` };
    avatarUrl = uploadRes.data?.publicUrl ?? null;
  }

  const body: Record<string, unknown> = {
    displayName: payload.displayName,
    role: payload.role,
    email: payload.email,
  };
  if (avatarUrl) body.avatarUrl = avatarUrl;
  if (!avatarUrl && payload.googlePhotoUrl) body.googlePhotoUrl = payload.googlePhotoUrl;
  if (payload.institutionName) body.institutionName = payload.institutionName;

  const { data, error } = await post<CompleteProfileResult>('/users/complete-profile', body);
  if (error) return { success: false, error };
  return data ?? { success: false, error: 'No response from server' };
}

/** Update an existing user profile. */
export function updateProfile(payload: UpdateProfilePayload) {
  return patch<UserProfile>('/users/me', payload);
}

/** Search users by email/name, optionally filtered by role. */
export function searchUsers(email: string, role?: 'student' | 'adviser', limit = 10) {
  const params = new URLSearchParams({ email, limit: String(limit) });
  if (role) params.set('role', role);
  return get<SearchUserResult[]>(`/users/search?${params.toString()}`);
}

/** Get user role. */
export function getUserRole() {
  return get<{ role: string }>('/users/me/role');
}
