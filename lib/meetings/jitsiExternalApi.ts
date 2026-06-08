import { getJitsiBaseUrl } from '@/lib/meetings/jitsi';

export interface JitsiRoomTarget {
  domain: string;
  roomName: string;
}

export function parseJitsiJoinUrl(joinUrl: string): JitsiRoomTarget | null {
  try {
    const parsed = new URL(joinUrl);
    const roomName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    if (!roomName) return null;
    return {
      domain: parsed.host,
      roomName,
    };
  } catch {
    return null;
  }
}

let jitsiScriptPromise: Promise<void> | null = null;

export function loadJitsiExternalApiScript(baseUrl = getJitsiBaseUrl()): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Jitsi API can only load in the browser'));
  }

  if (window.JitsiMeetExternalAPI) {
    return Promise.resolve();
  }

  if (!jitsiScriptPromise) {
    jitsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${baseUrl.replace(/\/+$/, '')}/external_api.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        jitsiScriptPromise = null;
        reject(new Error('Failed to load Jitsi external API'));
      };
      document.body.appendChild(script);
    });
  }

  return jitsiScriptPromise;
}
