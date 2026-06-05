'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formLabelClassName } from '@/lib/utils/formControls';
import { useInstitutionSearch } from '@/lib/hooks/useInstitutionSearch';
import type { RegisteredInstitution } from '@/lib/api/institutions';

interface InstitutionSearchFieldProps {
  label?: string;
  value: RegisteredInstitution | null;
  onChange: (institution: RegisteredInstitution | null) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
}

export default function InstitutionSearchField({
  label = 'Institution',
  value,
  onChange,
  error,
  helperText,
  required,
  placeholder = 'Search for your institution...',
}: InstitutionSearchFieldProps) {
  const { query, setQuery, results, isLoading, error: searchError, refresh } = useInstitutionSearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) return;
    setQuery(value.name);
  }, [value, setQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
    if (!query.trim()) {
      void refresh('');
    }
  };

  const handleInputChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setIsOpen(true);
    if (value && nextQuery !== value.name) {
      onChange(null);
    }
  };

  const handleSelect = (institution: RegisteredInstitution) => {
    onChange(institution);
    setQuery(institution.name);
    setIsOpen(false);
  };

  const displayError = error || searchError || undefined;

  return (
    <div ref={containerRef} className="w-full">
      {label ? (
        <label className={formLabelClassName}>
          {label}
          {required ? <span className="text-error-500 ml-1">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all
            ${displayError ? 'border-error-500' : 'border-neutral-300'}
          `}
          autoComplete="off"
        />

        {isLoading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-md">
          {!isLoading && results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500 text-center">
              No registered institutions found
            </div>
          ) : null}

          {results.map((institution) => (
            <button
              key={institution.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(institution)}
              className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
            >
              <p className="text-sm font-medium text-neutral-900">{institution.name}</p>
              <p className="text-xs text-neutral-500">{institution.code}</p>
            </button>
          ))}
        </div>
      ) : null}

      {(displayError || helperText) && (
        <p className={`mt-1 text-sm ${displayError ? 'text-error-600' : 'text-neutral-500'}`}>
          {displayError || helperText}
        </p>
      )}
    </div>
  );
}
