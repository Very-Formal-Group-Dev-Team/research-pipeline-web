'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CARD_BODY_FLUSH_CLASS, CARD_HEADER_SECTION_CLASS } from '@/components/ui/Card';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import CardIconHeader from '@/components/ui/CardIconHeader';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import AdviserFullCalendar from '@/components/adviser/AdviserFullCalendar';
import { FiUsers, FiFolder, FiCalendar, FiTrendingUp, FiActivity, FiFileText } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { getMyNotifications } from '@/lib/api/notifications';
import {
  getAdvisedProjectsWithStats,
  getAdviserDashboardStats,
  getMyInvitations,
  resolveAdviserDashboardStats,
  type AdviserDashboardStats,
  type Invitation,
  type Project,
} from '@/lib/api/projects';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import { getNotificationTypeLabel, getNotificationVariant } from '@/lib/notifications/display';
import { getMySchedule, type MySchedule } from '@/lib/api/schedule';

interface RecentActivityItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isUnread: boolean;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
}

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
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
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
      const [scheduleRes, advisedRes, statsRes, notificationsRes, invitationsRes] = await Promise.all([
        getMySchedule(),
        getAdvisedProjectsWithStats(),
        getAdviserDashboardStats(),
        getMyNotifications(12),
        getMyInvitations(),
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

      const notificationActivity: RecentActivityItem[] = (notificationsRes.data || []).map((row) => ({
        id: `notif:${row.id}`,
        title: row.title,
        message: row.message,
        createdAt: row.created_at,
        isUnread: !row.is_read,
        badgeLabel: getNotificationTypeLabel(row.type),
        badgeVariant: getNotificationVariant(row.type),
      }));

      const invitationActivity: RecentActivityItem[] = (invitationsRes.data || []).map(
        (row: Invitation) => ({
          id: `inv:${row.id}`,
          title: row.project_title,
          message: `Invited by ${row.invited_by_name} | Role: ${row.role}`,
          createdAt: row.invited_at,
          isUnread: true,
          badgeLabel: 'Invitation',
          badgeVariant: 'primary',
        }),
      );

      const mergedActivity = [...invitationActivity, ...notificationActivity]
        .sort((a, b) => {
          const left = new Date(a.createdAt).getTime();
          const right = new Date(b.createdAt).getTime();
          return right - left;
        })
        .slice(0, 6);

      setRecentActivity(mergedActivity);

      setScheduleLoading(false);
      setStatsLoading(false);
      setActivityLoading(false);
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const loading = isLoading || scheduleLoading || statsLoading || activityLoading;

  function formatActivityDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

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
                <Card key={idx}>
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
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-neutral-600">No recent activity</p>
                  ) : (
                    recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-800 truncate">{item.title}</p>
                          <p className="mt-0.5 text-xs text-neutral-600 line-clamp-2">{item.message}</p>
                          <p className="mt-1 text-xs text-neutral-500">{formatActivityDate(item.createdAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={item.badgeVariant} size="sm">
                            {item.badgeLabel}
                          </Badge>
                          {item.isUnread && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <Card padding="none" className="overflow-hidden">
              <div className={CARD_HEADER_SECTION_CLASS}>
                <CardIconHeader
                  className="mb-0"
                  title="Schedule Calendar"
                  description="Defenses, meetings, and institution events"
                  icon={<FiCalendar className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
                />
              </div>
              <div className={CARD_BODY_FLUSH_CLASS}>
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
