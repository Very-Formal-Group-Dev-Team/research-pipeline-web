'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SettingsPageContent from '@/components/settings/SettingsPageContent';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import type { DashboardRole } from '@/lib/auth/roleAccess';

const FALLBACK_ROLES: Record<DashboardRole, string> = {
  student: 'Student',
  adviser: 'Adviser',
  coordinator: 'Coordinator',
  admin: 'Admin',
};

export default function SettingsDashboardPage({ role }: { role: DashboardRole }) {
  const { user, handleLogout } = useDashboardUser(FALLBACK_ROLES[role]);
  const { user: profile, isLoading, error } = useUserProfile();

  const settingsProfile = profile || {
    id: '',
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };

  return (
    <DashboardLayout role={role} user={user} onLogout={handleLogout}>
      <SettingsPageContent
        profile={settingsProfile}
        role={role}
        isLoading={isLoading}
        error={error}
        onLogout={handleLogout}
      />
    </DashboardLayout>
  );
}
