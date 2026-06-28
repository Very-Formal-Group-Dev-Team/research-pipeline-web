import type { PaperComment } from '@/lib/api/paperComments';

export type ManuscriptViewerRole = 'student' | 'adviser';

export function isStudentAuthor(role: PaperComment['author_role']): boolean {
  return role === 'leader' || role === 'member';
}

export function isAdviserAuthor(role: PaperComment['author_role']): boolean {
  return role === 'adviser';
}

export function canResolveThread(
  viewerRole: ManuscriptViewerRole,
  parent: PaperComment,
): boolean {
  if (viewerRole !== 'student') return false;
  if (parent.status === 'resolved') return false;
  if (isAdviserAuthor(parent.author_role)) {
    return parent.status === 'open' || parent.status === 'needs_revision';
  }
  if (isStudentAuthor(parent.author_role)) {
    return parent.status === 'open';
  }
  return false;
}

export function canUnresolveThread(
  viewerRole: ManuscriptViewerRole,
  parent: PaperComment,
): boolean {
  if (viewerRole !== 'student') return false;
  if (parent.status !== 'resolved') return false;
  return isStudentAuthor(parent.author_role);
}

export function showResolveCheckmark(
  viewerRole: ManuscriptViewerRole,
  parent: PaperComment,
): boolean {
  if (!parent.parent_id && viewerRole === 'student') {
    if (parent.status === 'resolved') return true;
    return canResolveThread(viewerRole, parent);
  }
  return parent.status === 'resolved';
}

export function canRequestRevisionOnThread(
  viewerRole: ManuscriptViewerRole,
  parent: PaperComment,
): boolean {
  if (viewerRole !== 'adviser') return false;
  if (!isAdviserAuthor(parent.author_role)) return false;
  return parent.status === 'open';
}

export function canReopenThread(
  viewerRole: ManuscriptViewerRole,
  parent: PaperComment,
): boolean {
  if (viewerRole !== 'adviser') return false;
  if (!isAdviserAuthor(parent.author_role)) return false;
  return parent.status === 'resolved' || parent.status === 'needs_revision';
}

export function canEditComment(currentUserId: string, comment: PaperComment): boolean {
  if (!currentUserId) return false;
  return String(comment.author_id) === String(currentUserId);
}

export function canDeleteComment(currentUserId: string, comment: PaperComment): boolean {
  if (!currentUserId) return false;
  return String(comment.author_id) === String(currentUserId);
}

export function canToggleVisibility(
  viewerRole: ManuscriptViewerRole,
  currentUserId: string,
  comment: PaperComment,
): boolean {
  if (!currentUserId) return false;
  if (viewerRole !== 'student') return false;
  if (String(comment.author_id) !== String(currentUserId)) return false;
  return isStudentAuthor(comment.author_role);
}

export function isTeamOnlyComment(comment: PaperComment): boolean {
  return comment.visibility === 'team';
}

export function isVisibleToAdviser(comment: PaperComment): boolean {
  return comment.visibility !== 'team';
}

export function filterCommentsForViewer(
  comments: PaperComment[],
  viewerRole: ManuscriptViewerRole,
): PaperComment[] {
  if (viewerRole === 'student') return comments;
  return comments.filter(isVisibleToAdviser);
}

export function resolveButtonLabel(viewerRole: ManuscriptViewerRole): string {
  return viewerRole === 'student' ? 'Mark addressed' : 'Resolve';
}

/** Parent threads that count toward adviser review completion. */
export function isAdviserFeedbackThread(parent: PaperComment): boolean {
  return isAdviserAuthor(parent.author_role);
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) return `${time} Today`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCommentTimestamp(comment: PaperComment): string {
  const date = comment.edited_at ?? comment.created_at;
  const formatted = formatDateTime(date);
  return comment.edited_at ? `Edited ${formatted}` : formatted;
}
