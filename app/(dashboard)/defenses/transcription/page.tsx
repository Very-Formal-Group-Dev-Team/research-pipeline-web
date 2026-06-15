'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';

import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

/** Legacy URL — redirect to the recordings archive. */
export default function LegacyTranscriptionArchiveRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(defenseTranscriptionArchiveUrl());
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <FiLoader className="animate-spin text-neutral-400" aria-hidden />
    </div>
  );
}
