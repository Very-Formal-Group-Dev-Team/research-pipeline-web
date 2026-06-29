'use client';

import { FiRotateCcw, FiSearch } from 'react-icons/fi';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'student', label: 'Student' },
  { value: 'adviser', label: 'Adviser' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export interface AdminUsersFilterState {
  search: string;
  role: string;
  status: string;
}

export const DEFAULT_ADMIN_USERS_FILTERS: AdminUsersFilterState = {
  search: '',
  role: '',
  status: '',
};

export function isAdminUsersFiltersDirty(filters: AdminUsersFilterState): boolean {
  return Boolean(filters.search.trim() || filters.role || filters.status);
}

export interface AdminUsersListToolbarProps {
  filters: AdminUsersFilterState;
  onFiltersChange: (next: AdminUsersFilterState) => void;
}

export default function AdminUsersListToolbar({
  filters,
  onFiltersChange,
}: AdminUsersListToolbarProps) {
  const update = (patch: Partial<AdminUsersFilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const filtersDirty = isAdminUsersFiltersDirty(filters);

  const resetFilters = () => {
    onFiltersChange(DEFAULT_ADMIN_USERS_FILTERS);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <Input
            type="search"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Search by name or email..."
            leftIcon={<FiSearch className="h-4 w-4" />}
            fullWidth
            aria-label="Search users by name or email"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:contents">
          <div className="min-w-0 sm:w-40 sm:shrink-0">
            <Select
              aria-label="Filter by role"
              value={filters.role}
              onChange={(event) => update({ role: event.target.value })}
              options={ROLE_OPTIONS}
              fullWidth
            />
          </div>
          <div className="min-w-0 sm:w-40 sm:shrink-0">
            <Select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) => update({ status: event.target.value })}
              options={STATUS_OPTIONS}
              fullWidth
            />
          </div>
        </div>
      </div>

      {filtersDirty ? (
        <div className="flex w-full items-center justify-end gap-2 text-xs lg:text-sm">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            <FiRotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
