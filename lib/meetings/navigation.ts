/** DOM id for the Meetings block on adviser project detail. */
export const PROJECT_MEETINGS_SECTION_ID = 'project-meetings';

export function adviserProjectMeetingsUrl(projectId: string): string {
  return `/adviser/advisees/${projectId}#${PROJECT_MEETINGS_SECTION_ID}`;
}

export function defenseMeetingUrl(defenseId: string): string {
  return `/defenses/${encodeURIComponent(defenseId)}/meeting`;
}

export function defenseTranscriptionUrl(defenseId: string): string {
  return `/defenses/${encodeURIComponent(defenseId)}/recordings`;
}

export function defenseRecordingTranscriptionUrl(scheduleId: string, recordingId: string): string {
  return `/defenses/${encodeURIComponent(scheduleId)}/recordings/${encodeURIComponent(recordingId)}`;
}

export function defenseTranscriptionArchiveUrl(): string {
  return '/defenses/recordings';
}
