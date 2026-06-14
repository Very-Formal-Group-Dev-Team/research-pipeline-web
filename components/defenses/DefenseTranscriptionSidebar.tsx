'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiDownload, FiFileText, FiLoader, FiRefreshCw } from 'react-icons/fi';

import {
  downloadMeetingTranscription,
  getMeetingTranscription,
  type MeetingTranscription,
} from '@/lib/api/transcriptions';
import type { useAutoTranscription } from '@/lib/hooks/useAutoTranscription';

type SidebarVariant = 'meeting' | 'dashboard';
type CaptureState = ReturnType<typeof useAutoTranscription>;

interface DefenseTranscriptionSidebarProps {
  scheduleId: string;
  variant?: SidebarVariant;
  defaultExpanded?: boolean;
  pollIntervalMs?: number;
  onClose?: () => void;
  capture?: CaptureState;
}

function captureStatusLabel(capture?: CaptureState): string {
  if (!capture?.listening && capture?.status === 'needs_serial') {
    return 'Arduino not connected';
  }
  if (capture?.status === 'bypassed') return 'Live transcription (no voice gate)';
  if (capture?.starting || capture?.status === 'starting') return 'Starting voice listening...';
  if (!capture?.listening) return 'Voice listening off';
  if (capture.mode === 'agent') return 'Voice listening (room agent)';
  if (capture.status === 'recording') return 'Recording speech...';
  if (capture.status === 'uploading') return 'Transcribing chunk...';
  if (capture.speaking) return 'Gate open — listening';
  return 'Listening for speech';
}

