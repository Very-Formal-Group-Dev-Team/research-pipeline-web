'use client';

import React from 'react';
import { Card } from '@/components/ui';
import EditProfileForm, { type EditProfileUser } from '@/components/profile/EditProfileForm';

export interface ProfilePageContentProps {
  user: EditProfileUser;
  isLoading: boolean;
  onProfileSaved: () => void;
  statusPlaceholder?: string;
}

export default function ProfilePageContent({
  user,
  isLoading,
  onProfileSaved,
  statusPlaceholder,
}: ProfilePageContentProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-700">Profile</h1>
        <p className="mt-1 text-neutral-600">Manage your account information</p>
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
