/**
 * Projects API service – replaces all direct Supabase project queries.
 */

import { get, post, patch, del } from './client';

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
  program_id?: string | null;
  course?: string;
  course_id?: string | null;
  course_code?: string | null;
  section?: string;
  member_role?: string;
}

export type ProjectMemberJoinSource = 'invite' | 'code_request';

export interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  is_main_adviser?: boolean | null;
  join_source?: ProjectMemberJoinSource;
  invited_at?: string;
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
  projectType: 'thesis' | 'capstone';
  abstract?: string;
  keywords?: string[];
  program?: string;
  programId?: string;
  course?: string;
  courseId?: string;
  section?: string;
  file?: File | null;
  invites?: CreateProjectInvite[];
}

export interface JoinProjectPayload {
  projectCode: string;
}

export interface JoinProjectResult {
  success: boolean;
  pending?: boolean;
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
  predicted_labels?: string[];
  predicted_fields?: Array<{ label: string; confidence: number }>;
  vectorization: {
    shape?: number[];
    non_zero?: number;
    top_terms?: Array<{ term: string; value: number }>;
    message?: string;
  };
}

export interface CrossReferenceStudy {
  id?: string;
  display_name: string;
  authorships?: Array<{ author?: { display_name?: string } }>;
  publication_date?: string;
  primary_location?: {
    source?: { display_name?: string };
    landing_page_url?: string;
  };
  doi?: string;
}

export type CrossReferenceSort =
  | 'publication_date:desc'
  | 'publication_date:asc'
  | 'relevance_score:desc';

export interface CrossReferenceParams {
  page?: number;
  perPage?: number;
  sort?: CrossReferenceSort;
  fromYear?: string;
  toYear?: string;
  predictedFields?: Array<{ code: string; confidence: number }>;
  predictedLabels?: string[];
  confidenceThreshold?: number;
}

export interface CrossReferenceScopeField {
  code: string;
  label: string;
  confidence: number;
}

export interface CrossReferenceResult {
  query: string;
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  studies: CrossReferenceStudy[];
  scopedFields?: CrossReferenceScopeField[];
}

// ─── API calls ──────────────────────────────────────────────────────────────

/** Fetch all projects the current user is a member of or created. */
export function getMyProjects() {
  return get<Project[]>('/projects');
}

export interface ProjectCodeLookup {
  id: string;
  project_code: string;
  title: string;
}

/** Look up a project by its join/booking code (requires access). */
export function getProjectByCode(code: string) {
  return get<ProjectCodeLookup>(`/projects/code/${encodeURIComponent(code.trim())}`);
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
  formData.append('projectType', payload.projectType);
  if (payload.program) formData.append('program', payload.program);
  if (payload.programId) formData.append('programId', payload.programId);
  if (payload.courseId) formData.append('courseId', payload.courseId);
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
    const status = String(project.status || 'topic_proposal').toLowerCase();
    if (status === 'completed' || status === 'for_publication' || status === 'archived') {
      completedProjects += 1;
    } else if (status !== 'rejected') {
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
  return post<{ success: boolean; status: string; projectId?: string; role?: string }>(
    `/projects/invitations/${invitationId}/respond`,
    { accept },
  );
}

/** Fetch pending invitations for a specific project. */
export function getProjectInvitations(projectId: string) {
  return get<ProjectMember[]>(`/projects/${projectId}/invitations`);
}

/** Remove an accepted member or revert a pending invitation. */
export function removeProjectMember(projectId: string, memberId: string) {
  return del<{ success: boolean; reverted?: boolean; removed?: boolean }>(
    `/projects/${projectId}/members/${memberId}`,
  );
}

/** Accept or reject a student join request (project leader only). */
export function respondToJoinRequest(projectId: string, memberId: string, accept: boolean) {
  return post<{ success: boolean; status: string; userId?: string }>(
    `/projects/${projectId}/join-requests/${memberId}/respond`,
    { accept },
  );
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

export interface UpdateProjectDetailsPayload {
  title: string;
  projectType: string;
  paperStandard: string;
  program?: string;
  programId?: string;
  course?: string;
  courseId?: string;
  section?: string;
}

/** Update project title, type, paper standard, and class fields (student members). */
export function updateProjectDetails(projectId: string, payload: UpdateProjectDetailsPayload) {
  return patch<Project>(`/projects/${projectId}/details`, payload);
}

/** Query OpenAlex for cross-referenced studies using project keywords. */
export function crossReferenceStudies(projectId: string, params: CrossReferenceParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.perPage) search.set('perPage', String(params.perPage));
  if (params.sort) search.set('sort', params.sort);
  if (params.fromYear) search.set('fromYear', params.fromYear);
  if (params.toYear) search.set('toYear', params.toYear);
  if (params.predictedFields?.length) {
    const encoded = params.predictedFields
      .map((field) => `${field.code}:${field.confidence}`)
      .join(',');
    search.set('predictedFields', encoded);
  }
  if (params.predictedLabels?.length) search.set('predictedLabels', params.predictedLabels.join(','));
  if (typeof params.confidenceThreshold === 'number') {
    search.set('confidenceThreshold', String(params.confidenceThreshold));
  }
  const query = search.toString();
  const path = `/projects/${projectId}/cross-reference${query ? `?${query}` : ''}`;
  return get<CrossReferenceResult>(path);
}

/** Update a project's status (adviser only). */
export function updateProjectStatus(projectId: string, status: string) {
  return patch<Project>(`/projects/${projectId}/status`, { status });
}

/** Permanently delete a project (project leader only). Requires exact title confirmation. */
export function deleteProject(projectId: string, confirmTitle: string) {
  return del<{ success: boolean; message: string }>(`/projects/${projectId}`, { confirmTitle });
}

export interface LeaveProjectPayload {
  reason?: string;
  successorMemberId?: string;
  confirmDisplayName?: string;
}

/** Leave a project (members/advisers) or transfer ownership (leaders). */
export function leaveProject(projectId: string, payload?: LeaveProjectPayload) {
  return post<{ success: boolean; action: string; removed?: boolean }>(
    `/projects/${projectId}/leave`,
    payload ?? {},
  );
}

export interface LeadershipTransferRevertPayload {
  previousLeaderUserId: string;
  newLeaderUserId: string;
  previousNewLeaderRole: string;
}

/** Transfer project leadership to another accepted member (current leader only). */
export function transferProjectLeadership(projectId: string, memberId: string) {
  return post<{ success: boolean; revert: LeadershipTransferRevertPayload }>(
    `/projects/${projectId}/transfer-leadership`,
    { memberId },
  );
}

/** Revert a recent leadership transfer (previous leader only). */
export function revertProjectLeadership(
  projectId: string,
  payload: LeadershipTransferRevertPayload,
) {
  return post<{ success: boolean }>(`/projects/${projectId}/transfer-leadership/revert`, payload);
}

export interface MainAdviserTransferRevertPayload {
  previousMainAdviserUserId: string;
  newMainAdviserUserId: string;
}

/** Transfer main adviser role to another project adviser (current main adviser only). */
export function transferMainAdviser(projectId: string, memberId: string) {
  return post<{ success: boolean; revert: MainAdviserTransferRevertPayload }>(
    `/projects/${projectId}/transfer-main-adviser`,
    { memberId },
  );
}

/** Revert a recent main adviser transfer (previous main adviser only). */
export function revertMainAdviserTransfer(
  projectId: string,
  payload: MainAdviserTransferRevertPayload,
) {
  return post<{ success: boolean }>(`/projects/${projectId}/transfer-main-adviser/revert`, payload);
}
