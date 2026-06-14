'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { completeMeetingRecording, startMeetingRecording } from '@/lib/api/recordings';
import { createMeetingAudioMix, type MeetingAudioMixHandle } from '@/lib/transcriptions/meetingAudioMix';
import { startLiveTranscriptionChunks } from '@/lib/transcriptions/liveTranscriptionChunks';
import { startArduinoGate, type ArduinoGateStatus } from '@/lib/transcriptions/arduinoGate';

export type MeetingRecordingStatus = 'idle' | 'starting' | 'recording' | 'uploading' | 'done' | 'error';

export interface RecordingAlertDialog {
  title: string;
  message: string;
}

interface DisplayCaptureResult {
  videoStream: MediaStream;
  meetingAudioStream: MediaStream | null;
  displayStream: MediaStream;
}

async function captureDisplayStream(): Promise<DisplayCaptureResult> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Recording is not supported in this browser.');
  }

  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: 15,
      displaySurface: 'browser',
    },
    audio: true,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    monitorTypeSurfaces: 'exclude',
    systemAudio: 'exclude',
  });

  const videoTracks = displayStream.getVideoTracks();
  if (!videoTracks.length) {
    displayStream.getTracks().forEach((track) => track.stop());
    throw new Error('Could not capture the meeting video stream.');
  }

  const audioTracks = displayStream.getAudioTracks();
  return {
    displayStream,
    videoStream: new MediaStream(videoTracks),
    meetingAudioStream: audioTracks.length ? new MediaStream(audioTracks) : null,
  };
}

async function captureMicStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
}

