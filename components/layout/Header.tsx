'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
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

  // Close dropdown on outside click
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

  async function handleRespondInvitation(invitationId: string, accept: boolean) {
    setRespondingId(invitationId);
    await respondToInvitation(invitationId, accept);
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
          router.replace(url)
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

  return (
    <header className="flex justify-between items-center px-7 bg-coordinator-cream border-b border-[#E5DFDF] sticky top-0 z-40 flex-shrink-0 h-20">
      {/* LEFT: Hamburger (mobile — branding lives in sidebar) */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-neutral-500 hover:bg-[#E8E4E4] hover:text-darkSlateBlue transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="text-xl" />
        </button>
      </div>

      {/* RIGHT: Notifications + User */}
      <div className="flex items-center gap-4">
        {user && (
          <div ref={bellRef} className="relative">
              <button
                type="button"
                className="relative rounded-lg p-2 text-neutral-500 transition-colors hover:bg-[#E8E4E4] hover:text-darkSlateBlue"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => {
                  setBellOpen((o) => {
                    if (!o) loadData(); // refresh when opening
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

                  {/* Pending Invitations */}
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
                          <p className="text-sm font-medium text-neutral-800">
                            {inv.project_title}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Invited by {inv.invited_by_name} &middot; Role: {inv.role}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              className="flex items-center gap-1 rounded-md bg-success-600 px-3 py-1 text-xs font-medium text-white hover:bg-success-700 transition-colors disabled:opacity-50"
                              onClick={() => handleRespondInvitation(inv.id, true)}
                              disabled={respondingId === inv.id}
                            >
                              <FiCheck className="text-xs" /> Accept
                            </button>
                            <button
                              className="flex items-center gap-1 rounded-md bg-error-100 px-3 py-1 text-xs font-medium text-error-700 hover:bg-error-200 transition-colors disabled:opacity-50"
                              onClick={() => handleRespondInvitation(inv.id, false)}
                              disabled={respondingId === inv.id}
                            >
                              <FiX className="text-xs" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notification items */}
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
                          {n.type === 'defense_approved' && (
                            <FiCheckCircle className="text-success-600" />
                          )}
                          {n.type === 'defense_rejected' && (
                            <FiX className="text-error-600" />
                          )}
                          {n.type === 'defense_moved' && (
                            <FiInfo className="text-warning-600" />
                          )}
                          {(n.type === 'invitation' ||
                            n.type === 'schedule' ||
                            n.type === 'event') && (
                            <FiCalendar className="text-primary-500" />
                          )}
                          {n.type !== 'defense_approved' &&
                            n.type !== 'defense_rejected' &&
                            n.type !== 'defense_moved' &&
                            n.type !== 'invitation' &&
                            n.type !== 'schedule' &&
                            n.type !== 'event' && (
                            <FiBell className="text-primary-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">
                            {n.title}
                          </p>
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
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
          )}

          {user ? (
            <Dropdown
              align="right"
              trigger={
                <div className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 px-3 py-2 rounded-lg transition-colors">
                  <div className="text-right">
                    <div className="text-sm font-medium text-darkSlateBlue">{user.name}</div>
                    <div className="text-xs text-neutral-500">({user.role})</div>
                  </div>
                  <Avatar src={user.avatar} name={user.name} size="md" />
                </div>
              }
              items={userMenuItems}
            />
          ) : (
            <Link href="/login">
              <button className="px-4 py-2 bg-crimsonRed text-white rounded-lg hover:bg-error-600 transition-colors">
                Sign In
              </button>
            </Link>
          )}
        </div>
    </header>
  );
}
