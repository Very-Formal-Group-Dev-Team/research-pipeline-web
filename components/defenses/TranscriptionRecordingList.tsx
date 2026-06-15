'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiFileText, FiLoader, FiTrash2, FiVideo } from 'react-icons/fi';

import Button from '@/components/Button';
import EmptyState from '@/components/layout/EmptyState';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import Card, {
  CARD_HEADER_SECTION_CLASS,
  CARD_INSET_X_CLASS,
  CardDescription,
  CardTitle,
} from '@/components/ui/Card';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import {
  deleteMeetingRecording,
  getMyMeetingRecordings,
  purgeMeetingRecording,
  restoreMeetingRecording,
  type MeetingRecordingSummary,
  type TranscriptionStatus,
} from '@/lib/api/recordings';
import { defenseRecordingTranscriptionUrl } from '@/lib/meetings/navigation';
import { recordingDeleteUndoToastMessage } from '@/lib/meetings/undoStatusMessages';
import { recordingDisplayTitle } from '@/lib/recordings/display';

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
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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

function transcriptionBadgeVariant(
  status?: TranscriptionStatus,
  hasArchive?: boolean,
): BadgeVariant {
  if (status === 'processing' || status === 'pending') return 'warning';
  if (status === 'failed') return 'error';
  if (hasArchive || status === 'completed') return 'success';
  return 'default';
}

