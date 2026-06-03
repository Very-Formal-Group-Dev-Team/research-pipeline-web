'use client';

import { formControlResponsiveClassName, formLabelClassName } from '@/lib/utils/formControls';

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
    <div className="w-full">
      <label className={formLabelClassName}>
        Time
        {required ? <span className="text-error-500 ml-1">*</span> : null}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="time"
          required={required}
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          aria-label="Start time"
          className={`${formControlResponsiveClassName} min-w-0 flex-1`}
        />
        <span className="shrink-0 text-sm text-neutral-500" aria-hidden>
          to
        </span>
        <input
          type="time"
          required={required}
          value={endTime}
          onChange={(e) => onEndChange(e.target.value)}
          aria-label="End time"
          className={`${formControlResponsiveClassName} min-w-0 flex-1`}
        />
      </div>
    </div>
  );
}
