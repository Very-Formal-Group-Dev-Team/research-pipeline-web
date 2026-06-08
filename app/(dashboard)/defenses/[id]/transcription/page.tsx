'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';

import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

/** Legacy per-schedule URL — redirect to the global transcription archive. */
export default function DefenseTranscriptionRedirectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const scheduleId = typeof params?.id === 'string' ? params.id : '';
    if (scheduleId) {
      router.replace(defenseTranscriptionArchiveUrl());
    }
  }, [params?.id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <FiLoader className="animate-spin text-neutral-400" aria-hidden />
    </div>
  );
}
