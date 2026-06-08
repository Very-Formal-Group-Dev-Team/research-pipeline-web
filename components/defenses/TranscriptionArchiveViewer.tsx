'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiLoader, FiTrash2 } from 'react-icons/fi';

import {
  deleteMeetingRecording,
  getRecordingDetail,
  recordingMediaUrl,
  type RecordingDetailResponse,
  type TranscriptionArchiveSegment,
} from '@/lib/api/recordings';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

interface TranscriptionArchiveViewerProps {
  scheduleId: string;
  recordingId: string;
  backHref?: string;
}

function formatMs(ms?: number | null): string {
  if (ms == null || Number.isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function TranscriptionArchiveViewer({
  scheduleId,
  recordingId,
  backHref,
}: TranscriptionArchiveViewerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detail, setDetail] = useState<RecordingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getRecordingDetail(scheduleId, recordingId);
    if (res.error || !res.data) {
      setError(res.error || 'Failed to load recording');
      setDetail(null);
    } else {
      setDetail(res.data);
    }
    setLoading(false);
  }, [recordingId, scheduleId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!detail) return undefined;
    const status = detail.recording.transcription_status;
    if (status !== 'pending' && status !== 'processing') return undefined;

    const timer = window.setInterval(() => {
      void loadDetail();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [detail, loadDetail]);

  const seekToSegment = (segment: TranscriptionArchiveSegment) => {
    const video = videoRef.current;
    if (!video || segment.start_ms == null) return;
    video.currentTime = segment.start_ms / 1000;
    void video.play().catch(() => {});
    setActiveSegmentId(segment.id);
  };

  const handleDownloadTranscript = () => {
    if (!detail?.transcription?.full_text) return;
    const code = detail.recording.project_code || scheduleId;
    const blob = new Blob([detail.transcription.full_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${code}-transcription.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!detail?.recording.can_delete) return;
    const confirmed = window.confirm('Delete this recording and its transcript? This cannot be undone.');
    if (!confirmed) return;

    setDeleting(true);
    const res = await deleteMeetingRecording(scheduleId, recordingId);
    setDeleting(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    router.push(backHref || defenseTranscriptionArchiveUrl());
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-neutral-500">
        <FiLoader className="animate-spin" aria-hidden />
        Loading recording...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Recording not found'}
      </div>
    );
  }

  const videoUrl = recordingMediaUrl(detail.recording.file_url || '');
  const title = detail.recording.project_title || detail.recording.meeting_title || 'Meeting recording';
  const listHref = backHref || defenseTranscriptionArchiveUrl();
  const transcriptionStatus = detail.recording.transcription_status;
  const isProcessing = transcriptionStatus === 'pending' || transcriptionStatus === 'processing';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={listHref}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <FiArrowLeft aria-hidden />
          Back to recordings
        </Link>

        {detail.recording.can_delete ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? <FiLoader className="animate-spin" aria-hidden /> : <FiTrash2 aria-hidden />}
            Delete recording
          </button>
        ) : (
          <span className="text-xs text-neutral-500">View only</span>
        )}
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">
          {detail.recording.project_code}
          {detail.recording.recorded_at ? ` · Recorded ${formatDate(detail.recording.recorded_at)}` : ''}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="aspect-video w-full bg-black"
              preload="metadata"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-neutral-400">
              Recording file unavailable
            </div>
          )}
        </div>

        <div className="flex min-h-[24rem] flex-col rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Transcript</h2>
              <p className="text-xs text-neutral-500">
                {isProcessing
                  ? 'Transcription is processing in the background.'
                  : detail.segments.length
                    ? 'Click any line to jump to that moment in the video.'
                    : 'No transcript for this recording yet.'}
              </p>
            </div>
            {detail.transcription ? (
              <button
                type="button"
                onClick={handleDownloadTranscript}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                <FiDownload aria-hidden />
                Download
              </button>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isProcessing ? (
              <div className="flex items-center gap-2 py-8 text-sm text-neutral-500">
                <FiLoader className="animate-spin" aria-hidden />
                Transcribing gated voice audio...
              </div>
            ) : detail.segments.length ? (
              <div className="space-y-2">
                {detail.segments.map((segment) => (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => seekToSegment(segment)}
                    className={`w-full rounded-md border px-3 py-2 text-left transition ${
                      activeSegmentId === segment.id
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-200 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium text-primary-700">{formatMs(segment.start_ms)}</p>
                    <p className="text-sm leading-relaxed text-neutral-800">{segment.text}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-500">
                {transcriptionStatus === 'failed'
                  ? detail.recording.transcription_error || 'Transcription failed for this recording.'
                  : 'This recording has no transcript.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
