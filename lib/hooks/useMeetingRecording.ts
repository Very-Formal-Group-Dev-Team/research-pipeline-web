'use client';

import { useCallback, useRef, useState } from 'react';

import { completeMeetingRecording, startMeetingRecording } from '@/lib/api/recordings';
import { startArduinoGate, type ArduinoGateStatus } from '@/lib/transcriptions/arduinoGate';

export type MeetingRecordingStatus = 'idle' | 'starting' | 'recording' | 'uploading' | 'done' | 'error';

async function captureVideoStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Recording is not supported in this browser.');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: 15,
      displaySurface: 'browser',
    },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    monitorTypeSurfaces: 'exclude',
    systemAudio: 'exclude',
  });

  if (!stream.getVideoTracks().length) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('Could not capture the meeting video stream.');
  }

  return stream;
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
  const [speaking, setSpeaking] = useState(false);
  const [savedRecordingId, setSavedRecordingId] = useState<string | null>(null);

  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const gateCleanupRef = useRef<(() => Promise<void>) | null>(null);

  const cleanup = useCallback(async () => {
    if (gateCleanupRef.current) {
      await gateCleanupRef.current();
      gateCleanupRef.current = null;
    }

    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;
    audioStreamRef.current = null;
    videoRecorderRef.current = null;
    audioRecorderRef.current = null;
    videoChunksRef.current = [];
    audioChunksRef.current = [];
    setSpeaking(false);
    setGateStatus('idle');
    setGateMessage(null);
  }, []);

  const startRecording = useCallback(async () => {
    if (!enabled || !scheduleId || status === 'recording' || status === 'starting') return false;

    setStatus('starting');
    setError(null);
    setSavedRecordingId(null);

    const startRes = await startMeetingRecording(scheduleId);
    if (startRes.error || !startRes.data?.recording_id) {
      setStatus('error');
      setError(startRes.error || 'Failed to start recording session');
      return false;
    }

    try {
      const [videoStream, audioStream] = await Promise.all([
        captureVideoStream(),
        captureMicStream(),
      ]);

      videoStreamRef.current = videoStream;
      audioStreamRef.current = audioStream;
      recordingIdRef.current = startRes.data.recording_id;
      videoChunksRef.current = [];
      audioChunksRef.current = [];

      const videoMimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const audioMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const videoRecorder = new MediaRecorder(videoStream, { mimeType: videoMimeType });
      const audioRecorder = new MediaRecorder(audioStream, { mimeType: audioMimeType });
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

      gateCleanupRef.current = await startArduinoGate({
        onStatus: (nextStatus, message) => {
          setGateStatus(nextStatus);
          setGateMessage(message || null);
        },
        onSpeakingChange: (nextSpeaking) => {
          setSpeaking(nextSpeaking);
          const recorder = audioRecorderRef.current;
          if (!recorder || recorder.state === 'inactive') return;

          if (nextSpeaking && recorder.state === 'paused') {
            recorder.resume();
          } else if (!nextSpeaking && recorder.state === 'recording') {
            recorder.pause();
          }
        },
      }, { requestPortIfNeeded: true });

      startedAtRef.current = Date.now();
      videoRecorder.start(1000);
      audioRecorder.start(250);
      audioRecorder.pause();

      setStatus('recording');
      return true;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not start meeting recording.');
      await cleanup();
      return false;
    }
  }, [cleanup, enabled, scheduleId, status]);

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
        if (audioRecorder.state === 'paused') {
          audioRecorder.resume();
        }
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
    speaking,
    isRecording: status === 'recording',
    canRecord: enabled,
    startRecording,
    stopRecording,
    dismissSaved,
  };
}
