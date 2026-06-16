export const CALENDAR_SETTINGS_KEY = 'calendar-settings';
export const DISPLAY_SETTINGS_KEY = 'display-settings';

export const MIN_SCROLL_HOUR = 0;
export const MAX_SCROLL_HOUR = 16;

export interface CalendarSettings {
  badgeVariant: 'dot' | 'colored';
  view: 'day' | 'week' | 'month' | 'year' | 'agenda';
  use24HourFormat: boolean;
  startOfDayHour: number;
  agendaModeGroupBy: 'date' | 'color';
}

export interface DisplaySettings {
  timezone: string;
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  badgeVariant: 'colored',
  view: 'day',
  use24HourFormat: true,
  startOfDayHour: 8,
  agendaModeGroupBy: 'date',
};

export function getDefaultTimezone(): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return 'UTC';
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  timezone: getDefaultTimezone(),
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function readCalendarSettings(): CalendarSettings {
  return readJson(CALENDAR_SETTINGS_KEY, DEFAULT_CALENDAR_SETTINGS);
}

export function writeCalendarSettings(partial: Partial<CalendarSettings>): CalendarSettings {
  const next = { ...readCalendarSettings(), ...partial };
  writeJson(CALENDAR_SETTINGS_KEY, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('calendar-settings-changed', { detail: next }));
  }
  return next;
}

export function readDisplaySettings(): DisplaySettings {
  return readJson(DISPLAY_SETTINGS_KEY, DEFAULT_DISPLAY_SETTINGS);
}

export function writeDisplaySettings(partial: Partial<DisplaySettings>): DisplaySettings {
  const next = { ...readDisplaySettings(), ...partial };
  writeJson(DISPLAY_SETTINGS_KEY, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('display-settings-changed', { detail: next }));
  }
  return next;
}

export function replaceCalendarSettings(settings: CalendarSettings): CalendarSettings {
  writeJson(CALENDAR_SETTINGS_KEY, settings);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('calendar-settings-changed', { detail: settings }));
  }
  return settings;
}

export function replaceDisplaySettings(settings: DisplaySettings): DisplaySettings {
  writeJson(DISPLAY_SETTINGS_KEY, settings);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('display-settings-changed', { detail: settings }));
  }
  return settings;
}

export function clearCalendarSettings(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CALENDAR_SETTINGS_KEY);
    window.dispatchEvent(
      new CustomEvent('calendar-settings-changed', { detail: DEFAULT_CALENDAR_SETTINGS }),
    );
  } catch {
    // ignore
  }
}

export function clearDisplaySettings(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DISPLAY_SETTINGS_KEY);
    window.dispatchEvent(
      new CustomEvent('display-settings-changed', { detail: DEFAULT_DISPLAY_SETTINGS }),
    );
  } catch {
    // ignore
  }
}

export const COMMON_TIMEZONES = [
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];
