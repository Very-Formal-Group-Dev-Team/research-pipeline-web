/**
 * Hook that fetches the current user's profile from the backend.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '@/lib/api/users';
import { resolveAvatarUrl } from '@/lib/utils/avatarUrl';

export interface UserProfileView {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  statusText?: string;
}

export function useUserProfile() {
  const [user, setUser] = useState<UserProfileView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getUserProfile();
      if (res.error || !res.data) {
        setUser(null);
        setError(res.error || 'Failed to load profile');
      } else {
        const p = res.data;
        setUser({
          id: p.id,
          name: p.full_name || '',
          email: p.email,
          role: p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : 'Student',
          avatar: resolveAvatarUrl(p.avatar_url),
          statusText: p.status_text || undefined,
        });
      }
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, isLoading, error, refetch: load };
}
