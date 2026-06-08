declare class JitsiMeetExternalAPI {
  constructor(domain: string, options: Record<string, unknown>);
  addListener(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
  dispose(): void;
  executeCommand(command: string, ...args: unknown[]): void;
}

interface Window {
  JitsiMeetExternalAPI?: typeof JitsiMeetExternalAPI;
}

interface DisplayMediaStreamOptions extends MediaStreamConstraints {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  monitorTypeSurfaces?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
}
