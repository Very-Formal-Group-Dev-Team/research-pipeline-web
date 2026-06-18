'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiLoader, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

import Button from '@/components/Button';
import DefenseMeetingGradesPanel from '@/components/defenses/DefenseMeetingGradesPanel';
import RecordingControlPanel from '@/components/defenses/RecordingControlPanel';
import TranscriptionEditorPanel from '@/components/defenses/TranscriptionEditorPanel';
import Card, {
  CARD_HEADER_SECTION_CLASS,
  CARD_INSET_X_CLASS,
  CardDescription,
  CardTitle,
} from '@/components/ui/Card';
import {
  getRecordingDetail,
  recordingMediaUrl,
  type RecordingDetailResponse,
  type TranscriptionArchiveSegment,
} from '@/lib/api/recordings';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';
import { recordingDisplayTitle } from '@/lib/recordings/display';

type TranscriptTab = 'original' | 'editor' | 'grades';

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
  const [transcriptTab, setTranscriptTab] = useState<TranscriptTab>('original');
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [recordingSoftDeleted, setRecordingSoftDeleted] = useState(false);

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
    setTranscriptExpanded(false);
  }, [recordingId]);

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

  const handleRecordingRenamed = (displayName: string) => {
    setDetail((current) => {
      if (!current) return current;
      return {
        ...current,
        recording: {
          ...current.recording,
          display_name: displayName,
        },
      };
    });
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
      <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
        {error || 'Recording not found'}
      </div>
    );
  }

  const videoUrl = recordingMediaUrl(detail.recording.file_url || '');
  const audioUrl = detail.recording.audio_url ? recordingMediaUrl(detail.recording.audio_url) : '';
  const title = recordingDisplayTitle(detail.recording);
  const listHref = backHref || defenseTranscriptionArchiveUrl();
  const transcriptionStatus = detail.recording.transcription_status;
  const isProcessing = transcriptionStatus === 'pending' || transcriptionStatus === 'processing';
  const hasTranscript = detail.segments.length > 0;

  const isDefenseRecording = detail.recording.schedule_source === 'defense';
  const isEditorTab = transcriptTab === 'editor';
  const isGradesTab = transcriptTab === 'grades';
  const collapsedTranscriptCardClass = isEditorTab || isGradesTab
    ? 'h-[calc(100dvh-22rem)] max-h-[calc(100dvh-22rem)]'
    : 'h-[calc(100dvh-24rem)] max-h-[calc(100dvh-24rem)]';

  return (
    <div className="space-y-6">
      {recordingSoftDeleted ? (
        <div className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          This recording was removed from your archive. Use Revert in the toast below to restore it.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold leading-tight text-primary-700 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {detail.recording.project_code}
            {detail.recording.recorded_at ? ` · Recorded ${formatDate(detail.recording.recorded_at)}` : ''}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 self-start text-primary-700 hover:bg-primary-50 sm:self-center"
          leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
          onClick={() => router.push(listHref)}
        >
          Back to recordings
        </Button>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card
          padding="none"
          hoverShadow={false}
          className="flex h-full min-h-0 flex-col overflow-hidden !border-neutral-400 !bg-black"
        >
          {videoUrl ? (
            <>
              {audioUrl ? (
                <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
              ) : null}
              <div className="flex min-h-0 flex-1 items-center justify-center">
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
              </div>
              {audioUrl ? (
                <p className="shrink-0 bg-neutral-900 px-4 py-2 text-xs text-neutral-400 sm:px-6">
                  Audio is synced from the gated voice track recorded separately from the screen capture.
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-[12rem] flex-1 items-center justify-center text-sm text-neutral-400">
              Recording file unavailable
            </div>
          )}
        </Card>

        <RecordingControlPanel
          scheduleId={scheduleId}
          recordingId={recordingId}
          recording={detail.recording}
          videoUrl={videoUrl}
          onRenamed={handleRecordingRenamed}
          onSoftDeleted={() => setRecordingSoftDeleted(true)}
          onRestored={() => {
            setRecordingSoftDeleted(false);
            void loadDetail();
          }}
          onPermanentlyDeleted={() => router.push(listHref)}
        />
      </div>

      <Card
        padding="none"
        hoverShadow={false}
        className={`flex min-h-0 flex-col ${
          transcriptExpanded ? '' : `${collapsedTranscriptCardClass} overflow-hidden`
        }`}
      >
        <div className={`shrink-0 ${CARD_HEADER_SECTION_CLASS}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 pb-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTranscriptTab('original')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  transcriptTab === 'original'
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setTranscriptTab('editor')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  transcriptTab === 'editor'
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Editor workspace
              </button>
              {isDefenseRecording ? (
                <button
                  type="button"
                  onClick={() => setTranscriptTab('grades')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    transcriptTab === 'grades'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Grades
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 !px-2"
              disabled={!hasTranscript || isGradesTab}
              onClick={() => setTranscriptExpanded((prev) => !prev)}
              aria-pressed={transcriptExpanded}
              aria-label={transcriptExpanded ? 'Collapse transcript' : 'Expand transcript'}
            >
              {transcriptExpanded ? (
                <FiMinimize2 className="h-4 w-4" aria-hidden />
              ) : (
                <FiMaximize2 className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>

          {transcriptTab === 'original' ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Transcript</CardTitle>
                <CardDescription lines={2} className="!mt-1">
                  {isProcessing
                    ? 'Transcription is processing in the background.'
                    : detail.segments.length
                      ? 'Click any line to jump to that moment in the video.'
                      : 'No transcript for this recording yet.'}
                </CardDescription>
              </div>
              {detail.transcription ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<FiDownload aria-hidden />}
                  onClick={handleDownloadTranscript}
                  className="shrink-0"
                >
                  Download
                </Button>
              ) : null}
            </div>
          ) : isGradesTab ? (
            <div>
              <CardTitle>Defense grades</CardTitle>
              <CardDescription lines={2} className="!mt-1">
                Rubric scores, panel notes, and overall grades for every project in this defense meeting.
              </CardDescription>
            </div>
          ) : (
            <div>
              <CardTitle>Transcript editor workspace</CardTitle>
              <CardDescription lines={2} className="!mt-1">
                Select statements to assign names or merge. Save to persist speaker list changes.
              </CardDescription>
            </div>
          )}
        </div>

        <div
          className={
            transcriptExpanded
              ? ''
              : 'flex min-h-0 flex-1 flex-col overflow-hidden'
          }
        >
          {transcriptTab === 'editor' ? (
            <TranscriptionEditorPanel
              className={transcriptExpanded ? '' : 'min-h-0 flex-1'}
              expanded={transcriptExpanded}
              scheduleId={scheduleId}
              recordingId={recordingId}
              projectCode={detail.recording.project_code}
              initialSegments={detail.segments}
              initialFullText={detail.transcription?.full_text}
              isProcessing={isProcessing}
              canManage={Boolean(detail.recording.can_manage ?? detail.recording.can_delete)}
              onSeek={seekToMs}
            />
          ) : isGradesTab ? (
            <DefenseMeetingGradesPanel
              scheduleId={scheduleId}
              expanded={transcriptExpanded}
              className={transcriptExpanded ? CARD_INSET_X_CLASS : CARD_INSET_X_CLASS}
            />
          ) : (
            <div
              className={
                transcriptExpanded
                  ? `py-3 ${CARD_INSET_X_CLASS}`
                  : `min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 ${CARD_INSET_X_CLASS}`
              }
            >
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
                      className={`w-full rounded-md border border-solid px-3 py-2 text-left transition-all ${
                        activeSegmentId === segment.id
                          ? 'border-primary-400 bg-primary-50 shadow-sm'
                          : 'border-neutral-400 bg-white hover:border-neutral-400 hover:shadow-sm'
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
      </Card>
    </div>
  );
}
