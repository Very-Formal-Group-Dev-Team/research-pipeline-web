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
  FiX,
  FiUserPlus,
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
  getMyInvitations,
  respondToInvitation,
  type Invitation,
} from '@/lib/api/projects';

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
      return <FiCalendar className="text-2xl text-primary-600" />;
    default:
      return <FiBell className="text-2xl text-accent-600" />;
  }
}

function notificationVariant(type: string): 'success' | 'error' | 'warning' | 'default' | 'primary' {
  switch (type) {
    case 'defense_approved': return 'success';
    case 'defense_rejected': return 'error';
    case 'defense_moved': return 'warning';
    case 'schedule': return 'primary';
    default: return 'default';
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'defense_approved': return 'Approved';
    case 'defense_rejected': return 'Rejected';
    case 'defense_moved': return 'Moved';
    case 'schedule': return 'Schedule';
    case 'invitation': return 'Invitation';
    default: return type;
  }
}

export default function StudentNotificationsPage() {
  const { user, handleLogout } = useDashboardUser('Student');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function loadAll() {
    const [notifRes, invRes] = await Promise.all([
      getMyNotifications(),
      getMyInvitations(),
    ]);
    if (notifRes.data) setNotifications(notifRes.data);
    if (invRes.data) setInvitations(invRes.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await loadAll();
    }
    if (!cancelled) load();
    return () => { cancelled = true; };
  }, []);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleRespondInvitation(invitationId: string, accept: boolean) {
    setRespondingId(invitationId);
    await respondToInvitation(invitationId, accept);
    await loadAll();
    setRespondingId(null);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Notifications</h1>
            <p className="text-neutral-600 mt-1">Stay updated on your defense schedules and project activity</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <FiCheck className="mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : (
          <>
            {/* Pending Project Invitations */}
            {invitations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-primary-700 flex items-center gap-2">
                  <FiUserPlus /> Project Invitations
                </h2>
                {invitations.map((inv) => (
                  <Card key={inv.id} className="border-l-4 border-l-accent-500">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                        <FiUserPlus className="text-2xl text-accent-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-semibold text-lg text-primary-700">
                              {inv.project_title}
                            </h3>
                            <p className="text-xs text-neutral-500">
                              Code: {inv.project_code} &middot; Invited by {inv.invited_by_name}
                            </p>
                          </div>
                          <Badge variant="default">{inv.role}</Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mt-1">
                          Invited on {formatDate(inv.invited_at)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleRespondInvitation(inv.id, true)}
                            disabled={respondingId === inv.id}
                          >
                            <FiCheck className="mr-1" /> Accept
                          </Button>
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleRespondInvitation(inv.id, false)}
                            disabled={respondingId === inv.id}
                          >
                            <FiX className="mr-1" /> Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Notifications list */}
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {invitations.length > 0 && (
                  <h2 className="text-lg font-semibold text-primary-700 flex items-center gap-2">
                    <FiBell /> Notifications
                  </h2>
                )}
                {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={!notification.is_read ? 'border-l-4 border-l-primary-500' : ''}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                    {notificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className={`font-semibold text-lg ${!notification.is_read ? 'text-primary-700' : 'text-neutral-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <Badge variant={notificationVariant(notification.type)}>{typeLabel(notification.type)}</Badge>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                    {!notification.is_read && (
                      <button
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
          invitations.length === 0 && (
            <Card>
              <EmptyState
                icon={<FiBell />}
                title="No notifications"
                description="You don't have any notifications yet. You'll be notified when defenses are scheduled or approved."
              />
            </Card>
          )
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
