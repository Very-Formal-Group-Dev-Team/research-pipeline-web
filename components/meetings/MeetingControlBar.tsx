'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FiGrid,
  FiMessageSquare,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPhoneOff,
  FiSettings,
  FiUsers,
  FiVideo,
  FiVideoOff,
} from 'react-icons/fi';
import { LuHand } from 'react-icons/lu';

import MeetingControlButton, { MeetingControlDivider } from '@/components/meetings/MeetingControlButton';
import MeetingPerformanceButton from '@/components/meetings/MeetingPerformanceButton';
import MeetingReactionsButton from '@/components/meetings/MeetingReactionsButton';
import type { useMeetingRecording } from '@/lib/hooks/useMeetingRecording';
import type { JitsiMeetApi } from '@/lib/meetings/jitsiApi';
import {
  hangUpJitsi,
  openJitsiSettings,
  toggleJitsiAudio,
  toggleJitsiChat,
  toggleJitsiParticipantsPane,
  toggleJitsiRaiseHand,
  toggleJitsiShareScreen,
  toggleJitsiTileView,
  toggleJitsiVideo,
} from '@/lib/meetings/jitsiApi';
import type { JitsiMediaState } from '@/lib/meetings/jitsiApi';
import { MEETING_CONTROL_BAR_HEIGHT } from '@/lib/meetings/jitsiTheme';
import { useMeetingElapsedTimer } from '@/lib/meetings/useMeetingElapsedTimer';

type RecordingState = ReturnType<typeof useMeetingRecording>;

export interface MeetingControlBarProps {
  projectTitle: string;
  projectMeta: string;
  hasJoined: boolean;
  jitsiApi: JitsiMeetApi | null;
  mediaState: JitsiMediaState;
  recording: RecordingState;
  leaveHref: string;
  onLeaveMeeting?: () => void;
  panelToolsTrigger?: React.ReactNode;
}

