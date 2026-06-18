import { getRoleHomePath } from '@/lib/auth/roleAccess';

export const PROJECT_TEAM_MEMBERS_SECTION_ID = 'project-team-members';

export const PROJECT_TEAM_MEMBERS_SECTION_PARAM = 'team-members';

export function projectTeamMembersFocusQuery(): string {
  return `?section=${encodeURIComponent(PROJECT_TEAM_MEMBERS_SECTION_PARAM)}`;
}

export function getProjectDetailsPath(role: string, projectId: string): string {
  const dashboardRole = role === 'adviser' || role === 'teacher' ? 'adviser' : role;
  if (dashboardRole === 'adviser') {
    return `/adviser/advisees/${projectId}`;
  }
  return `${getRoleHomePath(role)}/projects/${projectId}`;
}

export function getProjectTeamMembersPath(role: string, projectId: string): string {
  return `${getProjectDetailsPath(role, projectId)}${projectTeamMembersFocusQuery()}`;
}

/** DOM id for the paper version history block on adviser project detail. */
export const PROJECT_PAPER_VERSIONS_SECTION_ID = 'project-paper-versions';

export function adviserProjectPaperVersionsUrl(projectId: string): string {
  return `/adviser/advisees/${projectId}#${PROJECT_PAPER_VERSIONS_SECTION_ID}`;
}

export function studentManuscriptReviewUrl(projectId: string, versionId: string): string {
  return `/student/projects/${projectId}/manuscript/${versionId}`;
}

export function adviserManuscriptReviewUrl(projectId: string, versionId: string): string {
  return `/adviser/advisees/${projectId}/manuscript/${versionId}`;
}
