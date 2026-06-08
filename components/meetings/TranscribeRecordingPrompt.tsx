'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';

import Button from '@/components/Button';
import type { useMeetingRecording } from '@/lib/hooks/useMeetingRecording';

type RecordingState = ReturnType<typeof useMeetingRecording>;

interface TranscribeRecordingPromptProps {
  recording: RecordingState;
  onViewArchive?: () => void;
}

export default function TranscribeRecordingPrompt({
  recording,
  onViewArchive,
}: TranscribeRecordingPromptProps) {
  const { pending, transcribing, error, requestTranscription, dismissPending } = recording;

  if (!pending) return null;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-6 z-30 mx-auto flex w-[min(32rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-white/15 bg-neutral-900/95 p-4 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Recording saved</p>
          <p className="mt-1 text-xs text-neutral-300">
            Would you like to transcribe this recording? You can skip and still watch it later.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissPending}
          className="rounded-md p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <FiX aria-hidden />
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-400/30 bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          loading={transcribing}
          disabled={transcribing}
          onClick={() => void requestTranscription(pending.recordingId)}
        >
          Transcribe recording
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={transcribing} onClick={dismissPending}>
          Skip for now
        </Button>
        {onViewArchive ? (
          <Button type="button" size="sm" variant="ghost" onClick={onViewArchive}>
            View in Transcription tab
          </Button>
        ) : null}
      </div>
    </div>
  );
}
