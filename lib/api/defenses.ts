/**
 * Defenses API service.
 */

import { get, patch, post } from './client';

export interface Defense {
  id: string;
  project_id: string;
  project_title: string;
  project_code: string;
  defense_type: 'proposal' | 'midterm' | 'final';
  meeting_title?: string | null;
  start_time: string;
  end_time: string | null;
  location: string;
  modality?: string | null;
  status: string;
  created_by: string;
  created_by_name?: string;
  adviser_name?: string;
  venue?: string | null;
  status_label?: string;
  scheduled_at?: string;
  created_at: string;
  meeting_room?: string | null;
  meeting_url?: string | null;
  meeting_provider?: string | null;
  schedule_source?: 'defense' | 'meeting';
}

export interface CreateDefensePayload {
  project_id: string;
  defense_type: string;
  meeting_title: string;
  start_time: string;
  end_time?: string;
  location: string;
  modality: string;
}

export type UpdateMeetingPayload = CreateDefensePayload;

/** Fetch defenses created by the current user (adviser view). */
export function getMyDefenses() {
  return get<Defense[]>('/defenses/me');
}

/** Fetch defense schedules for all projects the current user is a member of. */
export function getMyProjectDefenses() {
  return get<Defense[]>('/defenses/my-projects');
}

/** Fetch adviser meetings booked for a specific project. */
export async function getProjectMeetings(projectId: string) {
  const normalizedId = projectId.trim();
  const [primary, fallback] = await Promise.all([
    get<Defense[]>(`/defenses/project/${normalizedId}`),
    get<Defense[]>(`/projects/${normalizedId}/meetings`),
  ]);

  const byId = new Map<string, Defense>();
  for (const row of [...(primary.data || []), ...(fallback.data || [])]) {
    if (row?.id) byId.set(row.id, row);
  }

  const merged = Array.from(byId.values());
  if (merged.length > 0) {
    return { data: merged };
  }

  if (primary.error && fallback.error) {
    return { error: primary.error || fallback.error };
  }

  return { data: [] };
}

/** Normalize API rows that may use scheduled_at instead of start_time. */
export function normalizeDefenseSchedule<T extends Defense & { scheduled_at?: string }>(
  row: T,
): Defense {
  const start = row.start_time || row.scheduled_at || '';
  return {
    ...row,
    start_time: start,
    end_time: row.end_time || start || null,
    venue: row.venue || row.location || null,
  };
}

/** Create a new defense schedule. */
export function createDefense(payload: CreateDefensePayload) {
  return post<Defense>('/defenses', payload);
}

export function getMeeting(meetingId: string) {
  return get<Defense>(`/defenses/${meetingId}`);
}

export function updateMeeting(meetingId: string, payload: UpdateMeetingPayload) {
  return patch<{ success: boolean; defense: Defense }>(`/defenses/${meetingId}`, payload);
}

export function cancelMeeting(meetingId: string) {
  return patch<{ success: boolean; defense: Defense }>(`/defenses/${meetingId}/cancel`);
}

export function completeMeeting(meetingId: string) {
  return patch<{ success: boolean; defense: Defense }>(`/defenses/${meetingId}/complete`);
}

export function restoreMeeting(meetingId: string) {
  return patch<{ success: boolean; defense: Defense }>(`/defenses/${meetingId}/restore`);
}
