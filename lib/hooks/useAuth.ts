"use client";

import { useEffect, useState, useCallback } from "react";
import { getUser } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'session_token=; path=/; max-age=0; samesite=lax';
  }
}

export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUser();
      if (res.error || !res.data) {
        setUser(null);
        setError(res.error || "No user");
        if (res.status === 401) {
          clearSessionCookie();
        }
      } else {
        setUser(res.data);
      }
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Run on mount to hydrate client auth state
    load();
  }, [load]);

  return { user, loading, error, refresh: load } as const;
}
