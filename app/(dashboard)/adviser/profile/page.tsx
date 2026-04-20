'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, Avatar, Modal, CopyableEmail } from '@/components/ui';
import Button from '@/components/Button';
import EditProfile from './editProfile';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function AdviserProfilePage() {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { user: profile, isLoading, refetch } = useUserProfile();

  const user = profile
    ? { name: profile.name, email: profile.email, role: profile.role, avatarUrl: profile.avatar, statusText: profile.statusText }
    : { name: '', email: '', role: 'Adviser', avatarUrl: undefined, statusText: undefined };

  const handleLogout = () => {
    document.cookie = 'session_token=; path=/; max-age=0';
    router.push('/login');
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout role="adviser" user={{ ...user, avatar: user.avatarUrl }} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="adviser" user={{ ...user, avatar: user.avatarUrl }} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Profile</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-neutral-600">Manage your account information</p>
          </div>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-primary-700">{user.name}</h2>
              <div className="mt-1 overflow-hidden text-ellipsis">
                <CopyableEmail email={user.email}/>
              </div>
              <p className="text-sm text-neutral-500 mt-1">{user.role}</p>
              {user.statusText && (
                <p className="text-sm text-neutral-500 mt-1 italic">{user.statusText}</p>
              )}
            </div>
          </div>
          <div className="mt-6">
            <Button size="sm" variant="error" onClick={() => setIsEditOpen(true)}>
              Edit Profile
            </Button>
          </div>
        </Card>
      </div>

      <Modal isOpen={isEditOpen} onClose={handleEditClose} title="Edit Profile" size="md">
        <EditProfile
          user={user}
          onClose={handleEditClose}
        />
      </Modal>
    </DashboardLayout>
  );
}
