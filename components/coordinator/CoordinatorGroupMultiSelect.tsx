'use client';

import { formLabelClassName } from '@/lib/utils/formControls';
import type { CourseGroup } from '@/lib/api/coordinator';

export default function CoordinatorGroupMultiSelect({
  groups,
  selectedIds,
  onChange,
  disabled,
  loading,
}: {
  groups: CourseGroup[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const selectedSet = new Set(selectedIds);

  function toggleGroup(groupId: string) {
    if (disabled) return;
    if (selectedSet.has(groupId)) {
      onChange(selectedIds.filter((id) => id !== groupId));
      return;
    }
    onChange([...selectedIds, groupId]);
  }

  let helperText = 'Select one or more groups for this course.';
  if (disabled) {
    helperText = 'Select a course to choose groups.';
  } else if (loading) {
    helperText = 'Loading groups...';
  } else if (!groups.length) {
    helperText = 'No groups found for this course.';
  }

  return (
    <div>
      <label className={formLabelClassName}>
        Groups
        <span className="text-error-500 ml-1">*</span>
      </label>
      <div
        className={`max-h-40 space-y-1 overflow-y-auto rounded-md border border-neutral-200 p-2 ${
          disabled ? 'bg-neutral-50' : 'bg-white'
        }`}
      >
        {groups.map((group) => {
          const checked = selectedSet.has(group.id);
          return (
            <label
              key={group.id}
              className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                disabled ? 'cursor-not-allowed text-neutral-400' : 'hover:bg-coordinator-rose/5'
              } ${checked && !disabled ? 'bg-coordinator-rose/5' : ''}`}
            >
              <input
                type="checkbox"
                className="mt-0.5 shrink-0 accent-coordinator-rose"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleGroup(group.id)}
              />
              <span className="min-w-0">
                <span className="block truncate font-medium text-coordinator-ink">{group.title}</span>
                <span className="block truncate text-xs text-neutral-500">{group.project_code}</span>
              </span>
            </label>
          );
        })}
        {!loading && !disabled && groups.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-neutral-500">No groups available.</p>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-neutral-500">{helperText}</p>
    </div>
  );
}