export default function TranscriptionRecordingList() {
  const [recordings, setRecordings] = useState<MeetingRecordingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowPendingDelete, setRowPendingDelete] = useState<MeetingRecordingSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { toast: deleteUndoToast, showUndoToast: showDeleteUndoToast, dismissUndoToast: dismissDeleteUndoToast } =
    useUndoActionToast();
  const deleteUndoUsedRef = useRef(false);
  const pendingPurgeRef = useRef(false);
  const pendingDeleteRowRef = useRef<MeetingRecordingSummary | null>(null);

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

  const openDeleteModal = (row: MeetingRecordingSummary) => {
    if (!row.can_delete) return;
    setDeleteError(null);
    setActionError(null);
    setRowPendingDelete(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowPendingDelete?.can_delete) return;

    const row = rowPendingDelete;
    setDeleting(true);
    setDeleteError(null);
    dismissDeleteUndoToast();
    deleteUndoUsedRef.current = false;
    pendingPurgeRef.current = true;
    pendingDeleteRowRef.current = row;

    const res = await deleteMeetingRecording(row.schedule_id, row.id);
    setDeleting(false);

    if (res.error) {
      pendingPurgeRef.current = false;
      pendingDeleteRowRef.current = null;
      setDeleteError(res.error);
      return;
    }

    setDeleteModalOpen(false);
    setRowPendingDelete(null);
    setRecordings((prev) => prev.filter((recording) => recording.id !== row.id));

    showDeleteUndoToast({
      message: recordingDeleteUndoToastMessage(),
      onUndo: async () => {
        deleteUndoUsedRef.current = true;
        pendingPurgeRef.current = false;
        const restoreRes = await restoreMeetingRecording(row.schedule_id, row.id);
        if (restoreRes.error) {
          setActionError(restoreRes.error);
          return;
        }
        pendingDeleteRowRef.current = null;
        await loadRecordings();
      },
    });
  };

  const handleDeleteToastDismiss = () => {
    const row = pendingDeleteRowRef.current;
    if (!deleteUndoUsedRef.current && pendingPurgeRef.current && row) {
      void purgeMeetingRecording(row.schedule_id, row.id);
    }
    pendingPurgeRef.current = false;
    deleteUndoUsedRef.current = false;
    pendingDeleteRowRef.current = null;
    dismissDeleteUndoToast();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
        {error}
      </div>
    );
  }

  if (!groups.length) {
    return (
      <Card>
        <EmptyState
          icon={<FiVideo />}
          title="No recorded meetings yet"
          description="Join a meeting and click Record meeting. Video is saved immediately and gated voice audio is transcribed automatically in the background."
        />
      </Card>
    );
  }

  const pendingDeleteTitle = rowPendingDelete ? recordingDisplayTitle(rowPendingDelete) : 'this recording';

  return (
    <>
    {actionError ? (
      <div className="mb-3 rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
        {actionError}
      </div>
    ) : null}
    <div className="space-y-3">
      {groups.map((group) => (
        <Card key={group.schedule_id} padding="none" className="overflow-hidden">
          <div className={CARD_HEADER_SECTION_CLASS}>
            <CardTitle>{groupTitle(group)}</CardTitle>
            <CardDescription lines={2} className="!mt-1">
              {group.project_code || group.schedule_id}
              {group.defense_type ? ` · ${group.defense_type}` : ''}
              {` · ${group.recordings.length} recording${group.recordings.length === 1 ? '' : 's'}`}
            </CardDescription>
          </div>

          <div className="divide-y divide-neutral-300">
            {group.recordings.map((row) => {
              const recordingHref = defenseRecordingTranscriptionUrl(row.schedule_id, row.id);

              return (
                <div
                  key={row.id}
                  className={`relative flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-neutral-100 ${CARD_INSET_X_CLASS}`}
                >
                  <Link
                    href={recordingHref}
                    className="absolute inset-0 z-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                    aria-label={`Open recording: ${recordingDisplayTitle(row)}`}
                  />
                  <div className="relative z-10 min-w-0 flex-1 pointer-events-none">
                    <p className="text-sm font-medium text-neutral-800">
                      {recordingDisplayTitle(row)} · {formatDate(row.recorded_at)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-600">
                      <FiCalendar className="h-4 w-4 shrink-0" aria-hidden />
                      {row.duration_ms ? `${Math.round(row.duration_ms / 1000)}s` : 'Duration unknown'}
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={transcriptionBadgeVariant(row.transcription_status, Boolean(row.transcription_id))}
                      size="sm"
                      className="pointer-events-none inline-flex items-center gap-1"
                    >
                      {(row.transcription_status === 'processing' || row.transcription_status === 'pending') ? (
                        <FiLoader className="animate-spin" aria-hidden />
                      ) : (
                        <FiFileText aria-hidden />
                      )}
                      {transcriptionLabel(row.transcription_status, Boolean(row.transcription_id))}
                    </Badge>

                    {row.can_delete ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="relative z-10 !border-error-200 !text-error-700 hover:!bg-error-50"
                        leftIcon={<FiTrash2 aria-hidden />}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openDeleteModal(row);
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>

    <Modal
      isOpen={deleteModalOpen}
      onClose={() => {
        if (!deleting) {
          setDeleteModalOpen(false);
          setRowPendingDelete(null);
        }
      }}
      title="Delete recording?"
      size="sm"
      dense
    >
      <p className="text-sm text-neutral-700">
        This removes{' '}
        <span className="font-semibold text-neutral-900">{pendingDeleteTitle}</span> and its transcript from
        your archive. You can revert this for a few seconds after confirming.
      </p>
      {deleteError ? <p className="mt-3 text-sm text-archivumRed">{deleteError}</p> : null}
      <ModalFooter className="!mt-4 !pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDeleteModalOpen(false);
            setRowPendingDelete(null);
          }}
          disabled={deleting}
        >
          Keep recording
        </Button>
        <Button
          type="button"
          variant="error"
          size="sm"
          onClick={() => void handleConfirmDelete()}
          disabled={deleting}
          leftIcon={deleting ? <FiLoader className="animate-spin" aria-hidden /> : <FiTrash2 aria-hidden />}
        >
          Delete recording
        </Button>
      </ModalFooter>
    </Modal>

    <UndoActionToastHost toast={deleteUndoToast} onDismiss={handleDeleteToastDismiss} />
    </>
  );
}
