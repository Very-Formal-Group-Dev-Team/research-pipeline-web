'use client';

import React from 'react';
import Image from 'next/image';
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
}

export interface SidebarProps {
  role: 'student' | 'adviser' | 'coordinator';
}

const menuItems: Record<string, MenuItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student', icon: <FiHome /> },
    { label: 'My Projects', href: '/student/projects', icon: <FiFolder /> },
    { label: 'Create Project', href: '/student/projects/create', icon: <FiPlus /> },
    { label: 'Notifications', href: '/student/notifications', icon: <FiBell /> },
    { label: 'Events', href: '/student/events', icon: <FiCalendar />, tooltip: 'Defenses, meetings, and institution events' },
    { label: 'Profile', href: '/student/profile', icon: <FiUser /> },
  ],
  adviser: [
    { label: 'Dashboard', href: '/adviser', icon: <FiHome /> },
    { label: 'My Advisees', href: '/adviser/advisees', icon: <FiUsers /> },
    { label: 'Notifications', href: '/adviser/notifications', icon: <FiBell />, tooltip: 'Your recent notifications and alerts' },
    // {/* label: 'Projects Overview', href: '/adviser/projects', icon: <FiFolder /> */}
    { label: 'Meeting Schedule', href: '/adviser/meetings', icon: <FiCalendar />, tooltip: 'Adviser meetings with students (one-on-one or group)' },
    { label: 'Profile', href: '/adviser/profile', icon: <FiUser /> },
  ],
  coordinator: [
    { label: 'Dashboard', href: '/coordinator', icon: <FiHome /> },
    { label: 'Events', href: '/coordinator/events', icon: <FiCalendar />, tooltip: 'Institution events and defense schedules' },
    { label: 'Notifications', href: '/coordinator/notifications', icon: <FiBell />, tooltip: 'Defense and schedule notifications' },
    { label: 'Courses', href: '/coordinator/courses', icon: <FiBookOpen /> },
    { label: 'All Projects', href: '/coordinator/projects', icon: <FiFolder /> },
    { label: 'Rubrics', href: '/coordinator/rubrics', icon: <FiClipboard /> },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role] || [];
  const { isOpen, setOpen } = useSidebar();
  const isCoordinator = role === 'coordinator';

  const closeSidebar = () => setOpen(false);
  const homeHref = `/${role}`;

  return (
    <>
      {/* Backdrop - only show on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — full-height left rail, overlays header on desktop */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-64 h-screen flex flex-col
          ${isCoordinator ? 'coordinator-sidebar border-r border-[#243456]' : 'bg-white border-r border-neutral-200'}
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-6 shrink-0">
          <Link
            href={homeHref}
            onClick={closeSidebar}
            className="flex items-center gap-3.5 min-w-0"
          >
            <Image
              src="/archivum.svg"
              alt="Archivum"
              width={52}
              height={52}
              className="h-[52px] w-[52px] flex-shrink-0 object-contain"
              priority
            />
            <div className="min-w-0 text-left">
              <p
                className={`text-lg font-semibold leading-tight truncate ${
                  isCoordinator ? 'text-white' : 'text-darkSlateBlue'
                }`}
              >
                Archivum
              </p>
              <p
                className={`text-sm leading-snug truncate ${
                  isCoordinator ? 'text-white/75' : 'text-neutral-500'
                }`}
              >
                Research Portal
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className={`p-2 rounded-lg transition-colors lg:hidden flex-shrink-0 ${
              isCoordinator
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-neutral-400 hover:text-darkSlateBlue hover:bg-neutral-100'
            }`}
            aria-label="Close sidebar"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    title={item.tooltip || item.label}
                    className={`
                      flex items-center gap-3 rounded-lg
                      transition-all duration-200 group text-sm px-4 py-2.5 relative
                      ${isActive
                        ? (isCoordinator ? 'coordinator-nav-active' : 'bg-neutral-100 text-darkSlateBlue font-medium')
                        : (isCoordinator ? '' : 'text-neutral-600 hover:bg-neutral-50 hover:text-darkSlateBlue')
                      }
                    `}
                  >
                    <span
                      className={`text-lg flex-shrink-0 ${
                        isActive
                          ? (isCoordinator ? 'text-white' : 'text-darkSlateBlue')
                          : (isCoordinator ? 'text-white/60 group-hover:text-white' : 'text-neutral-400 group-hover:text-darkSlateBlue')
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
    </>
  );
}
