'use client';

import { formControlResponsiveClassName, formLabelClassName } from '@/lib/utils/formControls';

/** Date column: compact but fits typical date inputs; pair with a wider modal on sm+. */
export const COORDINATOR_DATE_FIELD_WRAPPER_CLASS =
  'w-full sm:w-[10rem] sm:max-w-[10rem] sm:shrink-0';

export const COORDINATOR_DATE_TIME_ROW_CLASS =
  'flex w-full min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between';

export const COORDINATOR_TIME_FIELD_WRAPPER_CLASS = 'w-full min-w-0 sm:w-auto sm:shrink-0';

/** Form body width (date + time row); modal adds 3rem horizontal padding in Modal `schedule`. */
export const COORDINATOR_SCHEDULE_CONTENT_WIDTH = '32rem';

export const COORDINATOR_SCHEDULE_FORM_CLASS = 'w-full min-w-0 max-w-[32rem]';

/** Compact input/select height for coordinator schedule modals (excludes textareas). */
const COORDINATOR_SCHEDULE_COMPACT_FIELD_CLASS = [
  '[&_input:not([type=checkbox]):not([type=radio])]:!rounded-md [&_select]:!rounded-md',
  '[&_input:not(.coordinator-panelist-search):not([type=checkbox]):not([type=radio])]:!px-3 [&_input:not(.coordinator-panelist-search):not([type=checkbox]):not([type=radio])]:!py-2 [&_input:not([type=checkbox]):not([type=radio])]:!text-sm',
  '[&_select]:!px-3 [&_select]:!py-2 [&_select]:!pl-3 [&_select]:!pr-9 [&_select]:!text-sm',
  '[&_label]:!mb-1',
].join(' ');

/** Schedule institution event modal — compact fields; description textarea keeps default sizing. */
export const COORDINATOR_SCHEDULE_EVENT_FORM_CLASS = [
  COORDINATOR_SCHEDULE_FORM_CLASS,
  COORDINATOR_SCHEDULE_COMPACT_FIELD_CLASS,
].join(' ');

/** Schedule defense modal — compact fields plus panelist search padding. */
export const COORDINATOR_SCHEDULE_DEFENSE_FORM_CLASS = [
  COORDINATOR_SCHEDULE_FORM_CLASS,
  COORDINATOR_SCHEDULE_COMPACT_FIELD_CLASS.replaceAll('!rounded-md', '!rounded-sm'),
  '[&_input.coordinator-panelist-search]:!rounded-sm [&_input.coordinator-panelist-search]:!py-2 [&_input.coordinator-panelist-search]:!pl-11 [&_input.coordinator-panelist-search]:!pr-3',
].join(' ');

/** Defense edit page — full-width compact fields (no modal max-width). */
export const COORDINATOR_DEFENSE_EDIT_FORM_CLASS = [
  'w-full min-w-0',
  COORDINATOR_SCHEDULE_COMPACT_FIELD_CLASS.replaceAll('!rounded-md', '!rounded-sm'),
  '[&_input.coordinator-panelist-search]:!rounded-sm [&_input.coordinator-panelist-search]:!py-2 [&_input.coordinator-panelist-search]:!pl-11 [&_input.coordinator-panelist-search]:!pr-3',
].join(' ');

/** Modal width hugs the date/time row (see Modal size `schedule`). */
export const COORDINATOR_SCHEDULE_MODAL_SIZE = 'schedule' as const;

const TIME_INPUT_CLASS = `${formControlResponsiveClassName} min-w-0 w-full flex-1 basis-0 sm:w-[9rem] sm:max-w-[9rem] sm:flex-none sm:shrink-0`;

const TIME_INPUT_FULL_WIDTH_CLASS = `${formControlResponsiveClassName} min-w-0 w-full flex-1 basis-0`;

const TIME_SLOT_INPUT_CLASS = `${formControlResponsiveClassName} min-w-0 w-full sm:w-[9rem] sm:max-w-[9rem] sm:shrink-0`;

export function CoordinatorTimeSlotField({
  time,
  onChange,
  required,
  label = 'Time',
}: {
  time: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
}) {
  return (
    <div className="min-w-0 w-full max-w-full sm:w-auto">
      <label className={formLabelClassName}>
        {label}
        {required ? <span className="text-error-500 ml-1">*</span> : null}
      </label>
      <input
        type="time"
        required={required}
        value={time}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={TIME_SLOT_INPUT_CLASS}
      />
    </div>
  );
}

export function CoordinatorTimeRangeFields({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  required,
  fullWidth = false,
}: {
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  required?: boolean;
  fullWidth?: boolean;
}) {
  const inputClass = fullWidth ? TIME_INPUT_FULL_WIDTH_CLASS : TIME_INPUT_CLASS;

  return (
    <div className={`min-w-0 w-full max-w-full ${fullWidth ? '' : 'sm:w-auto'}`}>
      <label className={formLabelClassName}>
        Time
        {required ? <span className="text-error-500 ml-1">*</span> : null}
      </label>
      <div className={`flex w-full min-w-0 items-center gap-2 ${fullWidth ? '' : 'sm:w-auto'}`}>
        <input
          type="time"
          required={required}
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          aria-label="Start time"
          className={inputClass}
        />
        <span className="shrink-0 px-0.5 text-sm text-neutral-500" aria-hidden>
          to
        </span>
        <input
          type="time"
          required={required}
          value={endTime}
          onChange={(e) => onEndChange(e.target.value)}
          aria-label="End time"
          className={inputClass}
        />
      </div>
    </div>
  );
}
