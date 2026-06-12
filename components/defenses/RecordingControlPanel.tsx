'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FiDownload, FiEdit2, FiLoader, FiSave, FiSettings, FiTrash2 } from 'react-icons/fi';

import Button from '@/components/Button';
import Card, { CardTitle } from '@/components/ui/Card';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import {
  deleteMeetingRecording,
  purgeMeetingRecording,
  renameMeetingRecording,
  restoreMeetingRecording,
  type MeetingRecordingSummary,
} from '@/lib/api/recordings';
import { recordingDeleteUndoToastMessage } from '@/lib/meetings/undoStatusMessages';
import { recordingDisplayTitle, recordingDownloadFilename } from '@/lib/recordings/display';

interface RecordingControlPanelProps {
  scheduleId: string;
  recordingId: string;
  recording: MeetingRecordingSummary;
  videoUrl: string;
  onRenamed: (displayName: string) => void;
  onSoftDeleted: () => void;
  onRestored: () => void;
  onPermanentlyDeleted: () => void;
}

function formatFileSize(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes) || bytes <= 0) return 'Unknown size';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms?: number | null): string {
  if (ms == null || Number.isNaN(ms) || ms <= 0) return 'Unknown duration';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const RECORDING_NAME_BOX_CLASS =
  'w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm leading-5 text-neutral-800 break-words';

export default function RecordingControlPanel({
  scheduleId,
  recordingId,
  recording,
  videoUrl,
  onRenamed,
  onSoftDeleted,
  onRestored,
  onPermanentlyDeleted,
}: RecordingControlPanelProps) {
  const canManage = Boolean(recording.can_manage ?? recording.can_delete);
  const displayTitle = recordingDisplayTitle(recording);
  const [nameInput, setNameInput] = useState(displayTitle);
  const [isEditingName, setIsEditingName] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { toast: deleteUndoToast, showUndoToast: showDeleteUndoToast, dismissUndoToast: dismissDeleteUndoToast } =
    useUndoActionToast();
  const deleteUndoUsedRef = useRef(false);
  const pendingPurgeRef = useRef(false);
  const nameBoxRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLTextAreaElement>(null);
  const [nameBoxHeight, setNameBoxHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!isEditingName) {
      setNameInput(displayTitle);
    }
  }, [displayTitle, isEditingName]);

  useLayoutEffect(() => {
    if (!isEditingName || !nameInputRef.current || nameBoxHeight == null) return;
    nameInputRef.current.style.height = `${nameBoxHeight}px`;
    nameInputRef.current.focus();
    nameInputRef.current.select();
  }, [isEditingName, nameBoxHeight]);

  const startEditingName = () => {
    setRenameError(null);
    if (nameBoxRef.current) {
      setNameBoxHeight(nameBoxRef.current.offsetHeight);
    }
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const nextName = nameInput.trim();
    if (!nextName) {
      setRenameError('Recording name is required.');
      return;
    }
    if (nextName === displayTitle) {
      setIsEditingName(false);
      setRenameError(null);
      return;
    }

    setRenaming(true);
    setRenameError(null);
    const res = await renameMeetingRecording(scheduleId, recordingId, nextName);
    setRenaming(false);

    if (res.error || !res.data) {
      setRenameError(res.error || 'Failed to rename recording');
      return;
    }

    setIsEditingName(false);
    setNameBoxHeight(null);
    onRenamed(res.data.display_name);
  };

  const handleDownloadRecording = async () => {
    if (!videoUrl) {
      setDownloadError('Recording file is unavailable.');
      return;
    }

    setDownloading(true);
    setDownloadError(null);

    try {
      const tokenMatch = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
      const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(videoUrl, { credentials: 'include', headers });
      if (!res.ok) {
        setDownloadError('Download failed.');
        return;
      }

      const blob = await res.blob();
      const extension = recording.mime_type?.includes('mp4') ? 'mp4' : 'webm';
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = recordingDownloadFilename(recording, extension);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError('Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recording.can_delete) return;

    setDeleting(true);
    setDeleteError(null);
    dismissDeleteUndoToast();
    deleteUndoUsedRef.current = false;
    pendingPurgeRef.current = true;

    const res = await deleteMeetingRecording(scheduleId, recordingId);
    setDeleting(false);

    if (res.error) {
      pendingPurgeRef.current = false;
      setDeleteError(res.error);
      return;
    }

    setDeleteModalOpen(false);
    onSoftDeleted();

    showDeleteUndoToast({
      message: recordingDeleteUndoToastMessage(),
      onUndo: async () => {
        deleteUndoUsedRef.current = true;
        pendingPurgeRef.current = false;
        const restoreRes = await restoreMeetingRecording(scheduleId, recordingId);
        if (restoreRes.error) {
          setDeleteError(restoreRes.error);
          return;
        }
        onRestored();
      },
    });
  };

  const handleDeleteToastDismiss = () => {
    if (!deleteUndoUsedRef.current && pendingPurgeRef.current) {
      void purgeMeetingRecording(scheduleId, recordingId).finally(() => {
        onPermanentlyDeleted();
      });
    }
    pendingPurgeRef.current = false;
    deleteUndoUsedRef.current = false;
    dismissDeleteUndoToast();
  };

  return (
    <>
      <Card className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-md bg-primary-50 p-2 text-primary-600">
            <FiSettings className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="!text-lg">Recording Settings</CardTitle>
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Duration</dt>
            <dd className="font-medium text-neutral-800">{formatDuration(recording.duration_ms)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">File size</dt>
            <dd className="font-medium text-neutral-800">{formatFileSize(recording.file_size)}</dd>
          </div>
        </dl>

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium text-neutral-800">Recording name</p>

          {canManage && isEditingName ? (
            <>
              <textarea
                ref={nameInputRef}
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Recording name"
                rows={1}
                disabled={renaming}
                className={`${RECORDING_NAME_BOX_CLASS} resize-none overflow-hidden outline-none transition-[border-color,box-shadow] focus:border-primary-400 focus:ring-1 focus:ring-primary-200 disabled:opacity-60`}
                aria-label="Recording name"
              />
              {renameError ? <p className="text-sm text-archivumRed">{renameError}</p> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={
                    renaming ? <FiLoader className="animate-spin" aria-hidden /> : <FiSave aria-hidden />
                  }
                  onClick={() => void handleSaveName()}
                  disabled={renaming}
                >
                  Save name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingName(false);
                    setRenameError(null);
                    setNameInput(displayTitle);
                    setNameBoxHeight(null);
                  }}
                  disabled={renaming}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div
              ref={nameBoxRef}
              className={`${RECORDING_NAME_BOX_CLASS} relative pr-9 ${
                canManage ? 'cursor-pointer transition-colors hover:border-neutral-400 hover:bg-white' : ''
              }`}
              onClick={canManage ? startEditingName : undefined}
              onKeyDown={
                canManage
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        startEditingName();
                      }
                    }
                  : undefined
              }
              role={canManage ? 'button' : undefined}
              tabIndex={canManage ? 0 : undefined}
              aria-label={canManage ? 'Edit recording name' : undefined}
            >
              {displayTitle}
              {canManage ? (
                <FiEdit2
                  className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-primary-600"
                  aria-hidden
                />
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className={`min-w-0 w-full ${recording.can_delete ? '' : 'col-span-2 lg:col-span-1'}`}
              leftIcon={
                downloading ? <FiLoader className="animate-spin" aria-hidden /> : <FiDownload aria-hidden />
              }
              onClick={() => void handleDownloadRecording()}
              disabled={downloading || !videoUrl}
            >
              Download recording
            </Button>

            {recording.can_delete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-w-0 w-full border-2 border-archivumRed bg-transparent !text-archivumRed hover:border-archivumRed hover:bg-error-50 hover:!text-archivumRed focus:ring-archivumRed/30 disabled:border-neutral-300 disabled:!text-neutral-400 disabled:hover:bg-transparent [&_svg]:text-archivumRed hover:[&_svg]:text-archivumRed disabled:[&_svg]:text-neutral-400"
                leftIcon={<FiTrash2 className="text-archivumRed" aria-hidden />}
                onClick={() => {
                  setDeleteError(null);
                  setDeleteModalOpen(true);
                }}
              >
                Delete recording
              </Button>
            ) : null}
          </div>

          {downloadError ? <p className="text-sm text-archivumRed">{downloadError}</p> : null}
          {!recording.can_delete ? (
            <p className="text-sm text-neutral-500">
              Only the person who recorded this meeting can delete it.
            </p>
          ) : null}
          {deleteError ? <p className="text-sm text-archivumRed">{deleteError}</p> : null}
        </div>
      </Card>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) setDeleteModalOpen(false);
        }}
        title="Delete recording?"
        size="sm"
        dense
      >
        <p className="text-sm text-neutral-700">
          This removes{' '}
          <span className="font-semibold text-neutral-900">{displayTitle}</span> and its transcript from
          your archive. You can revert this for a few seconds after confirming.
        </p>
        {deleteError ? <p className="mt-3 text-sm text-archivumRed">{deleteError}</p> : null}
        <ModalFooter className="!mt-4 !pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalOpen(false)}
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
