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
    { label: 'Upcoming Defenses', href: '/student/defenses', icon: <FiCalendar /> },
    { label: 'Profile', href: '/student/profile', icon: <FiUser /> },
  ],
  adviser: [
    { label: 'Dashboard', href: '/adviser', icon: <FiHome /> },
    { label: 'My Advisees', href: '/adviser/advisees', icon: <FiUsers /> },
    // {/* label: 'Projects Overview', href: '/adviser/projects', icon: <FiFolder /> */}
    { label: 'Meeting Schedule', href: '/defenses', icon: <FiCalendar /> },
    { label: 'Profile', href: '/adviser/profile', icon: <FiUser /> },
  ],
  coordinator: [
    { label: 'Dashboard', href: '/coordinator', icon: <FiHome /> },
    { label: 'Manage Defenses', href: '/coordinator/defenses', icon: <FiCheckSquare /> },
    { label: 'Advisers', href: '/coordinator/advisers', icon: <FiUsers /> },
    { label: 'Courses', href: '/coordinator/courses', icon: <FiBookOpen /> },
    { label: 'All Projects', href: '/coordinator/projects', icon: <FiFolder /> },
    // { label: 'Settings', href: '/coordinator/settings', icon: <FiSettings /> },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role] || [];
  const { isOpen, setOpen } = useSidebar();

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* Backdrop - only show on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-64
          bg-white border-r border-neutral-200 h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:-translate-x-0 lg:h-auto lg:overflow-y-auto
        `}
      >
        {/* Header */}
        
          

          {/* Close button - only on mobile */}
          <button
            onClick={closeSidebar}
            className="m-4 p-2 rounded-lg text-neutral-400 hover:text-darkSlateBlue transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <FiX className="text-lg" />
          </button>
        

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    className={`
                      flex items-center gap-3 rounded-lg
                      transition-all duration-200 group text-sm px-4 py-2.5 relative
                      ${isActive
                        ? 'bg-neutral-100 text-darkSlateBlue font-medium'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-darkSlateBlue'
                      }
                    `}
                  >
                    <span className={`text-lg flex-shrink-0 ${isActive ? 'text-darkSlateBlue' : 'text-neutral-400 group-hover:text-darkSlateBlue'}`}>
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
