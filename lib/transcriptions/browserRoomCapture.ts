import { uploadTranscriptionChunk } from '@/lib/transcriptions/uploadChunk';

export type BrowserCaptureStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'recording'
  | 'uploading'
  | 'needs_serial'
  | 'unsupported'
  | 'error';

interface GatePayload {
  device?: string;
  speaking?: boolean | string | number;
}

export interface BrowserRoomCaptureCallbacks {
  onStatus: (status: BrowserCaptureStatus, message?: string) => void;
  onSpeakingChange: (speaking: boolean) => void;
}

const SERIAL_BUSY_MESSAGE =
  'Serial port is in use. Close Arduino Serial Monitor and stop mic-audio-bridge.py or transcription-local-agent.py on this PC, then click Connect Arduino.';

function parseGateLine(line: string): GatePayload | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    return JSON.parse(trimmed) as GatePayload;
  } catch {
    return null;
  }
}

function isSpeakingValue(value: GatePayload['speaking']): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

async function openSerialPort(): Promise<SerialPort | null> {
  if (!('serial' in navigator)) return null;

  const ports = await navigator.serial.getPorts();
  if (ports.length > 0) {
    return ports[0];
  }

  return null;
}

async function requestSerialPort(): Promise<SerialPort | null> {
  if (!('serial' in navigator)) return null;
  return navigator.serial.requestPort();
}

async function ensureSerialPortOpen(port: SerialPort): Promise<void> {
  if (port.readable) {
    return;
  }

  try {
    await port.open({ baudRate: 115200 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Failed to open serial port';
    throw new Error(`${detail}. ${SERIAL_BUSY_MESSAGE}`);
  }
}

async function closeSerialPort(
  port: SerialPort | null,
  reader: ReadableStreamDefaultReader<string> | null,
): Promise<void> {
  if (reader) {
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }

  if (port?.readable) {
    try {
      await port.close();
    } catch {
      // ignore
    }
  }
}

function recordAudioChunk(stream: MediaStream, durationMs: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error('Recording failed'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));

    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, durationMs);
  });
}

export async function startBrowserRoomCapture(
  scheduleId: string,
  callbacks: BrowserRoomCaptureCallbacks,
  options: { chunkMs?: number; requestPortIfNeeded?: boolean } = {},
): Promise<() => Promise<void>> {
  const chunkMs = options.chunkMs ?? 5000;
  let stopped = false;
  let speaking = false;
  let deviceKey: string | null = null;
  let recording = false;
  let mediaStream: MediaStream | null = null;
  let serialPort: SerialPort | null = null;
  let reader: ReadableStreamDefaultReader<string> | null = null;

  const cleanup = async () => {
    stopped = true;
    await closeSerialPort(serialPort, reader);
    reader = null;
    serialPort = null;
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  };

  if (!('serial' in navigator) || !navigator.mediaDevices?.getUserMedia) {
    callbacks.onStatus('unsupported', 'Use Chrome/Edge on the room PC for in-browser capture.');
    return cleanup;
  }

  callbacks.onStatus('starting');

  try {
    serialPort = await openSerialPort();
    if (!serialPort && options.requestPortIfNeeded) {
      serialPort = await requestSerialPort();
    }
    if (!serialPort) {
      callbacks.onStatus('needs_serial', 'Connect the Arduino USB port once to enable auto transcription.');
      return cleanup;
    }

    await ensureSerialPortOpen(serialPort);

    const textDecoder = new TextDecoderStream();
    const readable = serialPort.readable?.pipeThrough(
      textDecoder as unknown as ReadableWritablePair<string, Uint8Array>,
    );
    if (!readable) {
      callbacks.onStatus('error', 'Could not read from Arduino serial port.');
      await cleanup();
      return cleanup;
    }

    reader = readable.getReader();
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    callbacks.onStatus('listening');

    const readSerial = async () => {
      let buffer = '';
      while (!stopped && reader) {
        const { value, done } = await reader.read();
        if (done || stopped) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const payload = parseGateLine(line);
          if (!payload) continue;
          speaking = isSpeakingValue(payload.speaking);
          if (typeof payload.device === 'string' && payload.device.trim()) {
            deviceKey = payload.device.trim();
          }
          callbacks.onSpeakingChange(speaking);
        }
      }
    };

    const captureLoop = async () => {
      while (!stopped) {
        if (speaking && !recording && mediaStream) {
          recording = true;
          callbacks.onStatus('recording');
          try {
            const blob = await recordAudioChunk(mediaStream, chunkMs);
            if (!stopped && blob.size > 0) {
              callbacks.onStatus('uploading');
              await uploadTranscriptionChunk(scheduleId, blob, deviceKey);
            }
          } catch (err) {
            callbacks.onStatus(
              'error',
              err instanceof Error ? err.message : 'Capture failed',
            );
          } finally {
            recording = false;
            if (!stopped) callbacks.onStatus('listening');
          }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 200));
      }
    };

    void readSerial().catch(() => {
      if (!stopped) {
        callbacks.onStatus('error', `Serial connection lost. ${SERIAL_BUSY_MESSAGE}`);
      }
    });
    void captureLoop();
  } catch (err) {
    callbacks.onStatus('error', err instanceof Error ? err.message : 'Failed to start capture');
    await cleanup();
  }

  return cleanup;
}

export async function requestBrowserSerialPort(): Promise<boolean> {
  const port = await requestSerialPort();
  return Boolean(port);
}
