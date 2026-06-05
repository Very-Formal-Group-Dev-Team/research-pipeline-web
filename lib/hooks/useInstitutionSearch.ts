'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchInstitutions, type RegisteredInstitution } from '@/lib/api/institutions';

interface UseInstitutionSearchOptions {
  debounceMs?: number;
}

export function useInstitutionSearch({ debounceMs = 250 }: UseInstitutionSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegisteredInstitution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (term: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await searchInstitutions(term);
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
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsLoading(true);
    timerRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, debounceMs, search]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return { query, setQuery, results, isLoading, error, reset, refresh: search };
}
