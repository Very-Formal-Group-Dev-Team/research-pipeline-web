import { startArduinoGate } from '@/lib/transcriptions/arduinoGate';
import { createMeetingAudioMix, type MeetingAudioMixHandle } from '@/lib/transcriptions/meetingAudioMix';
import { recordAudioChunk } from '@/lib/transcriptions/liveTranscriptionChunks';
import { uploadTranscriptionChunk } from '@/lib/transcriptions/uploadChunk';

export type BrowserCaptureStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'recording'
  | 'uploading'
  | 'needs_serial'
  | 'bypassed'
  | 'unsupported'
  | 'error';

export interface BrowserRoomCaptureCallbacks {
  onStatus: (status: BrowserCaptureStatus, message?: string) => void;
  onSpeakingChange: (speaking: boolean) => void;
}

export interface BrowserRoomCaptureOptions {
  chunkMs?: number;
  requestPortIfNeeded?: boolean;
  /** When true, transcription works without Arduino (full mic + meeting audio). */
  optionalGate?: boolean;
  /** Tab/meeting audio for remote participants — always included in chunks. */
  meetingAudioStream?: MediaStream | null;
  onGateLost?: () => void;
}

export async function startBrowserRoomCapture(
  scheduleId: string,
  callbacks: BrowserRoomCaptureCallbacks,
  options: BrowserRoomCaptureOptions = {},
): Promise<() => Promise<void>> {
  const chunkMs = options.chunkMs ?? 5000;
  let stopped = false;
  let deviceKey: string | null = null;
  let recording = false;
  let localMicStream: MediaStream | null = null;
  let audioMix: MeetingAudioMixHandle | null = null;
  let gateCleanup: (() => Promise<void>) | null = null;
  let gateActive = false;

  const cleanup = async () => {
    stopped = true;
    if (gateCleanup) {
      await gateCleanup();
      gateCleanup = null;
    }
    if (audioMix) {
      await audioMix.close();
      audioMix = null;
    }
    localMicStream?.getTracks().forEach((track) => track.stop());
    localMicStream = null;
  };

  if (!navigator.mediaDevices?.getUserMedia) {
    callbacks.onStatus('unsupported', 'Use Chrome/Edge on the room PC for in-browser capture.');
    return cleanup;
  }

  callbacks.onStatus('starting');

  try {
    localMicStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const useVoiceGate = options.optionalGate !== true;
    let latestGateMessage: string | null = null;

    audioMix = await createMeetingAudioMix(
      options.meetingAudioStream ?? null,
      localMicStream,
      { gateLocalMic: useVoiceGate },
    );

    if (useVoiceGate) {
      if (!('serial' in navigator)) {
        callbacks.onStatus('unsupported', 'Arduino gate requires Chrome or Edge with Web Serial.');
        await cleanup();
        return cleanup;
      }

      const gateResult = await startArduinoGate({
        onStatus: (status, message) => {
          if (message) latestGateMessage = message;
          if (status === 'connected') {
            callbacks.onStatus('listening', 'Meeting audio always on. Your mic is gated by Arduino.');
          }
        },
        onSpeakingChange: (speaking) => {
          callbacks.onSpeakingChange(speaking);
          audioMix?.setLocalMicOpen(speaking);
        },
        onDeviceKey: (key) => {
          deviceKey = key;
        },
        onGateLost: () => {
          options.onGateLost?.();
        },
      }, {
        optional: false,
        requestPortIfNeeded: options.requestPortIfNeeded ?? true,
      });

      gateCleanup = gateResult.cleanup;
      gateActive = gateResult.gateActive;

      if (!gateActive) {
        await cleanup();
        callbacks.onStatus(
          'needs_serial',
          latestGateMessage || 'Connect the Arduino USB port to gate your microphone.',
        );
        return cleanup;
      }
    } else {
      callbacks.onStatus(
        'bypassed',
        options.meetingAudioStream
          ? 'Transcribing meeting audio and full microphone.'
          : 'Transcribing full microphone (share tab audio to include other participants).',
      );
      callbacks.onSpeakingChange(true);
    }

    const captureLoop = async () => {
      while (!stopped && audioMix) {
        if (!recording) {
          recording = true;
          callbacks.onStatus('recording');
          try {
            const blob = await recordAudioChunk(audioMix.stream, chunkMs);
            if (!stopped && blob.size > 0) {
              callbacks.onStatus('uploading');
              const result = await uploadTranscriptionChunk(scheduleId, blob, deviceKey);
              if (!result.ok) {
                callbacks.onStatus('error', result.error || 'Transcription upload failed');
              }
            }
          } catch (err) {
            callbacks.onStatus(
              'error',
              err instanceof Error ? err.message : 'Capture failed',
            );
          } finally {
            recording = false;
            if (!stopped) {
              callbacks.onStatus(gateActive ? 'listening' : 'bypassed');
            }
          }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 200));
      }
    };

    if (gateActive) {
      callbacks.onStatus('listening');
    }

    void captureLoop();
  } catch (err) {
    callbacks.onStatus('error', err instanceof Error ? err.message : 'Failed to start capture');
    await cleanup();
  }

  return cleanup;
}

export async function requestBrowserSerialPort(): Promise<boolean> {
  if (!('serial' in navigator)) return false;
  const port = await navigator.serial.requestPort();
  return Boolean(port);
}
