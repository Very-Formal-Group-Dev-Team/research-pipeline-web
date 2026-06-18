/**
 * Notifications API service.
 */

import { get, patch } from './client';

export type NotificationType =
  | 'invitation'
  | 'schedule'
  | 'defense_approved'
  | 'defense_rejected'
  | 'defense_moved'
  | 'event'
  | 'project_stage_updated'
  | 'join_request'
  | 'member_left'
  | 'ownership_transferred'
  | 'paper_version_committed'
  | 'project_updated'
  | 'review_requested'
  | 'review_completed'
  | 'comment_added'
  | 'comment_resolved'
  | 'revision_requested';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

/** Fetch latest notifications for current user. */
export function getMyNotifications(limit = 50) {
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 50, 1), 100);
  return get<NotificationItem[]>(`/notifications?limit=${safeLimit}`);
}

/** Mark a single notification as read. */
export function markNotificationRead(notificationId: string) {
  return patch<{ success: boolean }>(`/notifications/${notificationId}/read`);
}

/** Mark all notifications as read. */
export function markAllNotificationsRead() {
  return patch<{ success: boolean; updated: number }>('/notifications/read-all');
}
