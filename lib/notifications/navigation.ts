import { getRoleNotificationsPath as getRoleNotificationsPathFromRole } from '@/lib/auth/roleAccess';

/** Notifications list route for a dashboard role. */
export function getRoleNotificationsPath(role: string): string {
  return getRoleNotificationsPathFromRole(role);
}

export function notificationFocusQuery(notificationId: string): string {
  return `?focus=${encodeURIComponent(notificationId)}`;
}

export const NOTIFICATION_ITEM_ID_PREFIX = 'notification-';

export function notificationDomId(notificationId: string): string {
  return `${NOTIFICATION_ITEM_ID_PREFIX}${notificationId}`;
}
