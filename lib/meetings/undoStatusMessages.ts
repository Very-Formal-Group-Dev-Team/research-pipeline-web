export type MeetingStatusUndoAction = 'complete' | 'cancel';

export function meetingUndoToastMessage(action: MeetingStatusUndoAction): string {
  if (action === 'complete') {
    return 'Meeting marked as complete. Sure about this change?';
  }
  return 'Meeting cancelled. Sure about this change?';
}

export function institutionEventUndoToastMessage(action: MeetingStatusUndoAction): string {
  if (action === 'complete') {
    return 'Event marked as complete. Sure about this change?';
  }
  return 'Event cancelled. Sure about this change?';
}

export function coordinatorDefenseUndoToastMessage(action: MeetingStatusUndoAction): string {
  if (action === 'complete') {
    return 'Defense marked as complete. Sure about this change?';
  }
  return 'Defense cancelled. Sure about this change?';
}

export type ActiveStatusUndoAction = 'enable' | 'disable';

export function adminInstitutionUndoToastMessage(action: ActiveStatusUndoAction): string {
  if (action === 'disable') {
    return 'Institution disabled. Sure about this change?';
  }
  return 'Institution enabled. Sure about this change?';
}

export function adminProgramUndoToastMessage(action: ActiveStatusUndoAction): string {
  if (action === 'disable') {
    return 'Program disabled. Sure about this change?';
  }
  return 'Program enabled. Sure about this change?';
}

export function recordingDeleteUndoToastMessage(): string {
  return 'Recording deleted. Sure about this change?';
}
