import { formatStatusLabel } from '@/lib/utils/formatStatus';

export type NotificationBadgeVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'default'
  | 'primary';

export function getNotificationTypeLabel(type: string): string {
  switch (type) {
    case 'defense_approved':
      return 'Approved';
    case 'defense_rejected':
      return 'Rejected';
    case 'defense_moved':
      return 'Moved';
    case 'schedule':
      return 'Schedule';
    case 'invitation':
      return 'Invitation';
    case 'event':
      return 'Event';
    case 'project_stage_updated':
      return 'Stage';
    case 'join_request':
      return 'Join request';
    case 'paper_version_committed':
      return 'Document';
    case 'project_updated':
      return 'Project';
    case 'review_requested':
      return 'Review';
    case 'review_completed':
      return 'Reviewed';
    case 'comment_added':
      return 'Comment';
    case 'comment_resolved':
      return 'Resolved';
    case 'revision_requested':
      return 'Revision';
    default:
      return formatStatusLabel(type.replace(/_/g, ' '));
  }
}

export function getNotificationVariant(type: string): NotificationBadgeVariant {
  switch (type) {
    case 'defense_approved':
      return 'success';
    case 'defense_rejected':
      return 'error';
    case 'defense_moved':
      return 'warning';
    case 'schedule':
      return 'primary';
    case 'event':
      return 'primary';
    case 'project_stage_updated':
      return 'primary';
    case 'join_request':
      return 'warning';
    case 'paper_version_committed':
      return 'primary';
    case 'project_updated':
      return 'primary';
    case 'review_requested':
      return 'warning';
    case 'review_completed':
      return 'success';
    case 'comment_added':
      return 'warning';
    case 'comment_resolved':
      return 'success';
    case 'revision_requested':
      return 'warning';
    default:
      return 'default';
  }
}
