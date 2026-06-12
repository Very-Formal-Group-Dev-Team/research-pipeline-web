'use client';

import React from 'react';

import Modal, { ModalFooter } from '@/components/ui/Modal';
import type { useMeetingRecording } from '@/lib/hooks/useMeetingRecording';

type RecordingState = ReturnType<typeof useMeetingRecording>;

interface MeetingRecordingDialogsProps {
  recording: RecordingState;
}

export default function MeetingRecordingDialogs({ recording }: MeetingRecordingDialogsProps) {
  const {
    startDialogOpen,
    alertDialog,
    cancelStartDialog,
    confirmStartRecording,
    dismissAlert,
  } = recording;

  return (
    <>
      <Modal
        isOpen={startDialogOpen}
        onClose={cancelStartDialog}
        title="Record meeting"
        description="When prompted, share this meeting tab and enable Share tab audio so other participants are captured."
        size="sm"
        dense
        panelClassName="bg-neutral-900 text-white border border-white/15"
        titleClassName="text-lg font-semibold text-white"
        headerClassName="border-white/10"
        contentClassName="text-neutral-200"
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void confirmStartRecording(true)}
            className="w-full rounded-md border border-white/15 bg-neutral-800/80 px-4 py-3 text-left transition hover:bg-neutral-800"
          >
            <p className="text-sm font-medium text-white">Arduino voice gate</p>
            <p className="mt-1 text-xs text-neutral-400">
              Requires Arduino USB. Meeting audio is always captured; your mic is added only above the voice threshold.
              Recording stops if Arduino disconnects.
            </p>
          </button>
          <button
            type="button"
            onClick={() => void confirmStartRecording(false)}
            className="w-full rounded-md border border-white/15 bg-neutral-800/80 px-4 py-3 text-left transition hover:bg-neutral-800"
          >
            <p className="text-sm font-medium text-white">Record all audio</p>
            <p className="mt-1 text-xs text-neutral-400">
              No Arduino required. Captures meeting tab audio plus your full microphone.
            </p>
          </button>
        </div>
        <ModalFooter className="border-white/10">
          <button
            type="button"
            onClick={cancelStartDialog}
            className="rounded-md border border-white/20 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
          >
            Cancel
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={Boolean(alertDialog)}
        onClose={dismissAlert}
        title={alertDialog?.title || 'Recording stopped'}
        size="sm"
        dense
        closeOnOverlayClick={false}
        panelClassName="bg-neutral-900 text-white border border-white/15"
        titleClassName="text-lg font-semibold text-white"
        headerClassName="border-white/10"
        contentClassName="text-neutral-200"
      >
        <p className="text-sm text-neutral-300">{alertDialog?.message}</p>
        <ModalFooter className="border-white/10">
          <button
            type="button"
            onClick={dismissAlert}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            OK
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
