'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FiClipboard, FiLoader } from 'react-icons/fi';

import DefensePanelOverlay from '@/components/defenses/DefensePanelOverlay';
import JitsiMeetingFrame from '@/components/meetings/JitsiMeetingFrame';
import MeetingControlBar from '@/components/meetings/MeetingControlBar';
import MeetingControlButton from '@/components/meetings/MeetingControlButton';
import MeetingRecordingDialogs from '@/components/meetings/MeetingRecordingDialogs';
import {
  getDefenseMeetingSession,
  type DefenseMeetingSession,
} from '@/lib/api/defenses';
import useAuth from '@/lib/hooks/useAuth';
import { useMeetingRecording } from '@/lib/hooks/useMeetingRecording';
import type { JitsiMediaState, JitsiMeetApi } from '@/lib/meetings/jitsiApi';
import { normalizeJitsiJoinUrl, setJitsiBaseUrl } from '@/lib/meetings/jitsi';

export default function DefenseMeetingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const defenseId = typeof params?.id === 'string' ? params.id : '';
  const [session, setSession] = useState<DefenseMeetingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoinedMeeting, setHasJoinedMeeting] = useState(false);
  const [jitsiApi, setJitsiApi] = useState<JitsiMeetApi | null>(null);
  const [mediaState, setMediaState] = useState<JitsiMediaState>({
    audioMuted: false,
    videoMuted: false,
  });
  const [panelOpen, setPanelOpen] = useState(false);

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
        if (res.data.jitsi_base_url) {
          setJitsiBaseUrl(res.data.jitsi_base_url);
        }
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

  const jitsiDisplayName = useMemo(() => {
    const fullName = user?.full_name?.trim();
    if (fullName) return fullName;
    const emailLocal = user?.email?.split('@')[0]?.trim();
    if (emailLocal) return emailLocal;
    return 'Participant';
  }, [user?.email, user?.full_name]);

  const showPanelOverlay = Boolean(
    session?.is_panelist && session.defense.schedule_source === 'defense',
  );

  const handleConferenceJoined = useCallback(() => {
    setHasJoinedMeeting(true);
  }, []);

  const handleConferenceLeft = useCallback(() => {
    setHasJoinedMeeting(false);
    setPanelOpen(false);
  }, []);

  const handleMediaStateChange = useCallback((next: JitsiMediaState) => {
    setMediaState((prev) => ({ ...prev, ...next }));
  }, []);

  const handleLeaveMeeting = useCallback(() => {
    setPanelOpen(false);
    router.push('/adviser/events');
  }, [router]);

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
          Back to schedule
        </Link>
      </div>
    );
  }

  const projectMeta = `${session.defense.project_code} · ${session.defense.defense_type}`;

  return (
    <div className="dashboard-ui flex h-screen w-screen flex-col overflow-hidden bg-neutral-950">
      <MeetingControlBar
        projectTitle={session.defense.project_title}
        projectMeta={projectMeta}
        hasJoined={hasJoinedMeeting}
        jitsiApi={jitsiApi}
        mediaState={mediaState}
        recording={meetingRecording}
        leaveHref="/adviser/events"
        onLeaveMeeting={handleLeaveMeeting}
        panelToolsTrigger={
          showPanelOverlay && hasJoinedMeeting ? (
            <MeetingControlButton
              label="Panel"
              icon={<FiClipboard />}
              active={panelOpen}
              onClick={() => setPanelOpen((open) => !open)}
            />
          ) : null
        }
      />

      <MeetingRecordingDialogs recording={meetingRecording} />

      <div className="relative min-h-0 flex-1">
        {joinUrl ? (
          <JitsiMeetingFrame
            joinUrl={joinUrl}
            title={meetingTitle}
            displayName={jitsiDisplayName}
            onApiReady={setJitsiApi}
            onMediaStateChange={handleMediaStateChange}
            onConferenceJoined={handleConferenceJoined}
            onConferenceLeft={handleConferenceLeft}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-300">
            This defense does not have an online meeting link yet.
          </div>
        )}

        {showPanelOverlay && hasJoinedMeeting ? (
          <DefensePanelOverlay
            open={panelOpen}
            onOpenChange={setPanelOpen}
            defenseId={defenseId}
            meetingProjects={session.meeting_projects || []}
            rubric={session.rubric}
            evaluations={session.evaluations}
            initialNotes={session.notes}
            initialTotalScore={session.total_score}
          />
        ) : null}
      </div>
    </div>
  );
}
