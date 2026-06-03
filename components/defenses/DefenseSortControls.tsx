'use client';

import type { DefenseSortBy } from '@/lib/defenses/sort';

const INACTIVE_CLASS = 'bg-neutral-100 text-neutral-600';

const ACTIVE_TONE_CLASS = {
  coordinator: 'bg-coordinator-navy/10 text-coordinator-ink',
  student: 'bg-primary-600/10 text-primary-700',
} as const;

export interface DefenseSortControlsProps {
  sortBy: DefenseSortBy;
  onSortByChange: (sortBy: DefenseSortBy) => void;
  tone?: keyof typeof ACTIVE_TONE_CLASS;
}

export default function DefenseSortControls({
  sortBy,
  onSortByChange,
  tone = 'coordinator',
}: DefenseSortControlsProps) {
  const activeClass = ACTIVE_TONE_CLASS[tone];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500">Sort by:</span>
      <button
        type="button"
        onClick={() => onSortByChange('time')}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          sortBy === 'time' ? activeClass : INACTIVE_CLASS
        }`}
      >
        Time
      </button>
      <button
        type="button"
        onClick={() => onSortByChange('status')}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          sortBy === 'status' ? activeClass : INACTIVE_CLASS
        }`}
      >
        Status
      </button>
    </div>
  );
}
