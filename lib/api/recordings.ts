/**
 * Meeting/defense recording and archived transcription API.
 */

import { del, get, post } from './client';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface MeetingRecordingSummary {
  id: string;
  schedule_id: string;
  schedule_source: 'defense' | 'meeting';
  file_url?: string | null;
  file_size?: number | null;
  duration_ms?: number | null;
  mime_type?: string;
  recorded_by?: string;
  recorded_at: string;
  ended_at?: string | null;
  status: 'recording' | 'completed' | 'failed';
  transcription_status?: TranscriptionStatus;
  transcription_error?: string | null;
  transcription_id?: string | null;
  transcribed_at?: string | null;
  project_title?: string | null;
  project_code?: string | null;
  defense_type?: string | null;
  meeting_title?: string | null;
  scheduled_at?: string | null;
  can_delete?: boolean;
  can_manage?: boolean;
}

export interface TranscriptionArchiveSegment {
  id: string;
  text: string;
  start_ms?: number | null;
  end_ms?: number | null;
  created_at: string;
}

export interface TranscriptionArchive {
  id: string;
  full_text: string;
  language?: string | null;
  transcribed_at: string;
}

export interface RecordingDetailResponse {
  recording: MeetingRecordingSummary;
  transcription: TranscriptionArchive | null;
  segments: TranscriptionArchiveSegment[];
}

export function recordingMediaUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  return `${API_ORIGIN}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}

export function startMeetingRecording(scheduleId: string) {
  return post<{ recording_id: string; schedule_id: string; status: string }>(
    `/defenses/${scheduleId}/recordings/start`,
  );
}

export async function completeMeetingRecording(
  scheduleId: string,
  recordingId: string,
  videoBlob: Blob,
  durationMs: number,
  audioBlob?: Blob | null,
): Promise<{ data: { recording_id: string; transcription_status?: TranscriptionStatus } | null; error: string | null; status: number }> {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
  const tokenMatch = typeof document !== 'undefined'
    ? document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/)
    : null;
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  const form = new FormData();
  form.append('recording', videoBlob, 'meeting-recording.webm');
  if (audioBlob && audioBlob.size > 0) {
    form.append('audio', audioBlob, 'meeting-audio.webm');
  }
  form.append('duration_ms', String(durationMs));

  try {
    const res = await fetch(
      `${API_BASE_URL}/defenses/${encodeURIComponent(scheduleId)}/recordings/${encodeURIComponent(recordingId)}/complete`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: form,
      },
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: body?.error || res.statusText, status: res.status };
    }
    return { data: body, error: null, status: res.status };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Upload failed',
      status: 0,
    };
  }
}

export function transcribeMeetingRecording(scheduleId: string, recordingId: string) {
  return post<{ transcription_id: string; full_text: string; transcription_status?: TranscriptionStatus }>(
    `/defenses/${scheduleId}/recordings/${recordingId}/transcribe`,
  );
}

export function deleteMeetingRecording(scheduleId: string, recordingId: string) {
  return del<{ deleted: boolean; recording_id: string }>(
    `/defenses/${scheduleId}/recordings/${recordingId}`,
  );
}

export function getMyMeetingRecordings() {
  return get<{ recordings: MeetingRecordingSummary[] }>('/defenses/recordings/mine');
}

export function getScheduleRecordings(scheduleId: string) {
  return get<{
    schedule_id: string;
    project_title?: string | null;
    project_code?: string | null;
    recordings: MeetingRecordingSummary[];
  }>(`/defenses/${scheduleId}/recordings`);
}

export function getRecordingDetail(scheduleId: string, recordingId: string) {
  return get<RecordingDetailResponse>(`/defenses/${scheduleId}/recordings/${recordingId}`);
}
