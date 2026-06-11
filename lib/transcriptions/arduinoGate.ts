export type ArduinoGateStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'bypassed'
  | 'needs_serial'
  | 'unsupported'
  | 'error';

export interface ArduinoGateResult {
  cleanup: () => Promise<void>;
  gateActive: boolean;
}

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
  onGateLost?: () => void;
  onDeviceKey?: (deviceKey: string) => void;
}

export async function startArduinoGate(
  callbacks: ArduinoGateCallbacks,
  options: { requestPortIfNeeded?: boolean; optional?: boolean } = {},
): Promise<ArduinoGateResult> {
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

  const bypassGate = (message: string): ArduinoGateResult => {
    callbacks.onStatus?.('bypassed', message);
    callbacks.onSpeakingChange(true);
    return { cleanup, gateActive: false };
  };

  if (!('serial' in navigator)) {
    if (options.optional) {
      return bypassGate('Web Serial unavailable — recording all audio.');
    }
    callbacks.onStatus?.('unsupported', 'Arduino gate requires Chrome or Edge with Web Serial.');
    return { cleanup, gateActive: false };
  }

  callbacks.onStatus?.('connecting');

  try {
    serialPort = await openSerialPort();
    if (!serialPort && options.requestPortIfNeeded && !options.optional) {
      serialPort = await navigator.serial.requestPort();
    }
    if (!serialPort) {
      if (options.optional) {
        return bypassGate('No Arduino connected — recording all audio.');
      }
      callbacks.onStatus?.('needs_serial', 'Connect the Arduino USB port to gate voice recording.');
      return { cleanup, gateActive: false };
    }

    await ensureSerialPortOpen(serialPort);
    const textDecoder = new TextDecoderStream();
    const readable = serialPort.readable?.pipeThrough(
      textDecoder as unknown as ReadableWritablePair<string, Uint8Array>,
    );
    if (!readable) {
      if (options.optional) {
        return bypassGate('Could not read Arduino — recording all audio.');
      }
      callbacks.onStatus?.('error', 'Could not read from Arduino serial port.');
      await cleanup();
      return { cleanup, gateActive: false };
    }

    reader = readable.getReader();
    callbacks.onStatus?.('connected');

    const notifyGateLost = () => {
      if (stopped) return;
      if (options.optional) {
        callbacks.onStatus?.('bypassed', 'Arduino disconnected — recording all audio.');
        callbacks.onSpeakingChange(true);
        return;
      }
      callbacks.onStatus?.('error', 'Arduino serial connection lost.');
      callbacks.onGateLost?.();
    };

    const readSerial = async () => {
      let buffer = '';
      while (!stopped && reader) {
        const { value, done } = await reader.read();
        if (stopped) break;
        if (done) {
          notifyGateLost();
          break;
        }
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const payload = parseGateLine(line);
          if (!payload) continue;
          if (typeof payload.device === 'string' && payload.device.trim()) {
            callbacks.onDeviceKey?.(payload.device.trim());
          }
          callbacks.onSpeakingChange(isSpeakingValue(payload.speaking));
        }
      }
    };

    void readSerial().catch(() => {
      if (!stopped) {
        notifyGateLost();
      }
    });

    return { cleanup, gateActive: true };
  } catch (err) {
    if (options.optional) {
      return bypassGate(
        err instanceof Error
          ? `${err.message} — recording all audio.`
          : 'Arduino unavailable — recording all audio.',
      );
    }
    callbacks.onStatus?.(
      'error',
      err instanceof Error ? err.message : 'Failed to connect Arduino gate',
    );
    await cleanup();
    return { cleanup, gateActive: false };
  }
}
