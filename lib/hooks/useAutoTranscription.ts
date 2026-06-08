'use client';

import { useCallback, useRef, useState } from 'react';

import {
  startBrowserRoomCapture,
  requestBrowserSerialPort,
  type BrowserCaptureStatus,
} from '@/lib/transcriptions/browserRoomCapture';
import {
  isLocalTranscriptionAgentRunning,
  startLocalTranscriptionAgent,
  stopLocalTranscriptionAgent,
} from '@/lib/transcriptions/localAgent';

export type AutoTranscriptionMode = 'agent' | 'browser' | 'none';

export interface AutoTranscriptionState {
  listening: boolean;
  mode: AutoTranscriptionMode;
  status: BrowserCaptureStatus | 'agent' | 'idle';
  speaking: boolean;
  message: string | null;
  needsSerialPermission: boolean;
  starting: boolean;
}

export function useAutoTranscription(scheduleId: string) {
  const [state, setState] = useState<AutoTranscriptionState>({
    listening: false,
    mode: 'none',
    status: 'idle',
    speaking: false,
    message: null,
    needsSerialPermission: false,
    starting: false,
  });

  const cleanupRef = useRef<(() => Promise<void>) | null>(null);

  const stopListening = useCallback(async () => {
    const cleanup = cleanupRef.current;
    cleanupRef.current = null;

    if (cleanup) {
      await cleanup();
    }
    await stopLocalTranscriptionAgent();

    setState({
      listening: false,
      mode: 'none',
      status: 'idle',
      speaking: false,
      message: null,
      needsSerialPermission: false,
      starting: false,
    });
  }, []);

  const startListening = useCallback(async () => {
    if (!scheduleId || state.listening || state.starting) return false;

    setState((prev) => ({
      ...prev,
      starting: true,
      status: 'starting',
      message: 'Starting voice listening...',
    }));

    const agentStarted = await startLocalTranscriptionAgent(scheduleId);
    if (agentStarted) {
      setState({
        listening: true,
        mode: 'agent',
        status: 'agent',
        speaking: false,
        message: 'Voice listening active via room agent.',
        needsSerialPermission: false,
        starting: false,
      });
      return true;
    }

    const agentAlreadyRunning = await isLocalTranscriptionAgentRunning();
    if (agentAlreadyRunning) {
      setState({
        listening: true,
        mode: 'agent',
        status: 'agent',
        speaking: false,
        message: 'Room transcription agent is already capturing on this PC.',
        needsSerialPermission: false,
        starting: false,
      });
      return true;
    }

    let latestStatus: BrowserCaptureStatus = 'starting';

    const cleanup = await startBrowserRoomCapture(scheduleId, {
      onStatus: (status, message) => {
        latestStatus = status;
        setState((prev) => ({
          ...prev,
          listening: !['idle', 'unsupported', 'needs_serial', 'error'].includes(status),
          mode: 'browser',
          status,
          message: message || null,
          needsSerialPermission: status === 'needs_serial',
          starting: false,
        }));
      },
      onSpeakingChange: (speaking) => {
        setState((prev) => ({ ...prev, speaking }));
      },
    });

    cleanupRef.current = cleanup;

    const listening = !['idle', 'unsupported', 'needs_serial', 'error'].includes(latestStatus);
    setState((prev) => ({
      ...prev,
      listening,
      starting: false,
    }));

    return listening;
  }, [scheduleId, state.listening, state.starting]);

  const connectSerial = useCallback(async () => {
    const granted = await requestBrowserSerialPort();
    if (!granted) return false;

    await stopListening();
    return startListening();
  }, [startListening, stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    connectSerial,
  };
}
