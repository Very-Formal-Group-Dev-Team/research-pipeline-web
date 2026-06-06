'use client';

import { FiArrowDown, FiArrowUp } from 'react-icons/fi';

import type { DefenseSortBy, DefenseSortDirection } from '@/lib/defenses/sort';

const INACTIVE_CLASS = 'bg-neutral-100 text-neutral-600';

const ACTIVE_TONE_CLASS = {
  coordinator: 'bg-coordinator-navy/10 text-coordinator-ink',
  student: 'bg-primary-600/10 text-primary-700',
} as const;

export type DefenseSortOption = {
  value: DefenseSortBy;
  label: string;
};

export const DEFENSE_SORT_OPTIONS: DefenseSortOption[] = [
  { value: 'time', label: 'Time' },
  { value: 'stage', label: 'Stage' },
  { value: 'status', label: 'Status' },
];

export const INSTITUTION_EVENT_SORT_OPTIONS: DefenseSortOption[] = [
  { value: 'time', label: 'Time' },
  { value: 'status', label: 'Status' },
];

export interface DefenseSortControlsProps {
  sortBy: DefenseSortBy;
  direction: DefenseSortDirection;
  onSortByChange: (sortBy: DefenseSortBy) => void;
  onDirectionChange: (direction: DefenseSortDirection) => void;
  tone?: keyof typeof ACTIVE_TONE_CLASS;
  options?: DefenseSortOption[];
}

export default function DefenseSortControls({
  sortBy,
  direction,
  onSortByChange,
  onDirectionChange,
  tone = 'coordinator',
  options = DEFENSE_SORT_OPTIONS,
}: DefenseSortControlsProps) {
  const activeClass = ACTIVE_TONE_CLASS[tone];
  const pillClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors sm:text-sm ${
      active ? activeClass : INACTIVE_CLASS
    }`;

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-neutral-500">Sort by:</span>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortByChange(option.value)}
            className={pillClass(sortBy === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="text-neutral-500">Order:</span>
        <button
          type="button"
          onClick={() => onDirectionChange('asc')}
          className={`inline-flex items-center gap-1 ${pillClass(direction === 'asc')}`}
          aria-pressed={direction === 'asc'}
        >
          <FiArrowUp className="h-3.5 w-3.5" aria-hidden />
          Asc
        </button>
        <button
          type="button"
          onClick={() => onDirectionChange('desc')}
          className={`inline-flex items-center gap-1 ${pillClass(direction === 'desc')}`}
          aria-pressed={direction === 'desc'}
        >
          <FiArrowDown className="h-3.5 w-3.5" aria-hidden />
          Desc
        </button>
      </div>
    </div>
  );
}
