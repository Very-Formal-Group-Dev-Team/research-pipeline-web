'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { MOCK_DASHBOARD_INVITATIONS } from '@/lib/mock-data';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, isLoading, handleLogout } = useDashboardUser('Student');

  if (isLoading) {
    return (
      <DashboardLayout role="student" user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-ivory to-white border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-crimsonRed rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-darkSlateBlue">Welcome, {user.name}!</h1>
                <p className="text-sm text-neutral-600 mt-1">View your assigned research and classes</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Join a Group Section */}
          <JoinGroupCard />

          {/* Pending Invitations Section */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-crimsonRed/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-crimsonRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-darkSlateBlue">Pending Invitations</h2>
            </div>

            <div className="space-y-3">
              {MOCK_DASHBOARD_INVITATIONS.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-skyBlue/50 hover:bg-skyBlue/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-xl group-hover:bg-skyBlue/10 transition-colors">
                      {invitation.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-darkSlateBlue text-sm mb-0.5">
                        {invitation.projectTitle}
                      </h3>
                      <p className="text-xs text-neutral-600 mb-2">
                        Invited by {invitation.from}
                      </p>
                      <p className="text-xs text-neutral-500 line-clamp-2">
                        {invitation.description}
                      </p>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      className="bg-mutedGreen hover:bg-mutedGreen/90 flex-shrink-0"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

