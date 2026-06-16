'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfilePageContent from '@/components/profile/ProfilePageContent';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import type { DashboardRole } from '@/lib/auth/roleAccess';

const STATUS_PLACEHOLDERS: Record<DashboardRole, string> = {
  student: 'e.g. Working on thesis',
  adviser: 'e.g. Available for consult',
  coordinator: 'e.g. Available for coordination',
  admin: 'e.g. Platform administrator',
};

const FALLBACK_ROLES: Record<DashboardRole, string> = {
  student: 'Student',
  adviser: 'Adviser',
  coordinator: 'Coordinator',
  admin: 'Admin',
};

export default function ProfileDashboardPage({ role }: { role: DashboardRole }) {
  const { user, handleLogout } = useDashboardUser(FALLBACK_ROLES[role]);
  const { user: profile, isLoading, error, refetch } = useUserProfile();

  const editUser = profile
    ? {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatarUrl: profile.avatar,
        statusText: profile.statusText,
      }
    : { name: '', email: '', role: FALLBACK_ROLES[role], avatarUrl: undefined, statusText: undefined };

  return (
    <DashboardLayout role={role} user={user} onLogout={handleLogout}>
      <ProfilePageContent
        user={editUser}
        isLoading={isLoading}
        error={error}
        role={role}
        onProfileSaved={() => refetch()}
        statusPlaceholder={STATUS_PLACEHOLDERS[role]}
      />
    </DashboardLayout>
  );
}
