'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';

import DefensePanelOverlay from '@/components/defenses/DefensePanelOverlay';
import JitsiMeetingFrame from '@/components/meetings/JitsiMeetingFrame';
import MeetingRecordingControls from '@/components/meetings/MeetingRecordingControls';
import {
  getDefenseMeetingSession,
  type DefenseMeetingSession,
} from '@/lib/api/defenses';
import { useMeetingRecording } from '@/lib/hooks/useMeetingRecording';
import { normalizeJitsiJoinUrl } from '@/lib/meetings/jitsi';
export default function DefenseMeetingPage() {
  const params = useParams<{ id: string }>();
  const defenseId = typeof params?.id === 'string' ? params.id : '';
  const [session, setSession] = useState<DefenseMeetingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoinedMeeting, setHasJoinedMeeting] = useState(false);

  useEffect(() => {
    if (!defenseId) {
      setError('Defense meeting not found');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSession() {
      setLoading(true);
      setError(null);

      const res = await getDefenseMeetingSession(defenseId);
      if (cancelled) return;

      if (res.error || !res.data) {
        setError(res.error || 'Failed to load defense meeting');
        setSession(null);
      } else {
        setSession(res.data);
      }

      setLoading(false);
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [defenseId]);

  const joinUrl = useMemo(() => {
    if (!session?.defense) return null;
    return normalizeJitsiJoinUrl(session.defense.meeting_url, session.defense.meeting_room);
  }, [session]);

  const meetingTitle = useMemo(
    () => `Defense meeting for ${session?.defense?.project_title || 'Defense'}`,
    [session?.defense?.project_title],
  );

  const showPanelOverlay = Boolean(
    session?.is_panelist && session.defense.schedule_source === 'defense',
  );

  const handleConferenceJoined = useCallback(() => {
    setHasJoinedMeeting(true);
  }, []);

  const handleConferenceLeft = useCallback(() => {
    setHasJoinedMeeting(false);
  }, []);

  const meetingRecording = useMeetingRecording(defenseId, hasJoinedMeeting);

  const { dismissSaved } = meetingRecording;

  useEffect(() => {
    if (meetingRecording.status !== 'done') return undefined;
    const timer = window.setTimeout(() => {
      dismissSaved();
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [dismissSaved, meetingRecording.status]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="flex items-center gap-3 text-sm">
          <FiLoader className="animate-spin" aria-hidden />
          Loading defense meeting...
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-center text-white">
        <p className="text-sm text-neutral-300">{error || 'Defense meeting unavailable'}</p>
        <Link
          href="/adviser/events"
          className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm transition hover:bg-white/10"
        >
          <FiArrowLeft aria-hidden />
          Back to schedule
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-950">
      <div className="absolute left-4 top-4 z-20 flex items-center gap-3 rounded-lg border border-white/15 bg-neutral-900/80 px-3 py-2 text-white shadow-lg backdrop-blur-sm">
        <Link
          href="/adviser/events"
          className="inline-flex items-center gap-2 text-sm text-neutral-200 transition hover:text-white"
        >
          <FiArrowLeft aria-hidden />
          Leave
        </Link>
        <div className="h-4 w-px bg-white/20" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{session.defense.project_title}</p>
          <p className="truncate text-xs text-neutral-400">
            {session.defense.project_code} · {session.defense.defense_type}
          </p>
        </div>
        {hasJoinedMeeting ? (
          <MeetingRecordingControls recording={meetingRecording} />
        ) : null}
      </div>

      {joinUrl ? (
        <JitsiMeetingFrame
          joinUrl={joinUrl}
          title={meetingTitle}
          onConferenceJoined={handleConferenceJoined}
          onConferenceLeft={handleConferenceLeft}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-300">
          This defense does not have an online meeting link yet.
        </div>
      )}

      {showPanelOverlay ? (
        <DefensePanelOverlay
          defenseId={defenseId}
          rubric={session.rubric}
          evaluations={session.evaluations}
          initialNotes={session.notes}
        />
      ) : null}
    </div>
  );
}
