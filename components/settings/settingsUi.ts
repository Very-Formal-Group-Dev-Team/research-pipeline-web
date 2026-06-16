/** Shared Archivum styling for settings pages — matches dashboard / notifications patterns. */

export const settingsPageTitleClassName = 'text-3xl font-bold text-primary-700';
export const settingsPageSubtitleClassName = 'text-neutral-600 mt-1';
export const settingsInlineLinkClassName =
  'font-medium text-primary-600 hover:text-primary-700';
export const settingsSectionIntroClassName = 'text-sm text-neutral-600';
export const settingsGroupTitleClassName = 'text-lg font-semibold text-primary-700';
export const settingsRowLabelClassName = 'text-sm text-neutral-700';
export const settingsDividerClassName = 'divide-y divide-neutral-200';

export function settingsTabClassName(active: boolean): string {
  return [
    'shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
    active
      ? 'coordinator-tab-active border-coordinator-rose text-coordinator-ink'
      : 'border-transparent text-neutral-500 hover:text-primary-700',
  ].join(' ');
}

export function settingsChoiceClassName(active: boolean): string {
  return [
    'rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors',
    active
      ? 'border-oxfordBlue bg-primary-50 text-primary-700'
      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
  ].join(' ');
}

export const settingsLoadingSpinnerClassName =
  'animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500';
