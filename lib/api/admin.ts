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

// ─── User management ────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: number;
  email_verified: number | boolean;
  auth_provider: string;
  role: string | null;
  institution_id: string | null;
  institution_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUsersListResponse {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function listAdminUsers(params?: {
  search?: string;
  role?: string;
  institutionId?: string;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.role) query.set('role', params.role);
  if (params?.institutionId) query.set('institutionId', params.institutionId);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return get<AdminUsersListResponse>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export function getAdminUser(userId: string) {
  return get<AdminUser>(`/admin/users/${userId}`);
}

export function updateAdminUser(
  userId: string,
  payload: {
    role?: string;
    institutionId?: string;
    isActive?: boolean;
  },
) {
  return patch<AdminUser>(`/admin/users/${userId}`, payload);
}

// ─── Audit log ──────────────────────────────────────────────────────────────

export interface AdminAuditEntry {
  id: string;
  action: string;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  target_type: string | null;
  target_id: string | null;
  institution_id: string | null;
  institution_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  source: 'system' | 'project';
  project_id: string | null;
  project_title: string | null;
}

export interface AdminAuditListResponse {
  data: AdminAuditEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function listAdminAuditLog(params?: {
  action?: string;
  actorUserId?: string;
  institutionId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.action) query.set('action', params.action);
  if (params?.actorUserId) query.set('actorUserId', params.actorUserId);
  if (params?.institutionId) query.set('institutionId', params.institutionId);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return get<AdminAuditListResponse>(`/admin/audit-log${qs ? `?${qs}` : ''}`);
}
