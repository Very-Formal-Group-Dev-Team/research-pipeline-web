'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiFolder,
  FiPlus,
  FiMail,
  FiCalendar,
  FiUser,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiClipboard,
  FiX,
  FiBookOpen,
  FiCheckSquare,
  FiBell,
} from 'react-icons/fi';
import { useSidebar } from './SidebarContext';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  tooltip?: string;
  roles?: string[];
  /** Show in sidebar only below lg (header has notifications bell on desktop). */
  mobileOnly?: boolean;
}

export interface SidebarProps {
  role: 'student' | 'adviser' | 'coordinator';
}

const menuItems: Record<string, MenuItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student', icon: <FiHome /> },
    { label: 'My Projects', href: '/student/projects', icon: <FiFolder /> },
    { label: 'Create Project', href: '/student/projects/create', icon: <FiPlus /> },
    { label: 'Notifications', href: '/student/notifications', icon: <FiBell />, mobileOnly: true },
    { label: 'Events', href: '/student/events', icon: <FiCalendar />, tooltip: 'Defenses, meetings, and institution events' },
    { label: 'Profile', href: '/student/profile', icon: <FiUser /> },
  ],
  adviser: [
    { label: 'Dashboard', href: '/adviser', icon: <FiHome /> },
    { label: 'My Advisees', href: '/adviser/advisees', icon: <FiUsers /> },
    { label: 'Notifications', href: '/adviser/notifications', icon: <FiBell />, tooltip: 'Your recent notifications and alerts', mobileOnly: true },
    // {/* label: 'Projects Overview', href: '/adviser/projects', icon: <FiFolder /> */}
    { label: 'Meeting Schedule', href: '/adviser/meetings', icon: <FiCalendar />, tooltip: 'Adviser meetings with students (one-on-one or group)' },
    { label: 'Profile', href: '/adviser/profile', icon: <FiUser /> },
  ],
  coordinator: [
    { label: 'Dashboard', href: '/coordinator', icon: <FiHome /> },
    { label: 'Events', href: '/coordinator/events', icon: <FiCalendar />, tooltip: 'Institution events and defense schedules' },
    { label: 'Notifications', href: '/coordinator/notifications', icon: <FiBell />, tooltip: 'Defense and schedule notifications', mobileOnly: true },
    { label: 'Courses', href: '/coordinator/courses', icon: <FiBookOpen /> },
    { label: 'All Projects', href: '/coordinator/projects', icon: <FiFolder /> },
    { label: 'Rubrics', href: '/coordinator/rubrics', icon: <FiClipboard /> },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role] || [];
  const { isOpen, setOpen } = useSidebar();
  /** Coordinator-style navy sidebar (student + coordinator only). */
  const usesPortalSidebar = role === 'coordinator' || role === 'student' || role === 'adviser';

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* Backdrop - only show on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-x-0 top-20 bottom-0 z-20 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile: fixed drawer. Desktop: full-height column under header (main scrolls separately). */}
      <div
        className={`
          fixed top-20 bottom-0 left-0 z-40 flex w-64 shrink-0 flex-col
          transition-transform duration-300 ease-in-out
          lg:relative lg:top-auto lg:left-auto lg:z-auto
          lg:h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-5rem)]
          lg:translate-x-0
          ${usesPortalSidebar ? 'coordinator-theme bg-deepSpaceBlue' : 'bg-white'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
      <aside
        className={`
          flex h-full min-h-full w-full flex-1 flex-col
          ${usesPortalSidebar ? 'coordinator-sidebar border-r border-[#243456]' : 'border-r border-neutral-200'}
        `}
      >
        <div className="flex items-center justify-end px-3 py-3 shrink-0 lg:hidden">
          <button
            type="button"
            onClick={closeSidebar}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              usesPortalSidebar
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-neutral-400 hover:text-darkSlateBlue hover:bg-neutral-100'
            }`}
            aria-label="Close sidebar"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 pt-5">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className={item.mobileOnly ? 'lg:hidden' : undefined}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    title={item.tooltip || item.label}
                    className={`
                      flex items-center gap-3 rounded-lg
                      transition-all duration-200 group text-sm px-4 py-2.5 relative
                      ${isActive
                        ? (usesPortalSidebar ? 'coordinator-nav-active' : 'bg-neutral-100 text-darkSlateBlue font-medium')
                        : (usesPortalSidebar ? '' : 'text-neutral-600 hover:bg-neutral-50 hover:text-darkSlateBlue')
                      }
                    `}
                  >
                    <span
                      className={`text-lg flex-shrink-0 ${
                        isActive
                          ? (usesPortalSidebar ? 'text-white' : 'text-darkSlateBlue')
                          : (usesPortalSidebar ? 'text-white/60 group-hover:text-white' : 'text-neutral-400 group-hover:text-darkSlateBlue')
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 overflow-hidden">
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-xs bg-crimsonRed text-white rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
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
