'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfilePageContent from '@/components/profile/ProfilePageContent';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function CoordinatorProfilePage() {
  const router = useRouter();
  const { user: profile, isLoading, refetch } = useUserProfile();

  const user = profile
    ? {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatarUrl: profile.avatar,
        statusText: profile.statusText,
      }
    : { name: '', email: '', role: 'Coordinator', avatarUrl: undefined, statusText: undefined };

  const handleLogout = () => {
    document.cookie = 'session_token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <DashboardLayout
      role="coordinator"
      user={{ ...user, avatar: user.avatarUrl }}
      onLogout={handleLogout}
    >
      <ProfilePageContent
        user={user}
        isLoading={isLoading}
        onProfileSaved={() => refetch()}
        statusPlaceholder="e.g. Available for coordination"
      />
    </DashboardLayout>
  );
}
