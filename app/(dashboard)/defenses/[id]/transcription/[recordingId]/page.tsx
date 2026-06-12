'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

import Button from '@/components/Button';
import TranscriptionArchiveViewer from '@/components/defenses/TranscriptionArchiveViewer';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { normalizeUserRole } from '@/lib/auth/roleAccess';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

export default function RecordingTranscriptionPage() {
  const router = useRouter();
  const params = useParams<{ id: string; recordingId: string }>();
  const { user, isLoading, handleLogout } = useDashboardUser();
  const scheduleId = typeof params?.id === 'string' ? params.id : '';
  const recordingId = typeof params?.recordingId === 'string' ? params.recordingId : '';
  const role = normalizeUserRole(user?.role);
  const archiveHref = defenseTranscriptionArchiveUrl();

  return (
    <DashboardLayout role={role || 'student'} user={user} onLogout={handleLogout}>
      {isLoading || !role ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
        </div>
      ) : scheduleId && recordingId ? (
        <TranscriptionArchiveViewer
          scheduleId={scheduleId}
          recordingId={recordingId}
          backHref={archiveHref}
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <p className="text-sm text-neutral-600">Recording not found.</p>
          </Card>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary-700 hover:bg-primary-50"
            leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
            onClick={() => router.push(archiveHref)}
          >
            Back to recordings
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
