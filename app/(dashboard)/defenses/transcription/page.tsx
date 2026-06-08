'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';

import TranscriptionRecordingList from '@/components/defenses/TranscriptionRecordingList';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getRoleHomePath, normalizeUserRole } from '@/lib/auth/roleAccess';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';

export default function TranscriptionArchivePage() {
  const router = useRouter();
  const { user, isLoading, handleLogout } = useDashboardUser();
  const role = normalizeUserRole(user?.role);
  const backHref = `${getRoleHomePath(user?.role)}/events?tab=meetings`;

  if (isLoading || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <FiLoader className="animate-spin text-neutral-400" aria-hidden />
      </div>
    );
  }

  return (
    <DashboardLayout role={role} user={user} onLogout={handleLogout}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <FiArrowLeft aria-hidden />
          Back to schedule
        </button>

        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900">Transcription archive</h1>
          <p className="text-sm text-neutral-600">
            Meetings you participated in appear here with all available recordings. Open any recording to watch the
            video and read the synced transcript. Only the person who recorded a meeting can delete it.
          </p>
        </div>

        <TranscriptionRecordingList />
      </div>
    </DashboardLayout>
  );
}
