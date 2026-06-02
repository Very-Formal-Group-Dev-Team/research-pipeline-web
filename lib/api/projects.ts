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

export interface CreateProjectInvite {
  userId: string;
  role: 'member' | 'adviser';
  contributorRole?: string;
}

export interface CreateProjectPayload {
  title: string;
  researchType: string;
  abstract?: string;
  keywords?: string[];
  program?: string;
  course?: string;
  section?: string;
  file?: File | null;
  invites?: CreateProjectInvite[];
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
  contributor_role?: string | null;
  status: string;
  invited_at: string;
  project_title: string;
  project_code: string;
  invited_by_name: string;
  invited_by_email: string;
}

export interface InvitePayload {
  userId: string;
  role?: 'member' | 'adviser';
  contributorRole?: string;
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

export interface RelatedStudiesResult {
  projectId: string;
  latestVersion: {
    id: string;
    version_number: number;
    file_name: string;
    created_at: string;
  };
  keywords: string[];
  vectorization: {
    shape?: number[];
    non_zero?: number;
    top_terms?: Array<{ term: string; value: number }>;
    message?: string;
  };
}

export interface CrossReferenceStudy {
  display_name: string;
  authorships?: Array<{ author?: { display_name?: string } }>;
  publication_date?: string;
  primary_location?: {
    source?: { display_name?: string };
    landing_page_url?: string;
  };
  doi?: string;
}

export interface CrossReferenceResult {
  query: string;
  total: number;
  studies: CrossReferenceStudy[];
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
  formData.append('abstract', payload.abstract ?? '');
  formData.append('keywords', JSON.stringify(payload.keywords ?? []));
  formData.append('researchType', payload.researchType);
  if (payload.program) formData.append('program', payload.program);
  if (payload.course) formData.append('course', payload.course);
  if (payload.section) formData.append('section', payload.section);
  if (payload.file) formData.append('file', payload.file);
  if (payload.invites?.length) {
    formData.append('invites', JSON.stringify(payload.invites));
  }

  return post<{ projectId: string; projectCode: string; inviteErrors?: { userId: string; error: string }[] }>(
    '/projects',
    formData,
  );
}

/** Join a project using a project code. */
export async function joinProject(payload: JoinProjectPayload) {
  return post<JoinProjectResult>('/projects/join', payload);
}

/** Fetch projects the current user advises. */
export function getAdvisedProjects() {
  return get<Project[]>('/projects/advised');
}

export interface AdviserDashboardStats {
  totalAdvisees: number;
  activeProjects: number;
  completedProjects: number;
  upcomingEvents: number;
}

export interface AdvisedProjectsWithStats {
  projects: Project[];
  stats: AdviserDashboardStats;
}

/** Advised projects plus dashboard stats (single request). */
export function getAdvisedProjectsWithStats() {
  return get<AdvisedProjectsWithStats>('/projects/advised?includeStats=1');
}

/** Adviser dashboard analytics (distinct advisees, project statuses, upcoming schedule). */
export function getAdviserDashboardStats() {
  return get<AdviserDashboardStats>('/projects/advised/stats');
}

/** Derive active/completed counts from advised project rows. */
export function deriveAdviserProjectStats(projects: Project[]) {
  let activeProjects = 0;
  let completedProjects = 0;
  for (const project of projects) {
    const status = String(project.status || 'draft').toLowerCase();
    if (status === 'completed' || status === 'archived') {
      completedProjects += 1;
    } else {
      activeProjects += 1;
    }
  }
  return { activeProjects, completedProjects };
}

/**
 * Prefer API stats when present; fill project counts from the advised list when missing or zero.
 */
export function resolveAdviserDashboardStats(
  stats: AdviserDashboardStats | null | undefined,
  projects: Project[],
  upcomingEventsFallback = 0,
): AdviserDashboardStats {
  const derived = deriveAdviserProjectStats(projects);
  const base: AdviserDashboardStats = stats ?? {
    totalAdvisees: 0,
    activeProjects: derived.activeProjects,
    completedProjects: derived.completedProjects,
    upcomingEvents: upcomingEventsFallback,
  };

  const missingProjectCounts =
    projects.length > 0 && base.activeProjects === 0 && base.completedProjects === 0;

  return {
    totalAdvisees: base.totalAdvisees,
    activeProjects: missingProjectCounts ? derived.activeProjects : base.activeProjects,
    completedProjects: missingProjectCounts ? derived.completedProjects : base.completedProjects,
    upcomingEvents:
      base.upcomingEvents > 0 ? base.upcomingEvents : upcomingEventsFallback,
  };
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

/** Run keyword model against the latest submitted project version. */
export function findRelatedStudies(projectId: string) {
  return post<RelatedStudiesResult>(`/projects/${projectId}/find-related-studies`);
}

/** Save manually edited keywords for a project. */
export function updateProjectKeywords(projectId: string, keywords: string[]) {
  return patch<{ success: boolean; keywords: string[] }>(`/projects/${projectId}/keywords`, { keywords });
}

/** Save the manually edited abstract for a project. */
export function updateProjectAbstract(projectId: string, abstract: string) {
  return patch<{ success: boolean; abstract: string }>(`/projects/${projectId}/abstract`, { abstract });
}

/** Query OpenAlex for cross-referenced studies using project keywords. */
export function crossReferenceStudies(projectId: string) {
  return get<CrossReferenceResult>(`/projects/${projectId}/cross-reference`);
}

/** Update a project's status (adviser only). */
export function updateProjectStatus(projectId: string, status: string) {
  return patch<Project>(`/projects/${projectId}/status`, { status });
}