export default function MeetingControlBar({
  projectTitle,
  projectMeta,
  hasJoined,
  jitsiApi,
  mediaState,
  recording,
  leaveHref,
  onLeaveMeeting,
  panelToolsTrigger,
}: MeetingControlBarProps) {
  const elapsed = useMeetingElapsedTimer(hasJoined);
  const { status, isRecording, canRecord, promptStartRecording, stopRecording } = recording;
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [raiseHandUp, setRaiseHandUp] = useState(false);
  const localParticipantIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!jitsiApi) {
      setParticipantsOpen(false);
      setRaiseHandUp(false);
      localParticipantIdRef.current = null;
      return undefined;
    }

    const handleParticipantsPaneToggled = (payload: unknown) => {
      const open = Boolean((payload as { open?: boolean })?.open);
      setParticipantsOpen(open);
    };

    const handleConferenceJoined = (payload: unknown) => {
      const id = (payload as { id?: string })?.id;
      if (id) {
        localParticipantIdRef.current = id;
      }
    };

    const handleRaiseHandUpdated = (payload: unknown) => {
      const { handRaised, id } = payload as { handRaised?: boolean; id?: string };
      const localId = localParticipantIdRef.current;
      if (localId && id && id !== localId) {
        return;
      }
      setRaiseHandUp(Boolean(handRaised));
    };

    jitsiApi.addListener('participantsPaneToggled', handleParticipantsPaneToggled);
    jitsiApi.addListener('videoConferenceJoined', handleConferenceJoined);
    jitsiApi.addListener('raiseHandUpdated', handleRaiseHandUpdated);

    return () => {
      jitsiApi.removeListener('participantsPaneToggled', handleParticipantsPaneToggled);
      jitsiApi.removeListener('videoConferenceJoined', handleConferenceJoined);
      jitsiApi.removeListener('raiseHandUpdated', handleRaiseHandUpdated);
    };
  }, [jitsiApi]);

  function handleLeave() {
    hangUpJitsi(jitsiApi);
    onLeaveMeeting?.();
  }

  const recordLabel =
    status === 'uploading'
      ? 'Saving'
      : isRecording
        ? 'Stop'
        : status === 'starting'
          ? 'Starting'
          : 'Record';

  return (
    <header
      className="pointer-events-auto z-40 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-deepSpaceBlue/95 px-4 text-white shadow-md backdrop-blur-sm sm:px-5"
      style={{ height: MEETING_CONTROL_BAR_HEIGHT }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {hasJoined ? (
          <span className="shrink-0 font-mono text-sm tabular-nums text-neutral-100">{elapsed}</span>
        ) : null}
        <div className={`min-w-0 ${hasJoined ? 'border-l border-white/10 pl-3' : ''}`}>
          <p className="truncate text-sm font-medium text-neutral-100">{projectTitle}</p>
          <p className="truncate text-[11px] text-neutral-400">{projectMeta}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        {hasJoined ? (
          <>
            <MeetingControlButton
              label="Chat"
              icon={<FiMessageSquare />}
              onClick={() => toggleJitsiChat(jitsiApi)}
            />
            <MeetingControlButton
              label="People"
              icon={<FiUsers />}
              active={participantsOpen}
              onClick={() => {
                void toggleJitsiParticipantsPane(jitsiApi);
              }}
            />
            <MeetingControlButton
              label="View"
              icon={<FiGrid />}
              onClick={() => toggleJitsiTileView(jitsiApi)}
            />
            <MeetingReactionsButton jitsiApi={jitsiApi} />
            <MeetingControlButton
              label="Raise hand"
              icon={<LuHand />}
              active={raiseHandUp}
              onClick={() => {
                toggleJitsiRaiseHand(jitsiApi);
                setRaiseHandUp((current) => !current);
              }}
            />
            <MeetingPerformanceButton jitsiApi={jitsiApi} />
            <MeetingControlButton
              label="Settings"
              icon={<FiSettings />}
              onClick={() => openJitsiSettings(jitsiApi)}
            />
            {panelToolsTrigger}
            <MeetingControlDivider />
            <MeetingControlButton
              label="Camera"
              icon={mediaState.videoMuted ? <FiVideoOff /> : <FiVideo />}
              muted={mediaState.videoMuted}
              onClick={() => toggleJitsiVideo(jitsiApi)}
            />
            <MeetingControlButton
              label="Mic"
              icon={mediaState.audioMuted ? <FiMicOff /> : <FiMic />}
              muted={mediaState.audioMuted}
              active={!mediaState.audioMuted}
              onClick={() => toggleJitsiAudio(jitsiApi)}
            />
            <MeetingControlDivider />
            <MeetingControlButton
              label="Share"
              icon={<FiMonitor />}
              onClick={() => toggleJitsiShareScreen(jitsiApi)}
            />
            {canRecord ? (
              <>
                <MeetingControlDivider />
                <MeetingControlButton
                  label={recordLabel}
                  icon={
                    isRecording ? (
                      <span className="relative flex h-4 w-4 items-center justify-center">
                        <span className="absolute h-2 w-2 animate-pulse rounded-full bg-red-400" />
                        <FiMic className="relative" />
                      </span>
                    ) : (
                      <FiMic />
                    )
                  }
                  active={isRecording}
                  danger={isRecording}
                  disabled={status === 'uploading' || status === 'starting'}
                  onClick={() => {
                    if (isRecording) {
                      void stopRecording();
                      return;
                    }
                    promptStartRecording();
                  }}
                />
              </>
            ) : null}
            <MeetingControlDivider />
            <MeetingControlButton
              label="Leave"
              icon={<FiPhoneOff />}
              danger
              onClick={handleLeave}
            />
          </>
        ) : (
          <Link
            href={leaveHref}
            className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-3 py-1.5 text-sm text-neutral-200 transition hover:bg-white/10 hover:text-white"
          >
            Back
          </Link>
        )}
      </div>
    </header>
  );
}
