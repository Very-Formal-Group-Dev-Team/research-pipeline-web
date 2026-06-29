'use client';

import { FiRotateCcw } from 'react-icons/fi';

import Select from '@/components/ui/Select';

export const AUDIT_ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'user.login', label: 'User login' },
  { value: 'user.role_assigned', label: 'Role assigned' },
  { value: 'user.role_changed', label: 'Role changed' },
  { value: 'user.activated', label: 'User activated' },
  { value: 'user.deactivated', label: 'User deactivated' },
  { value: 'institution.created', label: 'Institution created' },
  { value: 'institution.updated', label: 'Institution updated' },
  { value: 'project.stage_changed', label: 'Project stage changed' },
  { value: 'paper_version.uploaded', label: 'Paper version uploaded' },
  { value: 'evaluation.submitted', label: 'Evaluation submitted' },
];

export interface AdminAuditFilterState {
  action: string;
}

export const DEFAULT_ADMIN_AUDIT_FILTERS: AdminAuditFilterState = {
  action: '',
};

export function isAdminAuditFiltersDirty(filters: AdminAuditFilterState): boolean {
  return Boolean(filters.action);
}

export interface AdminAuditListToolbarProps {
  filters: AdminAuditFilterState;
  onFiltersChange: (next: AdminAuditFilterState) => void;
}

export default function AdminAuditListToolbar({
  filters,
  onFiltersChange,
}: AdminAuditListToolbarProps) {
  const filtersDirty = isAdminAuditFiltersDirty(filters);

  const resetFilters = () => {
    onFiltersChange(DEFAULT_ADMIN_AUDIT_FILTERS);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 sm:w-56 sm:shrink-0">
          <Select
            aria-label="Filter by action type"
            value={filters.action}
            onChange={(event) => onFiltersChange({ action: event.target.value })}
            options={AUDIT_ACTION_OPTIONS}
            fullWidth
          />
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
