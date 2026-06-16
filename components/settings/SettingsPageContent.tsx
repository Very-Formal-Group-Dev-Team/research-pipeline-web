'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiUser,
  FiLock,
  FiBell,
  FiSun,
  FiCalendar,
} from 'react-icons/fi';
import type { DashboardRole } from '@/lib/auth/roleAccess';
import { getRoleProfilePath } from '@/lib/auth/roleAccess';
import type { UserProfileView } from '@/lib/hooks/useUserProfile';
import AccountSection from '@/components/settings/AccountSection';
import SecuritySection from '@/components/settings/SecuritySection';
import NotificationPrefsSection from '@/components/settings/NotificationPrefsSection';
import AppearanceSection from '@/components/settings/AppearanceSection';
import CalendarPrefsSection from '@/components/settings/CalendarPrefsSection';
import SettingsHeaderActions, { SettingsSaveStatus } from '@/components/settings/SettingsHeaderActions';
import { SettingsPreferencesProvider } from '@/components/settings/SettingsPreferencesContext';
import Card from '@/components/ui/Card';
import {
  settingsInlineLinkClassName,
  settingsLoadingSpinnerClassName,
  settingsPageSubtitleClassName,
  settingsPageTitleClassName,
  settingsTabClassName,
} from '@/components/settings/settingsUi';

const SECTIONS = [
  { id: 'account', label: 'Account', icon: FiUser },
  { id: 'security', label: 'Security', icon: FiLock },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'appearance', label: 'Appearance', icon: FiSun },
  { id: 'calendar', label: 'Calendar & time', icon: FiCalendar },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export interface SettingsPageContentProps {
  profile: UserProfileView;
  role: DashboardRole;
  isLoading: boolean;
  error?: string | null;
  onLogout?: () => void;
}

function SettingsPageBody({
  profile,
  role,
  activeSection,
  onLogout,
}: {
  profile: UserProfileView;
  role: DashboardRole;
  activeSection: SectionId;
  onLogout?: () => void;
}) {
  return (
    <div className="min-w-0">
      {activeSection === 'account' && <AccountSection profile={profile} role={role} />}
      {activeSection === 'security' && (
        <SecuritySection profile={profile} onLogout={onLogout} />
      )}
      {activeSection === 'notifications' && <NotificationPrefsSection />}
      {activeSection === 'appearance' && <AppearanceSection />}
      {activeSection === 'calendar' && <CalendarPrefsSection />}
    </div>
  );
}

export default function SettingsPageContent({
  profile,
  role,
  isLoading,
  error,
  onLogout,
}: SettingsPageContentProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const profilePath = getRoleProfilePath(role);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className={settingsLoadingSpinnerClassName} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-error-500">
        <h1 className="text-xl font-semibold text-primary-700">Could not load settings</h1>
        <p className="mt-2 text-sm text-neutral-600">{error}</p>
      </Card>
    );
  }

  return (
    <SettingsPreferencesProvider>
      <div className="space-y-6">
        <div>
          <h1 className={settingsPageTitleClassName}>Settings</h1>
          <p className={settingsPageSubtitleClassName}>
            Manage your account, security, notifications, and display preferences.{' '}
            <Link href={profilePath} className={settingsInlineLinkClassName}>
              Edit profile
            </Link>
          </p>
          <SettingsSaveStatus activeSection={activeSection} />
        </div>

        <div className="flex flex-col gap-3 overflow-hidden border-b border-neutral-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`${settingsTabClassName(active)} flex items-center gap-2`}
                >
                  <Icon className={active ? 'text-coordinator-rose' : 'text-neutral-400'} />
                  {section.label}
                </button>
              );
            })}
          </div>
          <SettingsHeaderActions activeSection={activeSection} />
        </div>

        <SettingsPageBody
          profile={profile}
          role={role}
          activeSection={activeSection}
          onLogout={onLogout}
        />
      </div>
    </SettingsPreferencesProvider>
  );
}
