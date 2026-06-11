/**
 * Admin API service — platform institutions and program catalogs.
 */

import { get, patch, post } from './client';

export interface AdminInstitution {
  id: string;
  name: string;
  code: string;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminProgram {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export function listAdminInstitutions() {
  return get<AdminInstitution[]>('/admin/institutions');
}

export function createAdminInstitution(payload: { name: string; code: string }) {
  return post<AdminInstitution>('/admin/institutions', payload);
}

export function updateAdminInstitution(
  institutionId: string,
  payload: { name?: string; code?: string; isActive?: boolean },
) {
  return patch<AdminInstitution>(`/admin/institutions/${institutionId}`, payload);
}

export function listAdminPrograms(institutionId: string) {
  return get<AdminProgram[]>(`/admin/institutions/${institutionId}/programs`);
}

export function createAdminProgram(
  institutionId: string,
  payload: { name: string; code: string; description?: string },
) {
  return post<AdminProgram>(`/admin/institutions/${institutionId}/programs`, payload);
}

export function updateAdminProgram(
  institutionId: string,
  programId: string,
  payload: {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  },
) {
  return patch<AdminProgram>(
    `/admin/institutions/${institutionId}/programs/${programId}`,
    payload,
  );
}
