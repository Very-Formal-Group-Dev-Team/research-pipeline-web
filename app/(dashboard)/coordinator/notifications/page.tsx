'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import {
  FiBell,
  FiCheck,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiArrowRight,
} from 'react-icons/fi';
import EmptyState from '@/components/layout/EmptyState';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '@/lib/api/notifications';
import {
  getNotificationTypeLabel,
  getNotificationVariant,
} from '@/lib/notifications/display';
import { useNotificationFocusScroll } from '@/lib/hooks/useNotificationFocusScroll';
import { notificationDomId } from '@/lib/notifications/navigation';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function notificationIcon(type: string) {
  switch (type) {
    case 'defense_approved':
      return <FiCheckCircle className="text-2xl text-success-600" />;
    case 'defense_rejected':
      return <FiXCircle className="text-2xl text-error-600" />;
    case 'defense_moved':
      return <FiArrowRight className="text-2xl text-accent-600" />;
    case 'schedule':
    case 'event':
      return <FiCalendar className="text-2xl text-primary-600" />;
    case 'project_stage_updated':
      return <FiArrowRight className="text-2xl text-primary-600" />;
    default:
      return <FiBell className="text-2xl text-accent-600" />;
  }
}


export default function CoordinatorNotificationsPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await getMyNotifications(100);
      if (!cancelled && res.data) setNotifications(res.data);
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useNotificationFocusScroll(loading, notifications.length);

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Notifications</h1>
            <p className="text-neutral-600 mt-1">
              Defense verifications, institution events, and schedule updates
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="shrink-0 text-xs sm:text-sm" onClick={handleMarkAllRead}>
              <FiCheck className="mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                id={notificationDomId(notification.id)}
                className={!notification.is_read ? 'border-l-4 border-l-primary-500' : ''}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                    {notificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3
                          className={`font-semibold text-lg ${
                            !notification.is_read ? 'text-primary-700' : 'text-neutral-700'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {formatDate(notification.created_at)}
                          {notification.is_read && notification.read_at
                            ? ` · Read ${formatDate(notification.read_at)}`
                            : ''}
                        </p>
                      </div>
                      <Badge variant={getNotificationVariant(notification.type)}>
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiBell />}
              title="No notifications"
              description="You don't have any notifications yet. You'll be notified about defense requests and institution events."
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
