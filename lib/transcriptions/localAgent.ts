const AGENT_BASE_URL = (
  process.env.NEXT_PUBLIC_TRANSCRIPTION_AGENT_URL || 'http://127.0.0.1:8765'
).replace(/\/+$/, '');

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchAgent(path: string, init?: RequestInit, timeoutMs = 2500): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${AGENT_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function isLocalTranscriptionAgentRunning(): Promise<boolean> {
  const res = await fetchAgent('/health', { method: 'GET' }, 1500);
  if (!res?.ok) return false;

  try {
    const body = await res.json();
    return Boolean(body?.bridge?.running);
  } catch {
    return false;
  }
}

export async function startLocalTranscriptionAgent(scheduleId: string): Promise<boolean> {
  const sessionToken = getSessionToken();
  if (!sessionToken) return false;

  const res = await fetchAgent('/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schedule_id: scheduleId,
      session_token: sessionToken,
      api_url: API_BASE_URL,
    }),
  });

  return Boolean(res?.ok);
}

export async function stopLocalTranscriptionAgent(): Promise<void> {
  await fetchAgent(
    '/stop',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    },
    1500,
  );
}
