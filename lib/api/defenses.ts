/**
 * Defenses API service.
 */

import { get, post } from './client';

export interface Defense {
  id: string;
  project_id: string;
  project_title: string;
  project_code: string;
  defense_type: 'proposal' | 'midterm' | 'final';
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
  start_time: string;
  end_time?: string;
  location: string;
  modality: string;
}

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
  const primary = await get<Defense[]>(`/defenses/project/${projectId}`);
  if (primary.data && primary.data.length > 0) {
    return primary;
  }
  if (!primary.error) {
    return primary;
  }

  return get<Defense[]>(`/projects/${projectId}/meetings`);
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
