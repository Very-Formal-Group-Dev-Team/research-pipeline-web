/**
 * Hook that fetches the current user's profile from the backend.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, type UserProfile } from '@/lib/api/users';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

function resolveAvatarUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/uploads/')) return `${API_ORIGIN}${raw}`;
  return `${API_ORIGIN}${raw}`;
}

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
