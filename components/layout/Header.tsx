'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import ArchivumBrand from './ArchivumBrand';
import Dropdown from '../ui/Dropdown';
import Avatar from '../ui/Avatar';
import { useRouter, usePathname } from 'next/navigation';
import {
  FiBell,
  FiSettings,
  FiLogOut,
  FiUser,
  FiMenu,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiCalendar,
} from 'react-icons/fi';
import { useSidebar } from './SidebarContext';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '@/lib/api/notifications';
import {
  getRoleNotificationsPath,
  notificationFocusQuery,
} from '@/lib/notifications/navigation';
import {
  getMyInvitations,
  respondToInvitation,
  type Invitation,
} from '@/lib/api/projects';
import { PROJECT_INVITATION_RESPONDED_EVENT } from '@/components/projects/PendingInvitationsCard';

export interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const homeHref = user?.role ? `/${user.role.toLowerCase()}` : '/';

  const loadData = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setInvitations([]);
      return;
    }

    const [notifResult, invResult] = await Promise.all([
      getMyNotifications(25),
      getMyInvitations(),
    ]);

    let unread = 0;

    if (!notifResult.error && notifResult.data) {
      setNotifications(notifResult.data);
      unread += notifResult.data.reduce(
        (count, item) => (item.is_read ? count : count + 1),
        0,
      );
    }

    if (!invResult.error && invResult.data) {
      setInvitations(invResult.data);
      unread += invResult.data.length;
    }

    setUnreadCount(unread);
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadData();
    }
    if (!cancelled) init();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [bellOpen]);

  async function handleMarkRead(notifId: string) {
    await markNotificationRead(notifId);
    await loadData();
  }

  async function handleNotificationClick(notification: NotificationItem) {
    setBellOpen(false);
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }
    const base = getRoleNotificationsPath(user?.role || 'student');
    router.push(`${base}${notificationFocusQuery(notification.id)}`);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await loadData();
  }

  async function handleRespondInvitation(invitation: Invitation, accept: boolean) {
    setRespondingId(invitation.id);
    const result = await respondToInvitation(invitation.id, accept);
    if (!result.error) {
      window.dispatchEvent(
        new CustomEvent(PROJECT_INVITATION_RESPONDED_EVENT, {
          detail: {
            accept,
            projectId: result.data?.projectId || invitation.project_id,
            invitationId: invitation.id,
          },
        }),
      );
    }
    await loadData();
    setRespondingId(null);
  }

  const userMenuItems = [
    {
      label: 'Profile',
      value: 'profile',
      icon: <FiUser />,
      onClick: () => {
        if (user) {
          const url = `/${user.role.toLowerCase()}/profile`;
          if (pathname === url) {
            return;
          }
          router.replace(url);
        }
      },
    },
    {
      label: 'Settings',
      value: 'settings',
      icon: <FiSettings />,
      onClick: () => console.log('Navigate to settings'),
    },
    {
      label: '',
      value: 'divider',
      divider: true,
    },
    {
      label: 'Logout',
      value: 'logout',
      icon: <FiLogOut />,
      onClick: onLogout || (() => console.log('Logout')),
      danger: true,
    },
  ];

  const notificationsDropdown = user ? (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        className="relative rounded-lg p-2 text-snow transition-colors hover:bg-antiFlashWhite hover:text-oxfordBlue"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => {
          setBellOpen((o) => {
            if (!o) loadData();
            return !o;
          });
        }}
      >
        <FiBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-crimsonRed px-1.5 py-0.5 text-center text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {bellOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[28rem] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg z-50">
          <div className="sticky top-0 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800">Notifications</h3>
            {notifications.some((n) => !n.is_read) && (
              <button
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {invitations.length > 0 && (
            <div className="border-b border-neutral-100">
              <div className="px-4 py-2 bg-primary-50">
                <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">
                  Project Invitations
                </span>
              </div>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="px-4 py-3 border-b border-neutral-50 last:border-b-0 hover:bg-neutral-50"
                >
                  <p className="text-sm font-medium text-neutral-800">{inv.project_title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Invited by {inv.invited_by_name} &middot; Role: {inv.role}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex items-center gap-1 rounded-md bg-success-600 px-3 py-1 text-xs font-medium text-white hover:bg-success-700 transition-colors disabled:opacity-50"
                      onClick={() => handleRespondInvitation(inv, true)}
                      disabled={respondingId === inv.id}
                    >
                      <FiCheck className="text-xs" /> Accept
                    </button>
                    <button
                      className="flex items-center gap-1 rounded-md bg-error-100 px-3 py-1 text-xs font-medium text-error-700 hover:bg-error-200 transition-colors disabled:opacity-50"
                      onClick={() => handleRespondInvitation(inv, false)}
                      disabled={respondingId === inv.id}
                    >
                      <FiX className="text-xs" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length === 0 && invitations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-400">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-neutral-50 last:border-b-0 flex items-start gap-3 cursor-pointer hover:bg-neutral-50 ${
                  n.is_read ? 'opacity-60' : ''
                }`}
                onClick={() => handleNotificationClick(n)}
                role="link"
              >
                <div className="mt-0.5">
                  {n.type === 'defense_approved' && <FiCheckCircle className="text-success-600" />}
                  {n.type === 'defense_rejected' && <FiX className="text-error-600" />}
                  {n.type === 'defense_moved' && <FiInfo className="text-warning-600" />}
                  {(n.type === 'invitation' || n.type === 'schedule' || n.type === 'event') && (
                    <FiCalendar className="text-primary-500" />
                  )}
                  {n.type !== 'defense_approved' &&
                    n.type !== 'defense_rejected' &&
                    n.type !== 'defense_moved' &&
                    n.type !== 'invitation' &&
                    n.type !== 'schedule' &&
                    n.type !== 'event' && <FiBell className="text-primary-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{n.title}</p>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  ) : null;

  const profileDropdown = user ? (
    <Dropdown
      align="right"
      trigger={
        <div className="flex cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/10 max-lg:p-0 lg:gap-3 lg:p-1 lg:px-3 lg:py-2">
          <div className="hidden text-right lg:block">
            <div className="font-serif text-lg font-medium text-snow">{user.name}</div>
            <div className="text-xs text-gray-400">{user.role}</div>
          </div>
          <Avatar src={user.avatar} name={user.name} size="sm" className="lg:hidden" />
          <Avatar src={user.avatar} name={user.name} size="md" className="hidden lg:block" />
        </div>
      }
      items={userMenuItems}
    />
  ) : (
    <Link href="/login">
      <button className="px-4 py-2 bg-archivumRed text-white rounded-lg hover:bg-archivumRed/90 transition-colors">
        Sign In
      </button>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full flex-shrink-0 items-center border-b border-gray-800 bg-oxfordBlue px-4 lg:h-20 lg:justify-end lg:px-7">
      {/* Mobile: hamburger | logo (center) | profile */}
      <div className="grid h-full w-full grid-cols-3 items-center lg:hidden">
        <button
          onClick={toggle}
          className="justify-self-start rounded-lg p-2 text-snow transition-colors hover:bg-white/10"
          aria-label="Toggle navigation menu"
        >
          <FiMenu className="text-xl" />
        </button>

        <Link
          href={homeHref}
          className="flex min-w-0 items-center justify-center justify-self-center gap-2"
        >
          <ArchivumBrand compact />
        </Link>

        <div className="flex h-full items-center justify-end justify-self-end">
          {profileDropdown}
        </div>
      </div>

      {/* Desktop: notifications + user (brand lives in sidebar) */}
      <div className="hidden h-full items-center gap-4 lg:flex">
        {notificationsDropdown}
        {profileDropdown}
      </div>
    </header>
  );
}
