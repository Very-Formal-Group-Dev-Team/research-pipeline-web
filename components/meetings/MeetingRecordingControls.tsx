'use client';

import React from 'react';
import { FiLoader, FiMic, FiSquare } from 'react-icons/fi';

import type { useMeetingRecording } from '@/lib/hooks/useMeetingRecording';

type RecordingState = ReturnType<typeof useMeetingRecording>;

interface MeetingRecordingControlsProps {
  recording: RecordingState;
}

export default function MeetingRecordingControls({ recording }: MeetingRecordingControlsProps) {
  const {
    status,
    isRecording,
    canRecord,
    speaking,
    gateStatus,
    gateMessage,
    promptStartRecording,
    stopRecording,
  } = recording;

  if (!canRecord) {
    return (
      <span className="hidden text-xs text-neutral-400 sm:inline">
        Join the meeting to record
      </span>
    );
  }

  if (status === 'uploading') {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-neutral-900/80 px-3 py-2 text-xs text-neutral-200">
        <FiLoader className="animate-spin" aria-hidden />
        Saving recording...
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden text-xs text-green-300 sm:inline">
          Recording saved. You can keep the meeting open and record again.
        </span>
        <button
          type="button"
          onClick={promptStartRecording}
          className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-neutral-900/80 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-800"
        >
          <FiMic aria-hidden />
          Record again
        </button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden text-xs text-neutral-300 sm:inline">
          {gateStatus === 'connected'
            ? speaking
              ? 'Voice gate: your mic active'
              : 'Voice gate: meeting audio only'
            : gateStatus === 'bypassed'
              ? gateMessage || 'Meeting audio + full microphone'
              : gateMessage || 'Voice gate unavailable'}
        </span>
        <button
          type="button"
          onClick={() => void stopRecording()}
          className="inline-flex items-center gap-2 rounded-md border border-red-400/40 bg-red-950/60 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-900/70"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden />
          <FiSquare aria-hidden />
          Stop recording
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={promptStartRecording}
      disabled={status === 'starting'}
      className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-neutral-900/80 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
    >
      {status === 'starting' ? <FiLoader className="animate-spin" aria-hidden /> : <FiMic aria-hidden />}
      Record meeting
    </button>
  );
}
