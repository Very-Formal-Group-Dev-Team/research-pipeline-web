import { readDisplaySettings } from '@/lib/preferences/displaySettings';

function readCalendarSettingsForFormat(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem('calendar-settings');
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { use24HourFormat?: boolean };
    return parsed.use24HourFormat ?? true;
  } catch {
    return true;
  }
}

export function parseWallClockDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parsed = new Date(iso.replace(/Z$/i, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateTime(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const { timezone } = readDisplaySettings();
  const use24Hour = readCalendarSettingsForFormat();

  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
    ...options,
  }).format(date);
}

/** Defense/meeting datetimes stored as wall-clock values (no timezone shift). */
export function formatWallClockDateTime(
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : parseWallClockDate(typeof value === 'string' ? value : null);
  if (!date) return '-';

  const use24Hour = readCalendarSettingsForFormat();

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
    ...options,
  }).format(date);
}

export function formatWallClockDateLong(value?: string | Date | null): string {
  const date = value instanceof Date ? value : parseWallClockDate(typeof value === 'string' ? value : null);
  if (!date) return '-';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatWallClockTime(value?: string | Date | null): string {
  const date = value instanceof Date ? value : parseWallClockDate(typeof value === 'string' ? value : null);
  if (!date) return '-';

  const use24Hour = readCalendarSettingsForFormat();

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  }).format(date);
}

export function getUserTimezone(): string {
  return readDisplaySettings().timezone;
}
