'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import PendingInvitationsCard from '@/components/student/PendingInvitationsCard';
import StudentAnnouncementsPanel from '@/components/student/StudentAnnouncementsPanel';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import { getMySchedule } from '@/lib/api/schedule';

export default function StudentDashboardPage() {
  const { user, isLoading, handleLogout } = useDashboardUser('Student');
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [events, setEvents] = useState<InstitutionEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadSchedule() {
      const res = await getMySchedule();
      if (!cancelled && res.data) {
        setDefenses(res.data.defenses);
        setMeetings(res.data.meetings);
        setEvents(res.data.events);
      }
      if (!cancelled) setScheduleLoading(false);
    }
    loadSchedule();
    return () => { cancelled = true; };
  }, []);

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
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-archivumRed rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-eerieBlack">Welcome, {user.name}!</h1>
                <p className="font-sans text-sm text-neutral-600 mt-1">View your assigned research and classes</p>
              </div>
            </div>
          </div>
        </Card>

        <StudentAnnouncementsPanel
          defenses={defenses}
          meetings={meetings}
          events={events}
          loading={scheduleLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JoinGroupCard />

          <PendingInvitationsCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