function formatTimestamp(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

const variantStyles: Record<
  SidebarVariant,
  {
    shell: string;
    header: string;
    title: string;
    subtitle: string;
    collapseBtn: string;
    tab: string;
    tabActive: string;
    body: string;
    segmentMeta: string;
    segmentText: string;
    empty: string;
    error: string;
    actionBtn: string;
    actionBtnPrimary: string;
    collapsedBtn: string;
  }
> = {
  meeting: {
    shell: 'border-white/15 bg-neutral-900/90 text-white shadow-2xl backdrop-blur-md',
    header: 'border-white/10',
    title: 'text-white',
    subtitle: 'text-neutral-300',
    collapseBtn: 'text-neutral-300 hover:bg-white/10 hover:text-white',
    tab: 'text-neutral-400 hover:text-neutral-200',
    tabActive: 'border-white text-white',
    body: 'text-neutral-200',
    segmentMeta: 'text-neutral-400',
    segmentText: 'text-neutral-100',
    empty: 'text-neutral-400',
    error: 'border-red-400/30 bg-red-950/40 text-red-200',
    actionBtn: 'border-white/20 text-white hover:bg-white/10',
    actionBtnPrimary: 'bg-primary-600 text-white hover:bg-primary-700',
    collapsedBtn:
      'border-white/20 bg-neutral-900/85 text-white shadow-lg backdrop-blur-sm hover:bg-neutral-900',
  },
  dashboard: {
    shell: 'border-neutral-200 bg-white text-neutral-900 shadow-xl',
    header: 'border-neutral-200',
    title: 'text-neutral-900',
    subtitle: 'text-neutral-500',
    collapseBtn: 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
    tab: 'text-neutral-500 hover:text-neutral-700',
    tabActive: 'border-primary-600 text-primary-700',
    body: 'text-neutral-700',
    segmentMeta: 'text-neutral-500',
    segmentText: 'text-neutral-800',
    empty: 'text-neutral-500',
    error: 'border-red-200 bg-red-50 text-red-700',
    actionBtn: 'border-neutral-200 text-neutral-700 hover:bg-neutral-50',
    actionBtnPrimary: 'bg-primary-600 text-white hover:bg-primary-700',
    collapsedBtn: 'border-neutral-200 bg-white text-neutral-800 shadow-md hover:bg-neutral-50',
  },
};

export default function DefenseTranscriptionSidebar({
  scheduleId,
  variant = 'dashboard',
  defaultExpanded = true,
  pollIntervalMs = 5000,
  onClose,
  capture,
}: DefenseTranscriptionSidebarProps) {
  const styles = variantStyles[variant];
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [transcription, setTranscription] = useState<MeetingTranscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loadTranscription = useCallback(
    async (silent = false) => {
      if (!scheduleId) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await getMeetingTranscription(scheduleId);
      if (res.error || !res.data) {
        setError(res.error || 'Failed to load transcription');
        setTranscription(null);
      } else {
        setTranscription(res.data);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [scheduleId],
  );

  useEffect(() => {
    if (!expanded) return undefined;
    loadTranscription();
  }, [expanded, loadTranscription]);

  useEffect(() => {
    if (!expanded || !scheduleId || pollIntervalMs <= 0) return undefined;
    const timer = window.setInterval(() => {
      loadTranscription(true);
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [expanded, loadTranscription, pollIntervalMs, scheduleId]);

  const handleCollapse = () => {
    setExpanded(false);
    onClose?.();
  };

  const handleDownload = async () => {
    setDownloading(true);
    const code = transcription?.project_code || scheduleId;
    const result = await downloadMeetingTranscription(scheduleId, `${code}-transcription.txt`);
    if (!result.ok) {
      setError(result.error || 'Download failed');
    }
    setDownloading(false);
  };

  const positionClass =
    variant === 'meeting'
      ? 'pointer-events-auto absolute left-4 top-20 z-20'
      : 'pointer-events-auto fixed right-0 top-20 z-30';

  if (!expanded) {
    return (
      <div className={positionClass}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${styles.collapsedBtn}`}
          aria-label="Open transcription sidebar"
        >
          <FiFileText aria-hidden />
          Transcription
          <FiChevronRight aria-hidden />
        </button>
      </div>
    );
  }

  const widthClass =
    variant === 'meeting'
      ? 'w-[min(24rem,calc(100vw-2rem))] max-h-[calc(100vh-6rem)]'
      : 'w-[min(28rem,calc(100vw-1rem))] h-[calc(100vh-5rem)]';

  return (
    <div className={`${positionClass} flex ${widthClass} flex-col overflow-hidden rounded-xl border ${styles.shell}`}>
      <div className={`flex items-center justify-between border-b px-4 py-3 ${styles.header}`}>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${styles.title}`}>Transcription</p>
          <p className={`truncate text-xs ${styles.subtitle}`}>
            {transcription?.project_code || scheduleId}
            {transcription?.segment_count != null ? ` · ${transcription.segment_count} segments` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCollapse}
          className={`rounded-md p-1.5 transition ${styles.collapseBtn}`}
          aria-label="Collapse transcription sidebar"
        >
          <FiChevronLeft aria-hidden />
        </button>
      </div>

      {capture ? (
        <div className={`border-b px-4 py-3 text-xs ${styles.header}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
                capture.speaking
                  ? variant === 'meeting'
                    ? 'bg-green-500/20 text-green-200'
                    : 'bg-green-100 text-green-800'
                  : variant === 'meeting'
                    ? 'bg-white/10 text-neutral-300'
                    : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {captureStatusLabel(capture)}
            </span>
            {capture.needsSerialPermission ? (
              <button
                type="button"
                onClick={() => capture.connectSerial()}
                className={`rounded-md border px-2 py-1 transition ${styles.actionBtn}`}
              >
                Connect Arduino
              </button>
            ) : null}
          </div>
          {capture.message ? <p className={`mt-2 ${styles.subtitle}`}>{capture.message}</p> : null}
        </div>
      ) : null}

      <div className={`flex flex-wrap gap-2 border-b px-4 py-3 ${styles.header}`}>
        <button
          type="button"
          onClick={() => loadTranscription(true)}
          disabled={refreshing || loading}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition disabled:opacity-60 ${styles.actionBtn}`}
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} aria-hidden />
          Refresh
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !transcription?.segment_count}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-60 ${styles.actionBtnPrimary}`}
        >
          {downloading ? <FiLoader className="animate-spin" aria-hidden /> : <FiDownload aria-hidden />}
          Download
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto px-4 py-3 ${styles.body}`}>
        {loading ? (
          <div className={`flex items-center gap-2 py-8 text-sm ${styles.empty}`}>
            <FiLoader className="animate-spin" aria-hidden />
            Loading transcription...
          </div>
        ) : null}

        {error ? (
          <div className={`mb-3 rounded-md border px-3 py-2 text-sm ${styles.error}`}>{error}</div>
        ) : null}

        {!loading && transcription?.segments?.length ? (
          <div className="space-y-4">
            {transcription.segments.map((segment) => (
              <div
                key={segment.id}
                className={`border-b pb-3 last:border-b-0 last:pb-0 ${
                  variant === 'meeting' ? 'border-white/10' : 'border-neutral-200'
                }`}
              >
                <p className={`mb-1 text-xs ${styles.segmentMeta}`}>{formatTimestamp(segment.created_at)}</p>
                <p className={`whitespace-pre-wrap text-sm leading-relaxed ${styles.segmentText}`}>{segment.text}</p>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !transcription?.segments?.length ? (
          <div className={`space-y-2 py-6 text-center text-sm ${styles.empty}`}>
            <p>No transcription yet.</p>
            <p className="text-xs">
              {capture?.listening
                ? 'Transcription appears when the Arduino gate reports speaking.'
                : 'Enable voice listening while recording to capture live transcription from the room mic.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
