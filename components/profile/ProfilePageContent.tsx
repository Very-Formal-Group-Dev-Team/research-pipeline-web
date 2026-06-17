'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import EditProfileForm, { type EditProfileUser } from '@/components/profile/EditProfileForm';
import ProfileFormSkeleton from '@/components/skeletons/ProfileFormSkeleton';
import { getRoleSettingsPath } from '@/lib/auth/roleAccess';
import type { DashboardRole } from '@/lib/auth/roleAccess';

export interface ProfilePageContentProps {
  user: EditProfileUser;
  isLoading: boolean;
  error?: string | null;
  role: DashboardRole;
  onProfileSaved: () => void;
  statusPlaceholder?: string;
}

export default function ProfilePageContent({
  user,
  isLoading,
  error,
  role,
  onProfileSaved,
  statusPlaceholder,
}: ProfilePageContentProps) {
  const settingsPath = getRoleSettingsPath(role);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Profile</h1>
          <p className="mt-1 text-neutral-600">
            Manage your account information.{' '}
            <Link href={settingsPath} className="font-medium text-primary-600 hover:text-primary-700">
              Account settings
            </Link>
          </p>
        </div>

        <Card>
          <ProfileFormSkeleton />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-error-500">
        <h1 className="text-xl font-semibold text-primary-700">Could not load profile</h1>
        <p className="mt-2 text-sm text-neutral-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-700">Profile</h1>
        <p className="mt-1 text-neutral-600">
          Manage your account information.{' '}
          <Link href={settingsPath} className="font-medium text-primary-600 hover:text-primary-700">
            Account settings
          </Link>
        </p>
      </div>

      <Card>
        <EditProfileForm
          user={user}
          onSaved={onProfileSaved}
          statusPlaceholder={statusPlaceholder}
        />
      </Card>
    </div>
  );
}
