'use client';

import React from 'react';

import TranscriptionRecordingList from '@/components/defenses/TranscriptionRecordingList';
import TranscriptionRecordingListSkeleton from '@/components/skeletons/TranscriptionRecordingListSkeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { normalizeUserRole } from '@/lib/auth/roleAccess';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';

export default function RecordingsArchivePage() {
  const { user, isLoading, handleLogout } = useDashboardUser();
  const role = normalizeUserRole(user?.role);

  return (
    <DashboardLayout role={role || 'student'} user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Recordings</h1>
          <p className="mt-1 text-neutral-600">
            Meetings you participated in appear here with all available recordings. Open any recording to watch the
            video and read the synced transcript. Only the person who recorded a meeting can delete it.
          </p>
        </div>

        {isLoading || !role ? (
          <TranscriptionRecordingListSkeleton />
        ) : (
          <TranscriptionRecordingList />
        )}
      </div>
    </DashboardLayout>
  );
}
