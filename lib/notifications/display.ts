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
    default:
      return 'default';
  }
}
