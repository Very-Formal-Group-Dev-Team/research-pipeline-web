/**
 * Institutions API service.
 */

import { get } from './client';

export interface RegisteredInstitution {
  id: string;
  name: string;
  code: string;
  is_active?: number | boolean;
}

export interface InstitutionProgram {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InstitutionCourse {
  id: string;
  institution_id: string;
  course_name: string;
  code: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Search registered institutions (seeded from hardcoded list). */
export function searchInstitutions(query = '') {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return get<RegisteredInstitution[]>(`/institutions/search${suffix}`);
}

/** List courses created by coordinators in the current user's institution. */
export function getMyInstitutionCourses() {
  return get<InstitutionCourse[]>('/institutions/me/courses');
}

/** List active programs for the current user's institution. */
export function getMyInstitutionPrograms() {
  return get<InstitutionProgram[]>('/institutions/me/programs');
}
