/** DOM id for the Meetings block on adviser project detail. */
export const PROJECT_MEETINGS_SECTION_ID = 'project-meetings';

export function adviserProjectMeetingsUrl(projectId: string): string {
  return `/adviser/advisees/${projectId}#${PROJECT_MEETINGS_SECTION_ID}`;
}

export function defenseMeetingUrl(defenseId: string): string {
  return `/defenses/${encodeURIComponent(defenseId)}/meeting`;
}
