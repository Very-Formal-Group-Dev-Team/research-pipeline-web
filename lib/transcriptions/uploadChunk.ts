const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export interface UploadTranscriptionChunkResult {
  ok: boolean;
  transcribed?: boolean;
  text?: string;
  reason?: string;
  error?: string;
}

export async function uploadTranscriptionChunk(
  scheduleId: string,
  audioBlob: Blob,
  deviceKey?: string | null,
): Promise<UploadTranscriptionChunkResult> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Not signed in' };
  }

  const form = new FormData();
  form.append('schedule_id', scheduleId);
  form.append('audio', audioBlob, 'chunk.webm');
  if (deviceKey) {
    form.append('device_key', deviceKey);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/mic/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: form,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body?.error || res.statusText };
    }

    return {
      ok: true,
      transcribed: Boolean(body.transcribed),
      text: body.text,
      reason: body.reason,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}
