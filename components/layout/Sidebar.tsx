'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiFolder,
  FiCalendar,
  FiUser,
  FiSettings,
  FiUsers,
  FiClipboard,
  FiX,
  FiBookOpen,
  FiBell,
  FiVideo,
} from 'react-icons/fi';
import { useSidebar } from './SidebarContext';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  tooltip?: string;
  roles?: string[];
  /** Show in sidebar only below lg. */
  mobileOnly?: boolean;
}

export interface SidebarProps {
  role: 'student' | 'adviser' | 'coordinator' | 'admin';
}

const RECORDINGS_HREF = defenseTranscriptionArchiveUrl();

const menuItems: Record<string, MenuItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student', icon: <FiHome /> },
    { label: 'My Projects', href: '/student/projects', icon: <FiFolder /> },
    { label: 'Notifications', href: '/student/notifications', icon: <FiBell /> },
    { label: 'Events', href: '/student/events', icon: <FiCalendar />, tooltip: 'Defenses, meetings, and institution events' },
    { label: 'Recordings', href: RECORDINGS_HREF, icon: <FiVideo />, tooltip: 'Recorded meetings and transcripts' },
    { label: 'Profile', href: '/student/profile', icon: <FiUser /> },
    { label: 'Settings', href: '/student/settings', icon: <FiSettings /> },
  ],
  adviser: [
    { label: 'Dashboard', href: '/adviser', icon: <FiHome /> },
    { label: 'My Advisees', href: '/adviser/advisees', icon: <FiUsers /> },
    { label: 'Notifications', href: '/adviser/notifications', icon: <FiBell />, tooltip: 'Your recent notifications and alerts' },
    { label: 'Events', href: '/adviser/events', icon: <FiCalendar />, tooltip: 'Institution events, meetings, and defense schedules' },
    { label: 'Recordings', href: RECORDINGS_HREF, icon: <FiVideo />, tooltip: 'Recorded meetings and transcripts' },
    { label: 'Rubrics', href: '/adviser/rubrics', icon: <FiClipboard /> },
    { label: 'Profile', href: '/adviser/profile', icon: <FiUser /> },
    { label: 'Settings', href: '/adviser/settings', icon: <FiSettings /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: <FiHome /> },
    { label: 'Institutions', href: '/admin/institutions', icon: <FiBookOpen /> },
    { label: 'Users', href: '/admin/users', icon: <FiUsers /> },
    { label: 'Audit Log', href: '/admin/audit', icon: <FiClipboard /> },
    { label: 'Profile', href: '/admin/profile', icon: <FiUser /> },
    { label: 'Settings', href: '/admin/settings', icon: <FiSettings /> },
  ],
  coordinator: [
    { label: 'Dashboard', href: '/coordinator', icon: <FiHome /> },
    { label: 'Events', href: '/coordinator/events', icon: <FiCalendar />, tooltip: 'Institution events and defense schedules' },
    { label: 'Notifications', href: '/coordinator/notifications', icon: <FiBell />, tooltip: 'Defense and schedule notifications' },
    { label: 'Recordings', href: RECORDINGS_HREF, icon: <FiVideo />, tooltip: 'Recorded meetings and transcripts' },
    { label: 'Courses', href: '/coordinator/courses', icon: <FiBookOpen /> },
    { label: 'All Projects', href: '/coordinator/projects', icon: <FiFolder /> },
    { label: 'Rubrics', href: '/coordinator/rubrics', icon: <FiClipboard /> },
    { label: 'Profile', href: '/coordinator/profile', icon: <FiUser /> },
    { label: 'Settings', href: '/coordinator/settings', icon: <FiSettings /> },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role] || [];
  const { isOpen, setOpen } = useSidebar();
  const usesPortalSidebar =
    role === 'coordinator' || role === 'student' || role === 'adviser' || role === 'admin';

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-x-0 top-20 bottom-0 z-20 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`
          fixed top-20 bottom-0 left-0 z-40 flex w-64 shrink-0 flex-col
          transition-transform duration-300 ease-in-out
          border-r border-gray-800
          lg:translate-x-0
          ${isOpen ? 'max-lg:shadow-[2px_0_8px_rgba(0,0,0,0.28)]' : 'max-lg:shadow-none'}
          lg:shadow-[2px_0_10px_rgba(0,0,0,0.24)]
          ${usesPortalSidebar ? 'coordinator-theme bg-deepSpaceBlue' : 'bg-white'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <aside
          className={`flex h-full min-h-full w-full flex-1 flex-col ${
            usesPortalSidebar ? 'coordinator-sidebar border-r border-[#243456]' : 'border-r border-neutral-200'
          }`}
        >
          <div className="flex shrink-0 items-center justify-end px-3 py-3 lg:hidden">
            <button
              type="button"
              onClick={closeSidebar}
              className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
                usesPortalSidebar
                  ? 'text-white/70 hover:bg-white/10 hover:text-white'
                  : 'text-neutral-400 hover:bg-neutral-100 hover:text-oxfordBlue'
              }`}
              aria-label="Close sidebar"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 pt-5">
            <ul className="space-y-2">
              {items.map((item) => {
                const isActive = pathname === item.href
                  || (item.href === RECORDINGS_HREF && (pathname.includes('/recordings') || pathname.includes('/transcription')));
                return (
                  <li key={item.href} className={item.mobileOnly ? 'lg:hidden' : undefined}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      title={item.tooltip || item.label}
                      className={`
                        relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm
                        transition-all duration-200 group
                        ${
                          isActive
                            ? usesPortalSidebar
                              ? 'coordinator-nav-active'
                              : 'bg-neutral-100 font-medium text-oxfordBlue'
                            : usesPortalSidebar
                              ? ''
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-oxfordBlue'
                        }
                      `}
                    >
                      <span
                        className={`flex-shrink-0 text-lg ${
                          isActive
                            ? usesPortalSidebar
                              ? 'text-white'
                              : 'text-oxfordBlue'
                            : usesPortalSidebar
                              ? 'text-white/60 group-hover:text-white'
                              : 'text-neutral-400 group-hover:text-oxfordBlue'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 overflow-hidden">{item.label}</span>
                      {item.badge !== undefined ? (
                        <span className="rounded-full bg-archivumRed px-2 py-0.5 text-xs font-medium text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
