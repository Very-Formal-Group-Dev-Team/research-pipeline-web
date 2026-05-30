/** Notifications list route for a dashboard role. */
export function getRoleNotificationsPath(role: string): string {
  const r = (role || 'student').toLowerCase();
  if (r === 'coordinator') return '/coordinator/notifications';
  if (r === 'adviser') return '/adviser/notifications';
  return '/student/notifications';
}

export function notificationFocusQuery(notificationId: string): string {
  return `?focus=${encodeURIComponent(notificationId)}`;
}

export const NOTIFICATION_ITEM_ID_PREFIX = 'notification-';

export function notificationDomId(notificationId: string): string {
  return `${NOTIFICATION_ITEM_ID_PREFIX}${notificationId}`;
}
