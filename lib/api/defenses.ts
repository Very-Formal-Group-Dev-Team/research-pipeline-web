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
  modality: string;
  status: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
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

/** Fetch defenses for all projects the current user is a member of (student view). */
export function getMyProjectDefenses() {
  return get<Defense[]>('/defenses/my-projects');
}

/** Create a new defense schedule. */
export function createDefense(payload: CreateDefensePayload) {
  return post<Defense>('/defenses', payload);
}
