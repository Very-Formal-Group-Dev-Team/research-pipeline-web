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
        className={`dashboard-ui min-h-screen overflow-x-hidden flex flex-col ${
          usesPortalChrome ? 'coordinator-theme coordinator-main-bg' : 'bg-neutral-50'
        }`}
      >
        <Header user={user} onLogout={onLogout} />

        <div className="flex flex-1 min-h-0 items-stretch overflow-hidden">
          <Sidebar role={role} />

          <div className="flex min-w-0 flex-1 flex-col min-h-0">
            <main className="flex flex-1 flex-col min-h-0 overflow-y-auto coordinator-main-bg">
              <div className="flex-1 px-6 pb-6 pt-10">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </div>
              <Footer />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
