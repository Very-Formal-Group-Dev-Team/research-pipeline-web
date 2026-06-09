'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

import TranscriptionRecordingList from '@/components/defenses/TranscriptionRecordingList';
import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getRoleHomePath, normalizeUserRole } from '@/lib/auth/roleAccess';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';

export default function TranscriptionArchivePage() {
  const router = useRouter();
  const { user, isLoading, handleLogout } = useDashboardUser();
  const role = normalizeUserRole(user?.role);
  const backHref = `${getRoleHomePath(user?.role)}/events?tab=meetings`;

  return (
    <DashboardLayout role={role || 'student'} user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Transcription Archive</h1>
            <p className="mt-1 text-neutral-600">
              Meetings you participated in appear here with all available recordings. Open any recording to watch the
              video and read the synced transcript. Only the person who recorded a meeting can delete it.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 self-center text-sm text-primary-700 hover:bg-primary-50 sm:text-md"
            leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
            onClick={() => router.push(backHref)}
            disabled={isLoading || !role}
          >
            Back to Schedule
          </Button>
        </div>

        {isLoading || !role ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
          </div>
        ) : (
          <TranscriptionRecordingList />
        )}
      </div>
    </DashboardLayout>
  );
}
