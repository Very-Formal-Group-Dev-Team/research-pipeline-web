'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Welcome back!</h1>
            <p className="text-neutral-600 mt-1">View your assigned research and classes</p>
          </div>
          <StudentAnnouncementsPanel
            defenses={[]}
            meetings={[]}
            events={[]}
            loading
          />
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <JoinGroupCard />
            <PendingInvitationsCard />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Welcome back, {user.name}!</h1>
          <p className="text-neutral-600 mt-1">View your assigned research and classes</p>
        </div>

        <StudentAnnouncementsPanel
          defenses={defenses}
          meetings={meetings}
          events={events}
          loading={scheduleLoading}
        />

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          <JoinGroupCard />
          <PendingInvitationsCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
