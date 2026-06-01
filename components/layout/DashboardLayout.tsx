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
  const isCoordinator = role === 'coordinator';

  return (
    <SidebarProvider>
      <div
        className={`min-h-screen overflow-x-hidden ${
          isCoordinator ? 'coordinator-theme coordinator-main-bg' : 'bg-neutral-50'
        }`}
      >
        <Sidebar role={role} />

        <div className="flex min-h-screen flex-col lg:pl-64">
          <Header user={user} onLogout={onLogout} />

          <main className="flex flex-1 flex-col min-w-0 coordinator-main-bg">
            <div className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
