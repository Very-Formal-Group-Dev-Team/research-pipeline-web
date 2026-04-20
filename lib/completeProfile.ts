import { completeProfile as apiCompleteProfile, updateProfile } from './api/users';

export type UserRole = 'student' | 'teacher' | 'coordinator';
export type AppRole = 'student' | 'adviser' | 'coordinator';

export interface CompleteProfileData {
  userId: string;
  displayName: string;
  role: UserRole;
  avatarFile?: File | null;
  googlePhotoUrl?: string | null;
  email: string;
}

export interface CompleteProfileResult {
  success: boolean;
  redirectPath?: string;
  error?: string;
}

/**
 * Gets the redirect path based on the user's role
 */
function getRedirectPath(role: UserRole): string {
  if (role === 'student') return '/student';
  if (role === 'coordinator') return '/coordinator';
  return '/adviser';
}

/**
 * Completes the user profile setup for first-time users.
 * Delegates all work to the backend via the API client.
 */
export async function completeProfile(
  data: CompleteProfileData
): Promise<CompleteProfileResult> {
  const { displayName, role, avatarFile, googlePhotoUrl, email } = data;

  try {
    if (!displayName || !role || !email) {
      return {
        success: false,
        error: 'Missing required fields: displayName, role, and email are required',
      };
    }

    const result = await apiCompleteProfile({
      displayName,
      role,
      email,
      avatarFile: avatarFile ?? null,
      googlePhotoUrl: googlePhotoUrl ?? null,
    });

    if (result.success) {
      return {
        success: true,
        redirectPath: result.redirectPath || getRedirectPath(role),
      };
    }

    return { success: false, error: result.error || 'Profile setup failed' };
  } catch (error) {
    console.error('Error completing profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Update an existing user profile.
 * Delegates to the backend API.
 */
export async function updateUserProfile(
  data: { full_name?: string; avatar_url?: string },
) {
  const { data: updated, error } = await updateProfile(data);

  if (error) {
    throw new Error(error);
  }

  return updated;
}
