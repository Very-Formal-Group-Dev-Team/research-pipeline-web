/** Shared typography and spacing for text fields, selects, and textareas */
export const formLabelClassName = 'block text-sm font-medium text-primary-700 mb-1.5';

/** text-sm on small screens, text-md from md breakpoint up */
export const formControlTextSizeClassName = 'text-sm md:text-md';

/** Summary cards: project code and timeline (use inside `.project-detail-forms`) */
export const projectSummaryDetailTextClassName = [
  'project-summary-detail-text',
  formControlTextSizeClassName,
].join(' ');

/** Project code value box — border lighter than summary `Card` (neutral-400) */
export const projectCodeDisplayClassName = [
  'flex-1 min-w-0 break-all rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 font-mono text-primary-700',
  projectSummaryDetailTextClassName,
].join(' ');

/** Project Details card metadata: text-sm → text-md from md (student / default) */
export const projectDetailMetadataTextClassName = [
  'project-detail-metadata-text',
  formControlTextSizeClassName,
].join(' ');

/** Adviser read-only metadata: also text-lg from lg */
export const projectDetailMetadataLgTextClassName = [
  'project-detail-metadata-text-lg',
  'text-sm md:text-md lg:text-lg',
].join(' ');

export const projectDetailMetadataBodyTextClassName = `${projectDetailMetadataLgTextClassName} text-neutral-700`;

/** Inline label + value rows in the Project Details card (all breakpoints) */
export const projectDetailFieldRowClassName =
  'project-detail-field-row flex min-w-0 flex-row items-center gap-2 md:gap-3';

const projectDetailLabelLayoutClassName =
  'shrink-0 whitespace-nowrap font-medium leading-tight text-primary-700 w-[10.25rem] md:w-40 md:leading-snug';

export const projectDetailLabelClassName = [
  projectDetailMetadataTextClassName,
  projectDetailLabelLayoutClassName,
].join(' ');

export const projectDetailLabelLgClassName = [
  projectDetailMetadataLgTextClassName,
  projectDetailLabelLayoutClassName,
  'lg:w-44',
].join(' ');

export const projectDetailValueWrapClassName = 'min-w-0 flex-1';

/** Focus glow aligned with oxfordBlue / primary actions */
export const formControlFocusGlowClassName =
  'focus:outline-none focus:shadow-[0_0_12px_rgba(44,62,107,0.2)]';

/** Matches default text field / select control height (py-2.5 + border). */
export const formControlHeightClassName = 'h-[2.75rem]';

export const formControlClassName = [
  'w-full text-sm text-neutral-900',
  'placeholder:text-neutral-400',
  'border border-neutral-300 rounded-lg',
  'px-4 py-2.5',
  formControlFocusGlowClassName,
  'transition-colors',
  'disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-600',
].join(' ');

const selectChevronBg =
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]";

export const formSelectClassName = [
  formControlClassName,
  'appearance-none bg-white bg-no-repeat',
  'bg-[length:1rem_1rem] bg-[right_0.75rem_center]',
  selectChevronBg,
  'pl-4 pr-10',
].join(' ');

export const formTextareaClassName = `${formControlClassName} resize-y min-h-[2.75rem]`;

export const formControlResponsiveClassName = [
  'w-full',
  formControlTextSizeClassName,
  'text-neutral-900',
  'placeholder:text-neutral-400',
  'border border-neutral-300 rounded-lg',
  'px-4 py-2.5',
  formControlFocusGlowClassName,
  'transition-colors',
  'disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-600',
].join(' ');

export const formTextareaResponsiveClassName = `${formControlResponsiveClassName} resize-y min-h-[2.75rem]`;

export const formSelectResponsiveClassName = [
  formControlResponsiveClassName,
  'appearance-none bg-white bg-no-repeat',
  'bg-[length:1rem_1rem] bg-[right_0.75rem_center]',
  selectChevronBg,
  'pl-4 pr-10',
].join(' ');

/** Rubric criteria table row inputs — compact below md */
export const rubricCriteriaInputClassName = [
  'w-full text-xs md:text-sm',
  'text-neutral-900 placeholder:text-neutral-400',
  'border border-neutral-300 rounded-md',
  'px-2 py-1 md:px-2.5 md:py-1.5',
  formControlFocusGlowClassName,
  'transition-colors',
].join(' ');

/** Narrow weight field — fits ~2 digits plus padding */
export const rubricCriteriaWeightInputClassName = [
  rubricCriteriaInputClassName,
  'w-[3.25rem] max-w-[3.25rem] shrink-0 px-1.5 md:px-2',
  'text-center tabular-nums',
].join(' ');
