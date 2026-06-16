'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Card, { CardTitle } from '@/components/ui/Card';
import SettingsToggleRow from '@/components/settings/SettingsToggleRow';
import { useSettingsPreferences } from '@/components/settings/SettingsPreferencesContext';
import {
  settingsChoiceClassName,
  settingsDividerClassName,
  settingsSectionIntroClassName,
  settingsLoadingSpinnerClassName,
} from '@/components/settings/settingsUi';
import {
  COMMON_TIMEZONES,
  MAX_SCROLL_HOUR,
  MIN_SCROLL_HOUR,
} from '@/lib/preferences/displaySettings';
import { formLabelClassName, formSelectClassName } from '@/lib/utils/formControls';

export default function CalendarPrefsSection() {
  const { draft, isLoading, setCalendarPreference, setDisplayPreference } =
    useSettingsPreferences();

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-10">
          <div className={settingsLoadingSpinnerClassName} />
        </div>
      </Card>
    );
  }

  const { calendar, display } = draft;

  return (
    <div className="space-y-6">
      <p className={settingsSectionIntroClassName}>
        These preferences apply to the Events calendar and how dates and times are shown across the app.
        Changes are applied when you save.
      </p>

      <Card>
        <CardTitle className="mb-4 text-primary-700">Calendar display</CardTitle>
        <ul className={`${settingsDividerClassName} mb-4`}>
          <SettingsToggleRow
            label="Use dot event badges"
            description="Show a colored dot beside each event instead of a full-color badge."
            checked={calendar.badgeVariant === 'dot'}
            onCheckedChange={(checked) =>
              setCalendarPreference({ badgeVariant: checked ? 'dot' : 'colored' })
            }
          />
          <SettingsToggleRow
            label="Use 24-hour time format"
            checked={calendar.use24HourFormat}
            onCheckedChange={(checked) => setCalendarPreference({ use24HourFormat: checked })}
          />
        </ul>

        <div className="max-w-xs">
          <Input
            label="Day starts at (hour)"
            type="number"
            min={MIN_SCROLL_HOUR}
            max={MAX_SCROLL_HOUR}
            value={String(calendar.startOfDayHour)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val) && val >= MIN_SCROLL_HOUR && val <= MAX_SCROLL_HOUR) {
                setCalendarPreference({ startOfDayHour: val });
              }
            }}
          />
        </div>

        <div className="mt-6">
          <p className={formLabelClassName}>Agenda view group by</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['date', 'color'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCalendarPreference({ agendaModeGroupBy: mode })}
                className={settingsChoiceClassName(calendar.agendaModeGroupBy === mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4 text-primary-700">Timezone</CardTitle>
        <p className={`mb-3 ${settingsSectionIntroClassName}`}>
          Used when displaying event times and timestamps.
        </p>
        <select
          value={display.timezone}
          onChange={(e) => setDisplayPreference({ timezone: e.target.value })}
          className={`${formSelectClassName} max-w-md`}
        >
          {[display.timezone, ...COMMON_TIMEZONES.filter((tz) => tz !== display.timezone)].map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </Card>
    </div>
  );
}
