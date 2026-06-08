/**
 * Meeting/defense transcription API service.
 */

import { get } from './client';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

export interface TranscriptionSegment {
  id: string;
  text: string;
  device_key?: string | null;
  start_ms?: number | null;
  end_ms?: number | null;
  created_at: string;
}

export interface MeetingTranscription {
  schedule_id: string;
  schedule_source: 'defense' | 'meeting';
  project_title?: string | null;
  project_code?: string | null;
  segments: TranscriptionSegment[];
  full_text: string;
  segment_count: number;
}

export function getMeetingTranscription(scheduleId: string) {
  return get<MeetingTranscription>(`/defenses/${scheduleId}/transcription`);
}

export function getTranscriptionDownloadUrl(scheduleId: string): string {
  return `${API_BASE_URL}/defenses/${encodeURIComponent(scheduleId)}/transcription/download`;
}

export async function downloadMeetingTranscription(
  scheduleId: string,
  filename = 'transcription.txt',
): Promise<{ ok: boolean; error?: string }> {
  try {
    const tokenMatch = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
    const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(getTranscriptionDownloadUrl(scheduleId), {
      credentials: 'include',
      headers,
    });

    if (!res.ok) {
      return { ok: false, error: 'Download failed' };
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Download failed' };
  }
}