export function useMeetingRecording(scheduleId: string, enabled = true) {
  const [status, setStatus] = useState<MeetingRecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [gateStatus, setGateStatus] = useState<ArduinoGateStatus>('idle');
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [gateActive, setGateActive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [savedRecordingId, setSavedRecordingId] = useState<string | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [alertDialog, setAlertDialog] = useState<RecordingAlertDialog | null>(null);

  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const meetingAudioStreamRef = useRef<MediaStream | null>(null);
  const localMicStreamRef = useRef<MediaStream | null>(null);
  const audioMixRef = useRef<MeetingAudioMixHandle | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const gateCleanupRef = useRef<(() => Promise<void>) | null>(null);
  const gateActiveRef = useRef(false);
  const voiceGateRequiredRef = useRef(false);
  const gateLostHandledRef = useRef(false);
  const stopRecordingRef = useRef<(() => Promise<unknown>) | null>(null);
  const liveTranscriptionStopRef = useRef<(() => void) | null>(null);
  const deviceKeyRef = useRef<string | null>(null);

  const cleanup = useCallback(async () => {
    if (gateCleanupRef.current) {
      await gateCleanupRef.current();
      gateCleanupRef.current = null;
    }

    if (audioMixRef.current) {
      await audioMixRef.current.close();
      audioMixRef.current = null;
    }

    displayStreamRef.current?.getTracks().forEach((track) => track.stop());
    meetingAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    localMicStreamRef.current?.getTracks().forEach((track) => track.stop());
    displayStreamRef.current = null;
    meetingAudioStreamRef.current = null;
    localMicStreamRef.current = null;
    videoRecorderRef.current = null;
    audioRecorderRef.current = null;
    videoChunksRef.current = [];
    audioChunksRef.current = [];
    setSpeaking(false);
    setGateStatus('idle');
    setGateMessage(null);
    setGateActive(false);
    gateActiveRef.current = false;
    voiceGateRequiredRef.current = false;
    gateLostHandledRef.current = false;
    deviceKeyRef.current = null;
    liveTranscriptionStopRef.current?.();
    liveTranscriptionStopRef.current = null;
  }, []);

  const handleGateLost = useCallback(() => {
    if (!voiceGateRequiredRef.current || gateLostHandledRef.current) return;
    gateLostHandledRef.current = true;

    setAlertDialog({
      title: 'Arduino disconnected',
      message:
        'The Arduino voice gate lost its connection. Recording has been stopped and will not continue without it.',
    });

    void stopRecordingRef.current?.();
  }, []);

  const startRecording = useCallback(async (useVoiceGate: boolean) => {
    if (!enabled || !scheduleId || status === 'recording' || status === 'starting') return false;

    setStatus('starting');
    setError(null);
    setSavedRecordingId(null);
    gateLostHandledRef.current = false;
    voiceGateRequiredRef.current = useVoiceGate;

    const startRes = await startMeetingRecording(scheduleId);
    if (startRes.error || !startRes.data?.recording_id) {
      setStatus('error');
      setError(startRes.error || 'Failed to start recording session');
      voiceGateRequiredRef.current = false;
      return false;
    }

    try {
      const [{ videoStream, meetingAudioStream, displayStream }, localMicStream] = await Promise.all([
        captureDisplayStream(),
        captureMicStream(),
      ]);

      displayStreamRef.current = displayStream;
      meetingAudioStreamRef.current = meetingAudioStream;
      localMicStreamRef.current = localMicStream;
      recordingIdRef.current = startRes.data.recording_id;
      videoChunksRef.current = [];
      audioChunksRef.current = [];

      const audioMix = await createMeetingAudioMix(meetingAudioStream, localMicStream, {
        gateLocalMic: useVoiceGate,
      });
      audioMixRef.current = audioMix;

      const videoMimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const audioMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const videoRecorder = new MediaRecorder(videoStream, { mimeType: videoMimeType });
      const audioRecorder = new MediaRecorder(audioMix.stream, { mimeType: audioMimeType });
      videoRecorderRef.current = videoRecorder;
      audioRecorderRef.current = audioRecorder;

      videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) videoChunksRef.current.push(event.data);
      };
      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      const handleFailure = () => {
        setStatus('error');
        setError('Recording failed');
        void cleanup();
      };

      videoRecorder.onerror = handleFailure;
      audioRecorder.onerror = handleFailure;

      videoStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (videoRecorderRef.current?.state === 'recording') {
          videoRecorderRef.current.stop();
        }
      });

      let latestGateMessage: string | null = null;
      let gateCleanup: () => Promise<void> = async () => {};
      let activeGate = false;

      if (useVoiceGate) {
        const gateResult = await startArduinoGate({
          onStatus: (nextStatus, message) => {
            setGateStatus(nextStatus);
            setGateMessage(message || null);
            if (message) latestGateMessage = message;
          },
          onSpeakingChange: (nextSpeaking) => {
            setSpeaking(nextSpeaking);
            audioMixRef.current?.setLocalMicOpen(nextSpeaking);
          },
          onDeviceKey: (key) => {
            deviceKeyRef.current = key;
          },
          onGateLost: handleGateLost,
        }, {
          optional: false,
          requestPortIfNeeded: true,
        });

        gateCleanup = gateResult.cleanup;
        activeGate = gateResult.gateActive;

        if (!activeGate) {
          await cleanup();
          setStatus('idle');
          setAlertDialog({
            title: 'Arduino required',
            message:
              latestGateMessage ||
              'Could not connect to the Arduino voice gate. Connect the device and try again, or choose "Record all audio".',
          });
          return false;
        }
      } else {
        setGateStatus('bypassed');
        setGateMessage(
          meetingAudioStream
            ? 'Meeting audio + full microphone (no voice gate).'
            : 'Full microphone only — enable "Share tab audio" to capture other participants.',
        );
      }

      gateCleanupRef.current = gateCleanup;
      gateActiveRef.current = activeGate;
      setGateActive(activeGate);

      if (!meetingAudioStream) {
        setGateMessage((prev) =>
          prev
            ? `${prev} Tab audio was not shared — other participants may be missing from transcription.`
            : 'Tab audio was not shared — other participants may be missing from transcription.',
        );
      } else if (useVoiceGate) {
        setGateMessage('Meeting audio always on. Your mic is gated by Arduino.');
      }

      startedAtRef.current = Date.now();
      videoRecorder.start(1000);
      audioRecorder.start(250);

      liveTranscriptionStopRef.current = startLiveTranscriptionChunks(
        scheduleId,
        audioMix.stream,
        { deviceKey: deviceKeyRef.current },
      );

      setStatus('recording');
      return true;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not start meeting recording.');
      await cleanup();
      return false;
    }
  }, [cleanup, enabled, handleGateLost, scheduleId, status]);

  const stopRecording = useCallback(async () => {
    const videoRecorder = videoRecorderRef.current;
    const audioRecorder = audioRecorderRef.current;
    const recordingId = recordingIdRef.current;
    if (!videoRecorder || !recordingId || videoRecorder.state === 'inactive') return null;

    setStatus('uploading');

    const videoBlob = await new Promise<Blob>((resolve, reject) => {
      videoRecorder.onstop = () => {
        resolve(new Blob(videoChunksRef.current, { type: videoRecorder.mimeType || 'video/webm' }));
      };
      videoRecorder.onerror = () => reject(new Error('Video recording failed'));
      videoRecorder.stop();
    });

    let audioBlob: Blob | null = null;
    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioBlob = await new Promise<Blob>((resolve, reject) => {
        audioRecorder.onstop = () => {
          resolve(new Blob(audioChunksRef.current, { type: audioRecorder.mimeType || 'audio/webm' }));
        };
        audioRecorder.onerror = () => reject(new Error('Audio recording failed'));
        audioRecorder.stop();
      });
    }

    await cleanup();

    const durationMs = Math.max(0, Date.now() - startedAtRef.current);
    const hasAudio = Boolean(audioBlob && audioBlob.size > 0);
    const uploadRes = await completeMeetingRecording(
      scheduleId,
      recordingId,
      videoBlob,
      durationMs,
      hasAudio ? audioBlob : null,
    );

    if (uploadRes.error || !uploadRes.data) {
      setStatus('error');
      setError(uploadRes.error || 'Failed to upload recording');
      return null;
    }

    setStatus('done');
    setSavedRecordingId(recordingId);
    return { recordingId, durationMs };
  }, [cleanup, scheduleId]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const promptStartRecording = useCallback(() => {
    if (!enabled || status === 'recording' || status === 'starting' || status === 'uploading') return;
    setStartDialogOpen(true);
  }, [enabled, status]);

  const cancelStartDialog = useCallback(() => {
    setStartDialogOpen(false);
  }, []);

  const confirmStartRecording = useCallback(async (useVoiceGate: boolean) => {
    setStartDialogOpen(false);
    return startRecording(useVoiceGate);
  }, [startRecording]);

  const dismissAlert = useCallback(() => {
    setAlertDialog(null);
    if (status === 'done' || status === 'error') {
      setStatus('idle');
      setError(null);
    }
  }, [status]);

  const dismissSaved = useCallback(() => {
    setSavedRecordingId(null);
    setStatus('idle');
  }, []);

  return {
    status,
    error,
    savedRecordingId,
    gateStatus,
    gateMessage,
    gateActive,
    speaking,
    startDialogOpen,
    alertDialog,
    isRecording: status === 'recording',
    canRecord: enabled,
    promptStartRecording,
    confirmStartRecording,
    cancelStartDialog,
    dismissAlert,
    startRecording,
    stopRecording,
    dismissSaved,
  };
}
