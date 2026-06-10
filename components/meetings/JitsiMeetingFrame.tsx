'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertTriangle, FiExternalLink } from 'react-icons/fi';

import { getJitsiBaseUrl } from '@/lib/meetings/jitsi';
import { loadJitsiExternalApiScript, parseJitsiJoinUrl } from '@/lib/meetings/jitsiExternalApi';

interface JitsiMeetingFrameProps {
  joinUrl: string;
  title: string;
  onConferenceJoined?: () => void;
  onConferenceLeft?: () => void;
}

const LOAD_TIMEOUT_MS = 12000;

export default function JitsiMeetingFrame({
  joinUrl,
  title,
  onConferenceJoined,
  onConferenceLeft,
}: JitsiMeetingFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiMeetExternalAPI | null>(null);
  const joinedRef = useRef(false);
  const mountedKeyRef = useRef<string | null>(null);
  const onJoinedRef = useRef(onConferenceJoined);
  const onLeftRef = useRef(onConferenceLeft);
  const titleRef = useRef(title);
  const [showFallback, setShowFallback] = useState(false);

  const jitsiBaseUrl = getJitsiBaseUrl();
  const room = useMemo(() => parseJitsiJoinUrl(joinUrl), [joinUrl]);
  const roomKey = room ? `${room.domain}/${room.roomName}` : null;

  useEffect(() => {
    onJoinedRef.current = onConferenceJoined;
    onLeftRef.current = onConferenceLeft;
    titleRef.current = title;
  }, [onConferenceJoined, onConferenceLeft, title]);

  useEffect(() => {
    joinedRef.current = false;
    setShowFallback(false);

    const timer = window.setTimeout(() => {
      if (!joinedRef.current) {
        setShowFallback(true);
      }
    }, LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [roomKey]);

  useEffect(() => {
    if (!roomKey || !room || !containerRef.current) return undefined;

    const resolvedRoom = room;
    const container = containerRef.current;

    // Avoid remounting when React re-renders with the same room.
    if (mountedKeyRef.current === roomKey && apiRef.current) {
      return undefined;
    }

    let disposed = false;

    async function mountJitsi() {
      try {
        await loadJitsiExternalApiScript(jitsiBaseUrl);
        if (disposed || !container || !window.JitsiMeetExternalAPI) return;

        apiRef.current?.dispose();
        container.innerHTML = '';

        const api = new window.JitsiMeetExternalAPI(resolvedRoom.domain, {
          roomName: resolvedRoom.roomName,
          parentNode: container,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: titleRef.current,
          },
          configOverwrite: {
            prejoinPageEnabled: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            MOBILE_APP_PROMO: false,
          },
        });

        apiRef.current = api;
        mountedKeyRef.current = roomKey;

        const handleJoined = () => {
          joinedRef.current = true;
          setShowFallback(false);
          onJoinedRef.current?.();
        };

        const handleLeft = () => {
          if (!joinedRef.current) return;
          joinedRef.current = false;
          onLeftRef.current?.();
        };

        api.addListener('videoConferenceJoined', handleJoined);
        api.addListener('videoConferenceLeft', handleLeft);
      } catch {
        if (!disposed) setShowFallback(true);
      }
    }

    mountJitsi();

    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
      mountedKeyRef.current = null;
      container.innerHTML = '';
    };
  }, [roomKey, jitsiBaseUrl, room]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" aria-label={title} />

      {showFallback ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/95 px-6">
          <div className="max-w-lg rounded-lg border border-white/15 bg-neutral-900 p-6 text-white shadow-xl">
            <div className="mb-3 flex items-center gap-2 text-amber-300">
              <FiAlertTriangle aria-hidden />
              <h2 className="text-base font-semibold">Meeting room unavailable</h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-neutral-300">
              The embedded Jitsi room at <code className="text-neutral-100">{joinUrl}</code> could not
              be loaded. This usually means the local Jitsi Docker stack is not running, or your browser
              has not trusted the self-signed certificate yet.
            </p>
            <ol className="mb-5 list-decimal space-y-2 pl-5 text-sm text-neutral-300">
              <li>
                Start Jitsi:{' '}
                <code className="text-neutral-100">npm run docker:jitsi:setup</code> then{' '}
                <code className="text-neutral-100">docker compose up -d jitsi-web jitsi-prosody jitsi-jicofo jitsi-jvb</code>
              </li>
              <li>
                Open{' '}
                <a
                  href={jitsiBaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-300 underline"
                >
                  {jitsiBaseUrl}
                </a>{' '}
                in a new tab and accept the certificate warning.
              </li>
              <li>Return here and open the meeting again.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
              >
                <FiExternalLink aria-hidden />
                Open meeting in new tab
              </a>
              <a
                href={jitsiBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
              >
                Trust Jitsi certificate
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
