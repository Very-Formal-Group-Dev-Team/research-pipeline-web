'use client';

import React, { useMemo } from 'react';
import Card, { CardTitle } from '@/components/ui/Card';
import SettingsToggleRow from '@/components/settings/SettingsToggleRow';
import { useSettingsPreferences } from '@/components/settings/SettingsPreferencesContext';
import {
  settingsDividerClassName,
  settingsLoadingSpinnerClassName,
  settingsSectionIntroClassName,
} from '@/components/settings/settingsUi';

const NOTIFICATION_GROUPS: {
  label: string;
  description: string;
  types: { type: string; label: string }[];
}[] = [
  {
    label: 'Projects',
    description: 'Invitations, membership, and project activity',
    types: [
      { type: 'invitation', label: 'Invitations' },
      { type: 'join_request', label: 'Join requests' },
      { type: 'member_left', label: 'Member left' },
      { type: 'ownership_transferred', label: 'Ownership transfers' },
      { type: 'project_stage_updated', label: 'Research stage updates' },
      { type: 'project_updated', label: 'Project content and member removals' },
    ],
  },
  {
    label: 'Reviews',
    description: 'Paper reviews and version commits',
    types: [
      { type: 'review_requested', label: 'Review requests' },
      { type: 'review_completed', label: 'Review completed' },
      { type: 'paper_version_committed', label: 'Paper version commits' },
    ],
  },
  {
    label: 'Defenses & events',
    description: 'Schedules, defenses, and institution events',
    types: [
      { type: 'schedule', label: 'Schedule changes' },
      { type: 'defense_approved', label: 'Defense approved' },
      { type: 'defense_rejected', label: 'Defense rejected' },
      { type: 'defense_moved', label: 'Defense rescheduled' },
      { type: 'event', label: 'Institution events' },
    ],
  },
];

export default function NotificationPrefsSection() {
  const { draft, isLoading, setNotificationPreference } = useSettingsPreferences();

  const prefMap = useMemo(
    () => new Map(draft.notifications.map((p) => [p.type, p.enabled])),
    [draft.notifications],
  );

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-10">
          <div className={settingsLoadingSpinnerClassName} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className={settingsSectionIntroClassName}>
        Choose which in-app alerts you receive. These settings do not affect email delivery. Save
        changes to apply.
      </p>
      {NOTIFICATION_GROUPS.map((group) => (
        <Card key={group.label}>
          <CardTitle className="mb-1 text-primary-700">{group.label}</CardTitle>
          <p className={`mb-4 ${settingsSectionIntroClassName}`}>{group.description}</p>
          <ul className={settingsDividerClassName}>
            {group.types.map((item) => {
              const enabled = prefMap.get(item.type) ?? true;
              return (
                <SettingsToggleRow
                  key={item.type}
                  label={item.label}
                  checked={enabled}
                  onCheckedChange={(checked) => setNotificationPreference(item.type, checked)}
                />
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
