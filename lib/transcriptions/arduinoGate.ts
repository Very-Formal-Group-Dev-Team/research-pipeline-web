export type ArduinoGateStatus = 'idle' | 'connecting' | 'connected' | 'needs_serial' | 'unsupported' | 'error';

interface GatePayload {
  device?: string;
  speaking?: boolean | string | number;
}

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
  return ports.length > 0 ? ports[0] : null;
}

export async function requestArduinoSerialPort(): Promise<boolean> {
  if (!('serial' in navigator)) return false;
  const port = await navigator.serial.requestPort();
  return Boolean(port);
}

async function ensureSerialPortOpen(port: SerialPort): Promise<void> {
  if (port.readable) return;
  await port.open({ baudRate: 115200 });
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

export interface ArduinoGateCallbacks {
  onStatus?: (status: ArduinoGateStatus, message?: string) => void;
  onSpeakingChange: (speaking: boolean) => void;
}

export async function startArduinoGate(
  callbacks: ArduinoGateCallbacks,
  options: { requestPortIfNeeded?: boolean } = {},
): Promise<() => Promise<void>> {
  let stopped = false;
  let serialPort: SerialPort | null = null;
  let reader: ReadableStreamDefaultReader<string> | null = null;

  const cleanup = async () => {
    stopped = true;
    await closeSerialPort(serialPort, reader);
    reader = null;
    serialPort = null;
    callbacks.onStatus?.('idle');
  };

  if (!('serial' in navigator)) {
    callbacks.onStatus?.('unsupported', 'Arduino gate requires Chrome or Edge with Web Serial.');
    return cleanup;
  }

  callbacks.onStatus?.('connecting');

  try {
    serialPort = await openSerialPort();
    if (!serialPort && options.requestPortIfNeeded) {
      serialPort = await navigator.serial.requestPort();
    }
    if (!serialPort) {
      callbacks.onStatus?.('needs_serial', 'Connect the Arduino USB port to gate voice recording.');
      return cleanup;
    }

    await ensureSerialPortOpen(serialPort);
    const textDecoder = new TextDecoderStream();
    const readable = serialPort.readable?.pipeThrough(
      textDecoder as unknown as ReadableWritablePair<string, Uint8Array>,
    );
    if (!readable) {
      callbacks.onStatus?.('error', 'Could not read from Arduino serial port.');
      await cleanup();
      return cleanup;
    }

    reader = readable.getReader();
    callbacks.onStatus?.('connected');

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
          callbacks.onSpeakingChange(isSpeakingValue(payload.speaking));
        }
      }
    };

    void readSerial().catch(() => {
      if (!stopped) {
        callbacks.onStatus?.('error', 'Arduino serial connection lost.');
      }
    });
  } catch (err) {
    callbacks.onStatus?.(
      'error',
      err instanceof Error ? err.message : 'Failed to connect Arduino gate',
    );
    await cleanup();
  }

  return cleanup;
}
