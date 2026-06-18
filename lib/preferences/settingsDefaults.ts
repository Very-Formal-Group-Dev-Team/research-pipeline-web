import type { NotificationPreference } from '@/lib/api/users';
import {
  DEFAULT_CALENDAR_SETTINGS,
  getDefaultTimezone,
  type CalendarSettings,
  type DisplaySettings,
} from '@/lib/preferences/displaySettings';

export type ThemePreference = 'light' | 'dark' | 'system';

export const DEFAULT_THEME: ThemePreference = 'light';

export const ALL_NOTIFICATION_TYPES = [
  'invitation',
  'join_request',
  'member_left',
  'ownership_transferred',
  'project_stage_updated',
  'review_requested',
  'review_completed',
  'comment_added',
  'comment_resolved',
  'revision_requested',
  'paper_version_committed',
  'project_updated',
  'schedule',
  'defense_approved',
  'defense_rejected',
  'defense_moved',
  'event',
] as const;

export interface SettingsDraft {
  theme: ThemePreference;
  calendar: CalendarSettings;
  display: DisplaySettings;
  notifications: NotificationPreference[];
}

export function createDefaultNotificationPreferences(): NotificationPreference[] {
  return ALL_NOTIFICATION_TYPES.map((type) => ({ type, enabled: true }));
}

export function createDefaultSettingsDraft(): SettingsDraft {
  return {
    theme: DEFAULT_THEME,
    calendar: { ...DEFAULT_CALENDAR_SETTINGS },
    display: { timezone: getDefaultTimezone() },
    notifications: createDefaultNotificationPreferences(),
  };
}

export function normalizeSettingsDraft(partial: {
  theme?: string | null;
  calendar?: Partial<CalendarSettings>;
  display?: Partial<DisplaySettings>;
  notifications?: NotificationPreference[];
}): SettingsDraft {
  const defaults = createDefaultSettingsDraft();
  const theme =
    partial.theme === 'light' || partial.theme === 'dark' || partial.theme === 'system'
      ? partial.theme
      : defaults.theme;

  const notificationMap = new Map(
    (partial.notifications ?? defaults.notifications).map((p) => [p.type, p.enabled]),
  );

  return {
    theme,
    calendar: { ...defaults.calendar, ...partial.calendar },
    display: { ...defaults.display, ...partial.display },
    notifications: ALL_NOTIFICATION_TYPES.map((type) => ({
      type,
      enabled: notificationMap.get(type) ?? true,
    })),
  };
}

export function settingsDraftsEqual(a: SettingsDraft, b: SettingsDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
