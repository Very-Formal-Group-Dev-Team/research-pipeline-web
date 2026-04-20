'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchUsers, type SearchUserResult } from '@/lib/api/users';

interface UseUserSearchOptions {
  role?: 'student' | 'adviser';
  debounceMs?: number;
  limit?: number;
}

export function useUserSearch({ role, debounceMs = 300, limit = 10 }: UseUserSearchOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await searchUsers(term.trim(), role, limit);
        if (res.error) {
          setError(res.error);
          setResults([]);
        } else {
          setResults(res.data || []);
        }
      } catch {
        setError('Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [role, limit],
  );

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    timerRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [query, debounceMs, search]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return { query, setQuery, results, isLoading, error, reset };
}
