'use client';

import React, { useEffect, useRef } from 'react';
import { Modal, Avatar } from '@/components/ui';
import { useUserSearch } from '@/lib/hooks/useUserSearch';
import type { SearchUserResult } from '@/lib/api/users';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: SearchUserResult) => void;
  role?: 'student' | 'adviser';
  title: string;
  excludeIds?: string[];
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onSelect,
  role,
  title,
  excludeIds = [],
}: UserSearchModalProps) {
  const { query, setQuery, results, isLoading, error, reset } = useUserSearch({ role });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      reset();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, reset]);

  const filteredResults = results.filter((u) => !excludeIds.includes(u.id));

  const handleSelect = (user: SearchUserResult) => {
    onSelect(user);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search by name or email...`}
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {error && (
            <div className="text-sm text-error-600 text-center py-4">{error}</div>
          )}

          {!isLoading && !error && query.trim().length >= 2 && filteredResults.length === 0 && (
            <div className="text-sm text-neutral-500 text-center py-8">
              No {role === 'student' ? 'students' : role === 'adviser' ? 'advisers' : 'users'} found matching &quot;{query}&quot;
            </div>
          )}

          {query.trim().length < 2 && !isLoading && (
            <div className="text-sm text-neutral-400 text-center py-8">
              Type at least 2 characters to search
            </div>
          )}

          {filteredResults.length > 0 && (
            <ul className="divide-y divide-neutral-100">
              {filteredResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-primary-50 rounded-lg transition-colors text-left"
                  >
                    <Avatar
                      src={user.avatar_url}
                      name={user.full_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 capitalize">{user.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
