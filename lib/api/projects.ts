/**
 * Projects API service – replaces all direct Supabase project queries.
 */

import { get, post, patch } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  project_code: string;
  title: string;
  description?: string;
  abstract?: string;
  project_type: string;
  paper_standard: string;
  status: string;
  keywords: string[];
  document_reference?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  program?: string;
  course?: string;
  section?: string;
  member_role?: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  users: {
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

export interface CreateProjectPayload {
  title: string;
  abstract: string;
  keywords: string[];
  researchType: string;
  program?: string;
  course?: string;
  section?: string;
  file?: File | null;
}

export interface JoinProjectPayload {
  projectCode: string;
}

export interface JoinProjectResult {
  success: boolean;
  message?: string;
  project?: { id: string; title: string };
  error?: string;
}

export interface Invitation {
  id: string;
  project_id: string;
  role: string;
  status: string;
  invited_at: string;
  project_title: string;
  project_code: string;
  invited_by_name: string;
  invited_by_email: string;
}

export interface InvitePayload {
  userId: string;
  role?: string;
}

export interface ScheduleDefensePayload {
  defenseType: 'proposal' | 'midterm' | 'final';
  scheduledAt: string;
  location?: string;
}

export interface ScheduleDefenseResult {
  success: boolean;
  message: string;
  defense: {
    id: string;
    project_id: string;
    defense_type: 'proposal' | 'midterm' | 'final';
    start_time: string;
    end_time: string | null;
    location?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    created_by: string;
    created_at: string;
  } | null;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/** Fetch all projects the current user is a member of or created. */
export function getMyProjects() {
  return get<Project[]>('/projects');
}

/** Fetch a single project by ID. */
export function getProject(projectId: string) {
  return get<Project>(`/projects/${projectId}`);
}

/** Fetch members for a given project. */
export function getProjectMembers(projectId: string) {
  return get<ProjectMember[]>(`/projects/${projectId}/members`);
}

/** Create a new project (multipart – may include a file). */
export async function createProject(payload: CreateProjectPayload) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('abstract', payload.abstract);
  formData.append('keywords', JSON.stringify(payload.keywords));
  formData.append('researchType', payload.researchType);
  if (payload.program) formData.append('program', payload.program);
  if (payload.course) formData.append('course', payload.course);
  if (payload.section) formData.append('section', payload.section);
  if (payload.file) formData.append('file', payload.file);

  return post<{ projectId: string; projectCode: string }>('/projects', formData);
}

/** Join a project using a project code. */
export async function joinProject(payload: JoinProjectPayload) {
  return post<JoinProjectResult>('/projects/join', payload);
}

/** Fetch projects the current user advises. */
export function getAdvisedProjects() {
  return get<Project[]>('/projects/advised');
}

/** Fetch project owner / creator profile. */
export function getProjectOwner(projectId: string) {
  return get<{ id: string; full_name: string; email: string; avatar_url?: string }>(
    `/projects/${projectId}/owner`,
  );
}

/** Invite a user to a project. */
export function inviteToProject(projectId: string, payload: InvitePayload) {
  return post<{ success: boolean; message: string }>(`/projects/${projectId}/invite`, payload);
}

/** Fetch the current user's pending invitations. */
export function getMyInvitations() {
  return get<Invitation[]>('/projects/invitations');
}

/** Respond to an invitation (accept or decline). */
export function respondToInvitation(invitationId: string, accept: boolean) {
  return post<{ success: boolean; status: string }>(
    `/projects/invitations/${invitationId}/respond`,
    { accept },
  );
}

/** Fetch pending invitations for a specific project. */
export function getProjectInvitations(projectId: string) {
  return get<ProjectMember[]>(`/projects/${projectId}/invitations`);
}

/** Create a defense schedule for a project. */
export function scheduleProjectDefense(projectId: string, payload: ScheduleDefensePayload) {
  return post<ScheduleDefenseResult>(`/projects/${projectId}/schedule`, payload);
}

/** Update a project's status (adviser only). */
export function updateProjectStatus(projectId: string, status: string) {
  return patch<Project>(`/projects/${projectId}/status`, { status });
}
