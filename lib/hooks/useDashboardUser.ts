'use client';

import { useRouter } from 'next/navigation';
import { useUserProfile, type UserProfileView } from './useUserProfile';

export interface DashboardUser {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface UseDashboardUserResult {
  /** The user object formatted for DashboardLayout header. */
  user: DashboardUser;
  /** Full profile data from the API. */
  profile: UserProfileView | null;
  /** Whether the profile is still loading. */
  isLoading: boolean;
  /** Clears session and redirects to login. */
  handleLogout: () => void;
}

/**
 * Shared hook that provides consistent user data across all dashboard pages.
 * Solves the "header shows placeholder on route change" bug by centralizing
 * data fetching through useUserProfile.
 *
 * @param fallbackRole – role label to show while the profile is loading.
 */
export function useDashboardUser(fallbackRole: string = 'Student'): UseDashboardUserResult {
  const router = useRouter();
  const { user: profile, isLoading } = useUserProfile();

  const user: DashboardUser = profile
    ? { name: profile.name, email: profile.email, role: profile.role, avatar: profile.avatar }
    : { name: '', email: '', role: fallbackRole, avatar: undefined };

  const handleLogout = () => {
    document.cookie = 'session_token=; path=/; max-age=0';
    router.push('/login');
  };

  return { user, profile, isLoading, handleLogout };
}
