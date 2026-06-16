'use client';

import { useEffect, useState } from 'react';
import { FiMoon, FiSun, FiMonitor } from 'react-icons/fi';
import Button from '@/components/Button';
import { useSettingsPreferences } from '@/components/settings/SettingsPreferencesContext';
import { settingsSectionIntroClassName } from '@/components/settings/settingsUi';
import type { ThemePreference } from '@/lib/preferences/settingsDefaults';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof FiSun }[] = [
  { value: 'light', label: 'Light', icon: FiSun },
  { value: 'dark', label: 'Dark', icon: FiMoon },
  { value: 'system', label: 'System', icon: FiMonitor },
];

function resolveThemeLabel(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export default function ThemeToggle() {
  const { draft, setThemePreference } = useSettingsPreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className="h-[4.5rem] rounded-lg border border-neutral-300 bg-neutral-50"
          />
        ))}
      </div>
    );
  }

  const resolved = resolveThemeLabel(draft.theme);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = draft.theme === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant={active ? 'primary' : 'outline'}
              className={`flex h-auto flex-col items-center gap-2 py-4 ${
                active ? 'coordinator-btn-primary' : 'coordinator-btn-secondary'
              }`}
              onClick={() => setThemePreference(opt.value)}
            >
              <Icon className="text-lg" />
              {opt.label}
            </Button>
          );
        })}
      </div>
      <p className={settingsSectionIntroClassName}>
        Preview: {resolved} mode{draft.theme === 'system' ? ' (system)' : ''}. Save changes to apply.
      </p>
    </div>
  );
}
