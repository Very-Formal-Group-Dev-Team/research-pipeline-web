'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';

import { defenseRecordingTranscriptionUrl } from '@/lib/meetings/navigation';

/** Legacy URL — redirect to the recordings detail page. */
export default function LegacyRecordingTranscriptionRedirectPage() {
  const router = useRouter();
  const params = useParams<{ id: string; recordingId: string }>();

  useEffect(() => {
    const scheduleId = typeof params?.id === 'string' ? params.id : '';
    const recordingId = typeof params?.recordingId === 'string' ? params.recordingId : '';
    if (scheduleId && recordingId) {
      router.replace(defenseRecordingTranscriptionUrl(scheduleId, recordingId));
    }
  }, [params?.id, params?.recordingId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <FiLoader className="animate-spin text-neutral-400" aria-hidden />
    </div>
  );
}
