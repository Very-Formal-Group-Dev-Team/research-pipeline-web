/**
 * Meeting/defense recording and archived transcription API.
 */

import { del, get, patch, post, put } from './client';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface MeetingRecordingSummary {
  id: string;
  schedule_id: string;
  schedule_source: 'defense' | 'meeting';
  file_url?: string | null;
  audio_url?: string | null;
  file_size?: number | null;
  duration_ms?: number | null;
  mime_type?: string;
  display_name?: string | null;
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

export interface TranscriptionEditSpeaker {
  id: string;
  name: string;
  color: string;
}

export interface TranscriptionEditLine {
  id: string;
  text: string;
  speaker_id: string | null;
  start_ms?: number | null;
  end_ms?: number | null;
}

export interface TranscriptionEditContent {
  speakers: TranscriptionEditSpeaker[];
  lines: TranscriptionEditLine[];
}

export interface TranscriptionEditResponse {
  recording_id: string;
  can_edit: boolean;
  edit: {
    id: string;
    edited_by: string;
    created_at: string;
    updated_at: string;
  } | null;
  content: TranscriptionEditContent;
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
  return del<{ deleted: boolean; recording_id: string; soft_deleted?: boolean }>(
    `/defenses/${scheduleId}/recordings/${recordingId}`,
  );
}

export function restoreMeetingRecording(scheduleId: string, recordingId: string) {
  return patch<{ restored: boolean; recording_id: string }>(
    `/defenses/${scheduleId}/recordings/${recordingId}/restore`,
  );
}

export function purgeMeetingRecording(scheduleId: string, recordingId: string) {
  return del<{ purged: boolean; recording_id: string }>(
    `/defenses/${scheduleId}/recordings/${recordingId}/purge`,
  );
}

export function renameMeetingRecording(
  scheduleId: string,
  recordingId: string,
  displayName: string,
) {
  return patch<{ recording_id: string; display_name: string }>(
    `/defenses/${scheduleId}/recordings/${recordingId}`,
    { display_name: displayName },
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

export function getTranscriptionEdit(scheduleId: string, recordingId: string) {
  return get<TranscriptionEditResponse>(`/defenses/${scheduleId}/recordings/${recordingId}/transcription-edit`);
}

export function saveTranscriptionEdit(
  scheduleId: string,
  recordingId: string,
  content: TranscriptionEditContent,
) {
  return put<{ recording_id: string; edit_id: string | null; content: TranscriptionEditContent }>(
    `/defenses/${scheduleId}/recordings/${recordingId}/transcription-edit`,
    content,
  );
}

export function mergeTranscriptionLines(
  scheduleId: string,
  recordingId: string,
  lineIds: string[],
  speakers?: TranscriptionEditSpeaker[],
) {
  return post<{ recording_id: string; merged_id: string; content: TranscriptionEditContent }>(
    `/defenses/${scheduleId}/recordings/${recordingId}/transcription-edit/merge`,
    { line_ids: lineIds, ...(speakers ? { speakers } : {}) },
  );
}

export function assignTranscriptionSpeaker(
  scheduleId: string,
  recordingId: string,
  lineIds: string[],
  speakerId: string,
  speakers?: TranscriptionEditSpeaker[],
) {
  return post<{ recording_id: string; speaker_id: string; assigned_count: number; content: TranscriptionEditContent }>(
    `/defenses/${scheduleId}/recordings/${recordingId}/transcription-edit/assign`,
    { line_ids: lineIds, speaker_id: speakerId, ...(speakers ? { speakers } : {}) },
  );
}

export function getTranscriptionEditDownloadUrl(scheduleId: string, recordingId: string): string {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
  return `${API_BASE_URL}/defenses/${encodeURIComponent(scheduleId)}/recordings/${encodeURIComponent(recordingId)}/transcription-edit/download`;
}

export async function downloadEditedTranscription(
  scheduleId: string,
  recordingId: string,
  filename = 'edited-transcription.txt',
): Promise<{ ok: boolean; error?: string }> {
  try {
    const tokenMatch = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
    const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(getTranscriptionEditDownloadUrl(scheduleId, recordingId), {
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
