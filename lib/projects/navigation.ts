export const PROJECT_TEAM_MEMBERS_SECTION_ID = 'project-team-members';

export const PROJECT_TEAM_MEMBERS_SECTION_PARAM = 'team-members';

export function projectTeamMembersFocusQuery(): string {
  return `?section=${encodeURIComponent(PROJECT_TEAM_MEMBERS_SECTION_PARAM)}`;
}

export function getProjectDetailsPath(role: string, projectId: string): string {
  const normalizedRole = (role || 'student').toLowerCase();
  return `/${normalizedRole}/projects/${projectId}`;
}

export function getProjectTeamMembersPath(role: string, projectId: string): string {
  return `${getProjectDetailsPath(role, projectId)}${projectTeamMembersFocusQuery()}`;
}
