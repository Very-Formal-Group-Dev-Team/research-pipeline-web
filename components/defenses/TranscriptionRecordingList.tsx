'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiFileText, FiLoader, FiTrash2, FiVideo } from 'react-icons/fi';

import Card from '@/components/ui/Card';
import {
  deleteMeetingRecording,
  getMyMeetingRecordings,
  type MeetingRecordingSummary,
  type TranscriptionStatus,
} from '@/lib/api/recordings';
import { defenseRecordingTranscriptionUrl } from '@/lib/meetings/navigation';

interface ScheduleGroup {
  schedule_id: string;
  project_title?: string | null;
  project_code?: string | null;
  defense_type?: string | null;
  meeting_title?: string | null;
  recordings: MeetingRecordingSummary[];
}

function formatDate(value?: string | null): string {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString();
}

function groupTitle(group: ScheduleGroup): string {
  return group.project_title || group.meeting_title || group.project_code || 'Meeting recording';
}

function transcriptionLabel(status?: TranscriptionStatus, hasArchive?: boolean): string {
  if (status === 'processing' || status === 'pending') return 'Transcribing';
  if (status === 'failed') return 'Transcription failed';
  if (status === 'skipped') return 'No transcript';
  if (hasArchive || status === 'completed') return 'Transcribed';
  return 'Video only';
}

function transcriptionBadgeClass(status?: TranscriptionStatus, hasArchive?: boolean): string {
  if (status === 'processing' || status === 'pending') {
    return 'bg-amber-100 text-amber-800';
  }
  if (status === 'failed') return 'bg-red-100 text-red-800';
  if (hasArchive || status === 'completed') return 'bg-green-100 text-green-800';
  return 'bg-neutral-100 text-neutral-600';
}

export default function TranscriptionRecordingList() {
  const [recordings, setRecordings] = useState<MeetingRecordingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getMyMeetingRecordings();
    if (res.error || !res.data) {
      setError(res.error || 'Failed to load recordings');
      setRecordings([]);
    } else {
      setRecordings(res.data.recordings || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const groups = useMemo(() => {
    const map = new Map<string, ScheduleGroup>();

    for (const row of recordings) {
      const existing = map.get(row.schedule_id);
      if (existing) {
        existing.recordings.push(row);
        continue;
      }

      map.set(row.schedule_id, {
        schedule_id: row.schedule_id,
        project_title: row.project_title,
        project_code: row.project_code,
        defense_type: row.defense_type,
        meeting_title: row.meeting_title,
        recordings: [row],
      });
    }

    return Array.from(map.values()).map((group) => ({
      ...group,
      recordings: [...group.recordings].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
      ),
    }));
  }, [recordings]);

  const handleDelete = async (row: MeetingRecordingSummary) => {
    if (!row.can_delete) return;
    const confirmed = window.confirm('Delete this recording and its transcript? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(row.id);
    const res = await deleteMeetingRecording(row.schedule_id, row.id);
    setDeletingId(null);

    if (res.error) {
      setError(res.error);
      return;
    }

    await loadRecordings();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-neutral-500">
        <FiLoader className="animate-spin" aria-hidden />
        Loading recorded meetings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    );
  }

  if (!groups.length) {
    return (
      <Card padding="lg">
        <div className="py-10 text-center">
          <FiVideo className="mx-auto mb-3 text-3xl text-neutral-300" aria-hidden />
          <p className="text-sm font-medium text-neutral-800">No recorded meetings yet</p>
          <p className="mt-2 text-sm text-neutral-500">
            Join a meeting and click <strong>Record meeting</strong>. Video is saved immediately and gated voice
            audio is transcribed automatically in the background.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.schedule_id} className="rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <p className="text-base font-semibold text-neutral-900">{groupTitle(group)}</p>
            <p className="text-sm text-neutral-500">
              {group.project_code || group.schedule_id}
              {group.defense_type ? ` · ${group.defense_type}` : ''}
              {` · ${group.recordings.length} recording${group.recordings.length === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="divide-y divide-neutral-100">
            {group.recordings.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    Recording · {formatDate(row.recorded_at)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
                    <FiCalendar aria-hidden />
                    {row.duration_ms ? `${Math.round(row.duration_ms / 1000)}s` : 'Duration unknown'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${transcriptionBadgeClass(row.transcription_status, Boolean(row.transcription_id))}`}
                  >
                    {(row.transcription_status === 'processing' || row.transcription_status === 'pending') ? (
                      <FiLoader className="animate-spin" aria-hidden />
                    ) : (
                      <FiFileText aria-hidden />
                    )}
                    {transcriptionLabel(row.transcription_status, Boolean(row.transcription_id))}
                  </span>

                  <Link
                    href={defenseRecordingTranscriptionUrl(row.schedule_id, row.id)}
                    className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    View
                  </Link>

                  {row.can_delete ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(row)}
                      disabled={deletingId === row.id}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === row.id ? (
                        <FiLoader className="animate-spin" aria-hidden />
                      ) : (
                        <FiTrash2 aria-hidden />
                      )}
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
