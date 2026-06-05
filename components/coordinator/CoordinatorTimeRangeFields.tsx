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

/** Modal width hugs the date/time row (see Modal size `schedule`). */
export const COORDINATOR_SCHEDULE_MODAL_SIZE = 'schedule' as const;

const TIME_INPUT_CLASS = `${formControlResponsiveClassName} min-w-0 w-full flex-1 basis-0 sm:w-[9rem] sm:max-w-[9rem] sm:flex-none sm:shrink-0`;

export function CoordinatorTimeRangeFields({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  required,
}: {
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="min-w-0 w-full max-w-full sm:w-auto">
      <label className={formLabelClassName}>
        Time
        {required ? <span className="text-error-500 ml-1">*</span> : null}
      </label>
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <input
          type="time"
          required={required}
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          aria-label="Start time"
          className={TIME_INPUT_CLASS}
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
          className={TIME_INPUT_CLASS}
        />
      </div>
    </div>
  );
}
