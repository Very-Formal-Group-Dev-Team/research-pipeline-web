'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import { getNotificationPreferences, updateNotificationPreferences, getDisplayPreferences, updateDisplayPreferences } from '@/lib/api/users';
import {
  readCalendarSettings,
  readDisplaySettings,
  replaceCalendarSettings,
  replaceDisplaySettings,
  clearCalendarSettings,
  clearDisplaySettings,
} from '@/lib/preferences/displaySettings';
import {
  createDefaultSettingsDraft,
  normalizeSettingsDraft,
  settingsDraftsEqual,
  type SettingsDraft,
  type ThemePreference,
} from '@/lib/preferences/settingsDefaults';
import type { CalendarSettings, DisplaySettings } from '@/lib/preferences/displaySettings';
import { toast } from 'sonner';
import { useUnsavedChangesWarning } from '@/lib/hooks/useUnsavedChangesWarning';

interface SettingsPreferencesContextValue {
  draft: SettingsDraft;
  isLoading: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isResetting: boolean;
  setThemePreference: (theme: ThemePreference) => void;
  setCalendarPreference: (partial: Partial<CalendarSettings>) => void;
  setDisplayPreference: (partial: Partial<DisplaySettings>) => void;
  setNotificationPreference: (type: string, enabled: boolean) => void;
  saveChanges: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const SettingsPreferencesContext = createContext<SettingsPreferencesContextValue | null>(null);

async function persistDraft(draft: SettingsDraft, setTheme: (theme: string) => void) {
  setTheme(draft.theme);
  replaceCalendarSettings(draft.calendar);
  replaceDisplaySettings(draft.display);

  const [notifRes, displayRes] = await Promise.all([
    updateNotificationPreferences(draft.notifications),
    updateDisplayPreferences({
      theme: draft.theme,
      timezone: draft.display.timezone,
    }),
  ]);

  if (notifRes.error) {
    throw new Error(notifRes.error);
  }

  if (displayRes.error) {
    throw new Error(displayRes.error);
  }
}

export function SettingsPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [draft, setDraft] = useState<SettingsDraft>(createDefaultSettingsDraft);
  const [saved, setSaved] = useState<SettingsDraft>(createDefaultSettingsDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);

    const calendar = readCalendarSettings();
    const display = readDisplaySettings();
    const [notifRes, displayRes] = await Promise.all([
      getNotificationPreferences(),
      getDisplayPreferences(),
    ]);

    let storedTheme: ThemePreference = createDefaultSettingsDraft().theme;
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('theme');
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        storedTheme = raw;
      }
    }

    const serverTheme = displayRes.data?.theme;
    const serverTimezone = displayRes.data?.timezone;

    const loaded = normalizeSettingsDraft({
      theme: serverTheme || storedTheme,
      calendar,
      display: {
        ...display,
        ...(serverTimezone ? { timezone: serverTimezone } : {}),
      },
      notifications: notifRes.data?.preferences,
    });

    if (serverTheme) {
      setTheme(serverTheme);
    }

    if (serverTimezone) {
      replaceDisplaySettings({ timezone: serverTimezone });
    }

    setDraft(loaded);
    setSaved(loaded);
    setIsLoading(false);
  }, [setTheme]);

  useEffect(() => {
    if (!hydrated) return;
    loadPreferences();
  }, [hydrated, loadPreferences]);

  const isDirty = useMemo(() => !settingsDraftsEqual(draft, saved), [draft, saved]);

  useUnsavedChangesWarning(isDirty);

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setDraft((prev) => ({ ...prev, theme }));
  }, []);

  const setCalendarPreference = useCallback((partial: Partial<CalendarSettings>) => {
    setDraft((prev) => ({
      ...prev,
      calendar: { ...prev.calendar, ...partial },
    }));
  }, []);

  const setDisplayPreference = useCallback((partial: Partial<DisplaySettings>) => {
    setDraft((prev) => ({
      ...prev,
      display: { ...prev.display, ...partial },
    }));
  }, []);

  const setNotificationPreference = useCallback((type: string, enabled: boolean) => {
    setDraft((prev) => ({
      ...prev,
      notifications: prev.notifications.map((pref) =>
        pref.type === type ? { ...pref, enabled } : pref,
      ),
    }));
  }, []);

  const saveChanges = useCallback(async () => {
    if (!isDirty) return;

    setIsSaving(true);
    try {
      await persistDraft(draft, setTheme);
      setSaved(draft);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [draft, isDirty, setTheme]);

  const resetToDefaults = useCallback(async () => {
    const defaults = createDefaultSettingsDraft();
    setIsResetting(true);
    try {
      clearCalendarSettings();
      clearDisplaySettings();
      await persistDraft(defaults, setTheme);
      setDraft(defaults);
      setSaved(defaults);
      toast.success('Settings reset to defaults');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setIsResetting(false);
    }
  }, [setTheme]);

  const value = useMemo(
    () => ({
      draft,
      isLoading,
      isDirty,
      isSaving,
      isResetting,
      setThemePreference,
      setCalendarPreference,
      setDisplayPreference,
      setNotificationPreference,
      saveChanges,
      resetToDefaults,
    }),
    [
      draft,
      isLoading,
      isDirty,
      isSaving,
      isResetting,
      setThemePreference,
      setCalendarPreference,
      setDisplayPreference,
      setNotificationPreference,
      saveChanges,
      resetToDefaults,
    ],
  );

  return (
    <SettingsPreferencesContext.Provider value={value}>
      {children}
    </SettingsPreferencesContext.Provider>
  );
}

export function useSettingsPreferences(): SettingsPreferencesContextValue {
  const ctx = useContext(SettingsPreferencesContext);
  if (!ctx) {
    throw new Error('useSettingsPreferences must be used within SettingsPreferencesProvider');
  }
  return ctx;
}

export function useSettingsPreferencesOptional(): SettingsPreferencesContextValue | null {
  return useContext(SettingsPreferencesContext);
}
