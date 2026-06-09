'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';

import TranscriptionArchiveViewer from '@/components/defenses/TranscriptionArchiveViewer';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { normalizeUserRole } from '@/lib/auth/roleAccess';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

export default function RecordingTranscriptionPage() {
  const params = useParams<{ id: string; recordingId: string }>();
  const { user, isLoading, handleLogout } = useDashboardUser();
  const scheduleId = typeof params?.id === 'string' ? params.id : '';
  const recordingId = typeof params?.recordingId === 'string' ? params.recordingId : '';
  const role = normalizeUserRole(user?.role);

  if (isLoading || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <FiLoader className="animate-spin text-neutral-400" aria-hidden />
      </div>
    );
  }

  return (
    <DashboardLayout role={role} user={user} onLogout={handleLogout}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {scheduleId && recordingId ? (
          <TranscriptionArchiveViewer
            scheduleId={scheduleId}
            recordingId={recordingId}
            backHref={defenseTranscriptionArchiveUrl()}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">Recording not found.</p>
            <Link
              href={defenseTranscriptionArchiveUrl()}
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              <FiArrowLeft aria-hidden />
              Back to recordings
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
