'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { SidebarProvider } from './SidebarContext';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'adviser' | 'coordinator';
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
}

export default function DashboardLayout({ children, role, user, onLogout }: DashboardLayoutProps) {
  const usesPortalChrome = role === 'coordinator' || role === 'student' || role === 'adviser';

  return (
    <SidebarProvider>
      <div
        className={`dashboard-ui flex min-h-screen overflow-x-hidden ${
          usesPortalChrome ? 'coordinator-theme coordinator-main-bg' : 'bg-neutral-50'
        }`}
      >
        <Sidebar role={role} homeHref={`/${role}`} />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <Header user={user} onLogout={onLogout} />

          <main className="flex flex-1 flex-col coordinator-main-bg">
            <div className="flex-1 px-6 pb-6 pt-10">
              <div className="mx-auto max-w-7xl">{children}</div>
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
