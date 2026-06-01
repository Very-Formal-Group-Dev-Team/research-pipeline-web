'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import CardIconHeader from '@/components/ui/CardIconHeader';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import AdviserFullCalendar from '@/components/adviser/AdviserFullCalendar';
import { FiUsers, FiFolder, FiCalendar, FiTrendingUp, FiActivity, FiFileText } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getAdvisedProjectsWithStats,
  getAdviserDashboardStats,
  resolveAdviserDashboardStats,
  type AdviserDashboardStats,
  type Project,
} from '@/lib/api/projects';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import { getMySchedule, type MySchedule } from '@/lib/api/schedule';

function countUpcomingScheduleItems(schedule: MySchedule): number {
  const now = new Date();
  const inactive = new Set(['cancelled', 'rejected', 'completed']);
  const rows = [...schedule.defenses, ...schedule.meetings, ...schedule.events];
  let count = 0;
  for (const row of rows) {
    const status = String(row.status || '').toLowerCase();
    if (inactive.has(status)) continue;
    const raw = row.start_time || (row as { scheduled_at?: string }).scheduled_at;
    if (!raw) continue;
    const start = new Date(String(raw).replace(/Z$/i, ''));
    if (!Number.isNaN(start.getTime()) && start >= now) count += 1;
  }
  return count;
}

export default function AdviserDashboardPage() {
  const { user, isLoading, handleLogout } = useDashboardUser('Adviser');
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [institutionEvents, setInstitutionEvents] = useState<InstitutionEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalAdvisees: 0,
    activeProjects: 0,
    completedProjects: 0,
    upcomingEvents: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const [scheduleRes, advisedRes, statsRes] = await Promise.all([
        getMySchedule(),
        getAdvisedProjectsWithStats(),
        getAdviserDashboardStats(),
      ]);

      if (cancelled) return;

      const schedule = scheduleRes.data;
      if (schedule) {
        setDefenses(schedule.defenses);
        setMeetings(schedule.meetings);
        setInstitutionEvents(schedule.events);
      }

      const advisedPayload = advisedRes.data;
      let advisedProjects: Project[] = [];
      let statsFromAdvised: AdviserDashboardStats | undefined;

      if (Array.isArray(advisedPayload)) {
        advisedProjects = advisedPayload;
      } else if (advisedPayload?.projects) {
        advisedProjects = advisedPayload.projects;
        statsFromAdvised = advisedPayload.stats;
      }

      const upcomingFallback = schedule ? countUpcomingScheduleItems(schedule) : 0;
      const statsFromEndpoint = statsRes.data ?? statsFromAdvised ?? null;

      setDashboardStats(
        resolveAdviserDashboardStats(statsFromEndpoint, advisedProjects, upcomingFallback),
      );

      setScheduleLoading(false);
      setStatsLoading(false);
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const loading = isLoading || scheduleLoading || statsLoading;

  const stats = [
    { icon: <FiUsers />, label: 'Total Advisees', value: String(dashboardStats.totalAdvisees), color: 'bg-accent-100 text-accent-600' },
    { icon: <FiFolder />, label: 'Active Projects', value: String(dashboardStats.activeProjects), color: 'bg-success-100 text-success-600' },
    { icon: <FiCalendar />, label: 'Upcoming Events', value: String(dashboardStats.upcomingEvents), color: 'bg-warning-100 text-warning-600', href: '/adviser/meetings' },
    { icon: <FiTrendingUp />, label: 'Completed Projects', value: String(dashboardStats.completedProjects), color: 'bg-primary-100 text-primary-600' },
  ];

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading...</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold text-primary-700">Welcome back, {user.name}!</h1>
              <p className="text-neutral-600 mt-1">Here&apos;s an overview of your advisees and projects</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {stats.map((stat, idx) => (
                <Card key={idx} padding="none" className="p-3 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                      <div className="text-xl sm:text-2xl">{stat.icon}</div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-neutral-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-row gap-6">
                <JoinGroupCard />

                <Card>
                  <CardIconHeader
                    title="Pending Reviews"
                    description="Documents awaiting your feedback"
                    icon={<FiFileText className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
                  />
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600">No pending reviews</p>
                  </div>
                </Card>
              </div>

              <Card>
                <CardIconHeader
                  title="Recent Activity"
                  description="Latest updates from your advisees"
                  icon={<FiActivity className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
                />
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">No recent activity</p>
                </div>
              </Card>
            </div>

            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-neutral-300 px-6 py-4">
                <CardIconHeader
                  className="mb-0"
                  title="Schedule Calendar"
                  description="Defenses, meetings, and institution events"
                  icon={<FiCalendar className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
                />
              </div>
              <div className="p-3 pt-0 sm:p-4">
                <AdviserFullCalendar
                  defenses={defenses}
                  meetings={meetings}
                  institutionEvents={institutionEvents}
                  adviserId={user.email}
                  adviserName={user.name}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
