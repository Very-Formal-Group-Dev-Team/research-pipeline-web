'use client';

import { FiArrowDown, FiArrowUp, FiRotateCcw, FiSearch } from 'react-icons/fi';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  DEFAULT_PROJECT_LIST_FILTERS,
  isProjectListFiltersDirty,
  type ProjectListFilterState,
  type ProjectSortBy,
  type ProjectSortDirection,
} from '@/lib/projects/listFilters';

const INACTIVE_CLASS = 'bg-neutral-100 text-neutral-600';
const ACTIVE_CLASS = 'bg-primary-600/10 text-primary-700';

const SORT_OPTIONS: { value: ProjectSortBy; label: string; shortLabel: string }[] = [
  { value: 'date', label: 'Date', shortLabel: 'Date' },
  { value: 'title', label: 'Alphabetical', shortLabel: 'A–Z' },
  { value: 'stage', label: 'Research stage', shortLabel: 'Stage' },
];

export interface ProjectListToolbarProps {
  filters: ProjectListFilterState;
  courseOptions: string[];
  programOptions: string[];
  onFiltersChange: (next: ProjectListFilterState) => void;
}

function pillClass(active: boolean) {
  return `shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${
    active ? ACTIVE_CLASS : INACTIVE_CLASS
  }`;
}

export default function ProjectListToolbar({
  filters,
  courseOptions,
  programOptions,
  onFiltersChange,
}: ProjectListToolbarProps) {
  const update = (patch: Partial<ProjectListFilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const setSortBy = (sortBy: ProjectSortBy) => update({ sortBy });
  const setSortDirection = (sortDirection: ProjectSortDirection) => update({ sortDirection });
  const filtersDirty = isProjectListFiltersDirty(filters);

  const resetFilters = () => {
    onFiltersChange(DEFAULT_PROJECT_LIST_FILTERS);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <Input
            type="search"
            value={filters.searchQuery}
            onChange={(event) => update({ searchQuery: event.target.value })}
            placeholder="Search by project title..."
            leftIcon={<FiSearch className="h-4 w-4" />}
            fullWidth
            aria-label="Search projects by title"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:contents">
          <div className="min-w-0 sm:w-40 sm:shrink-0">
            <Select
              aria-label="Filter by course"
              value={filters.course}
              onChange={(event) => update({ course: event.target.value })}
              options={[
                { value: '', label: 'All courses' },
                ...courseOptions.map((course) => ({ value: course, label: course })),
              ]}
              fullWidth
            />
          </div>
          <div className="min-w-0 sm:w-40 sm:shrink-0">
            <Select
              aria-label="Filter by program"
              value={filters.program}
              onChange={(event) => update({ program: event.target.value })}
              options={[
                { value: '', label: 'All programs' },
                ...programOptions.map((program) => ({ value: program, label: program })),
              ]}
              fullWidth
            />
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-2 text-xs lg:text-sm">
        <div className="-mx-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 flex-nowrap lg:overflow-visible">
          <span className="shrink-0 text-neutral-500">Sort by:</span>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortBy(option.value)}
              className={pillClass(filters.sortBy === option.value)}
              aria-pressed={filters.sortBy === option.value}
            >
              <span className="md:hidden">{option.shortLabel}</span>
              <span className="hidden md:inline">{option.label}</span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-neutral-500">Order:</span>
          <button
            type="button"
            onClick={() => setSortDirection('asc')}
            className={`inline-flex items-center gap-1 ${pillClass(filters.sortDirection === 'asc')}`}
            aria-pressed={filters.sortDirection === 'asc'}
          >
            <FiArrowUp className="h-3.5 w-3.5" aria-hidden />
            Asc
          </button>
          <button
            type="button"
            onClick={() => setSortDirection('desc')}
            className={`inline-flex items-center gap-1 ${pillClass(filters.sortDirection === 'desc')}`}
            aria-pressed={filters.sortDirection === 'desc'}
          >
            <FiArrowDown className="h-3.5 w-3.5" aria-hidden />
            Desc
          </button>
          {filtersDirty ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              <FiRotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
