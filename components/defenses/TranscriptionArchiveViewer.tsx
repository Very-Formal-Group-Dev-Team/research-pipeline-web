'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiLoader, FiTrash2 } from 'react-icons/fi';

import TranscriptionEditorPanel from '@/components/defenses/TranscriptionEditorPanel';
import {
  deleteMeetingRecording,
  getRecordingDetail,
  recordingMediaUrl,
  type RecordingDetailResponse,
  type TranscriptionArchiveSegment,
} from '@/lib/api/recordings';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

type TranscriptTab = 'original' | 'editor';

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [detail, setDetail] = useState<RecordingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [transcriptTab, setTranscriptTab] = useState<TranscriptTab>('original');

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

  const seekToMs = useCallback((startMs: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startMs / 1000;
    void video.play().catch(() => {});
  }, []);

  const seekToSegment = (segment: TranscriptionArchiveSegment) => {
    if (segment.start_ms == null) return;
    seekToMs(segment.start_ms);
    setActiveSegmentId(segment.id);
  };

  const syncAudioToVideo = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;
    if (Math.abs(audio.currentTime - video.currentTime) > 0.25) {
      audio.currentTime = video.currentTime;
    }
  }, []);

  const handleVideoPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    syncAudioToVideo();
    void audio.play().catch(() => {});
  };

  const handleVideoPause = () => {
    audioRef.current?.pause();
  };

  const handleVideoSeeked = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;
    audio.currentTime = video.currentTime;
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
  const audioUrl = detail.recording.audio_url ? recordingMediaUrl(detail.recording.audio_url) : '';
  const title = detail.recording.project_title || detail.recording.meeting_title || 'Meeting recording';
  const listHref = backHref || defenseTranscriptionArchiveUrl();
  const transcriptionStatus = detail.recording.transcription_status;
  const isProcessing = transcriptionStatus === 'pending' || transcriptionStatus === 'processing';

  const isEditorTab = transcriptTab === 'editor';
  const workspaceHeightClass = isEditorTab
    ? 'min-h-[calc(100dvh-22rem)]'
    : 'min-h-[calc(100dvh-24rem)]';

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

      <div className="flex flex-col gap-4 lg:gap-6">
        <div className="mx-auto w-full max-w-4xl shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-black">
          {videoUrl ? (
            <>
              {audioUrl ? (
                <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
              ) : null}
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="aspect-video w-full bg-black"
                preload="metadata"
                onPlay={audioUrl ? handleVideoPlay : undefined}
                onPause={audioUrl ? handleVideoPause : undefined}
                onSeeked={audioUrl ? handleVideoSeeked : undefined}
                onTimeUpdate={audioUrl ? syncAudioToVideo : undefined}
              />
              {audioUrl ? (
                <p className="bg-neutral-900 px-3 py-2 text-xs text-neutral-400">
                  Audio is synced from the gated voice track recorded separately from the screen capture.
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-neutral-400">
              Recording file unavailable
            </div>
          )}
        </div>

        <div
          className={`flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ${workspaceHeightClass} ${
            isEditorTab ? 'ring-1 ring-primary-100' : ''
          }`}
        >
          <div className="shrink-0 border-b border-neutral-200 px-4 py-3 lg:px-5 lg:py-4">
            <div className="mb-3 flex gap-1 rounded-lg bg-neutral-100 p-1">
              <button
                type="button"
                onClick={() => setTranscriptTab('original')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  transcriptTab === 'original'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setTranscriptTab('editor')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  transcriptTab === 'editor'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Editor workspace
              </button>
            </div>

            {transcriptTab === 'original' ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Transcript</h2>
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
            ) : (
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Transcript editor workspace</h2>
                <p className="text-sm text-neutral-500">
                  Select statements to assign names or merge. Save to persist speaker list changes.
                </p>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
          {transcriptTab === 'editor' ? (
            <TranscriptionEditorPanel
              className="h-full min-h-0"
              scheduleId={scheduleId}
              recordingId={recordingId}
              projectCode={detail.recording.project_code}
              initialSegments={detail.segments}
              initialFullText={detail.transcription?.full_text}
              isProcessing={isProcessing}
              canManage={Boolean(detail.recording.can_manage ?? detail.recording.can_delete)}
              onSeek={seekToMs}
            />
          ) : (
          <div className="h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-3">
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
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
