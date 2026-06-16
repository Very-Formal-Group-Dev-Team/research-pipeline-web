'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CARD_BODY_FLUSH_CLASS, CARD_HEADER_SECTION_CLASS } from '@/components/ui/Card';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import CardIconHeader from '@/components/ui/CardIconHeader';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import AdviserFullCalendar from '@/components/adviser/AdviserFullCalendar';
import { FiUsers, FiFolder, FiCalendar, FiTrendingUp, FiActivity, FiFileText, FiArrowRight } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { getMyNotifications } from '@/lib/api/notifications';
import { getAdviserPendingReviews, type AdviserPendingReview } from '@/lib/api/paperReviews';
import {
  getAdvisedProjectsWithStats,
  getAdviserDashboardStats,
  resolveAdviserDashboardStats,
  type AdviserDashboardStats,
  type Project,
} from '@/lib/api/projects';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import { getNotificationTypeLabel, getNotificationVariant } from '@/lib/notifications/display';
import { getMySchedule, type MySchedule } from '@/lib/api/schedule';
import { adviserProjectPaperVersionsUrl } from '@/lib/projects/navigation';

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
  const router = useRouter();
  const { user, isLoading, handleLogout } = useDashboardUser('Adviser');
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [institutionEvents, setInstitutionEvents] = useState<InstitutionEvent[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AdviserPendingReview[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [pendingReviewsLoading, setPendingReviewsLoading] = useState(true);
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
      const [scheduleRes, advisedRes, statsRes, notificationsRes, pendingReviewsRes] = await Promise.all([
        getMySchedule(),
        getAdvisedProjectsWithStats(),
        getAdviserDashboardStats(),
        getMyNotifications(12),
        getAdviserPendingReviews(),
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

      const recentActivityItems: RecentActivityItem[] = (notificationsRes.data || [])
        .map((row) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          createdAt: row.created_at,
          isUnread: !row.is_read,
          badgeLabel: getNotificationTypeLabel(row.type),
          badgeVariant: getNotificationVariant(row.type),
        }))
        .slice(0, 6);

      setRecentActivity(recentActivityItems);
      setPendingReviews(pendingReviewsRes.data || []);

      setScheduleLoading(false);
      setStatsLoading(false);
      setActivityLoading(false);
      setPendingReviewsLoading(false);
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const loading = isLoading || scheduleLoading || statsLoading || activityLoading || pendingReviewsLoading;

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
    { icon: <FiCalendar />, label: 'Upcoming Events', value: String(dashboardStats.upcomingEvents), color: 'bg-warning-100 text-warning-600', href: '/adviser/events' },
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

            <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-6 lg:grid-cols-2">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {stats.map((stat, idx) => (
                  <Card key={idx} className="h-full">
                    <div className="flex h-full items-center gap-3 sm:gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${stat.color}`}>
                        <div className="text-xl sm:text-2xl">{stat.icon}</div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-600 sm:text-sm">{stat.label}</p>
                        <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <JoinGroupCard />
            </div>

            <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-6 lg:grid-cols-2">
              <Card className="min-w-0">
                <CardIconHeader
                  title="Pending Reviews"
                  description="Documents awaiting your feedback"
                  icon={<FiFileText className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
                />
                <div className="h-[26.75rem] space-y-3 overflow-y-auto overscroll-contain pr-3">
                  {pendingReviews.length === 0 ? (
                    <p className="text-sm text-neutral-600">No pending reviews</p>
                  ) : (
                    pendingReviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex h-52 flex-col rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3"
                      >
                        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                          <p className="line-clamp-2 min-h-[2.75rem] shrink-0 break-words text-sm font-semibold leading-normal text-neutral-900">
                            {review.project_title}
                          </p>
                          <p className="shrink-0 text-xs leading-normal text-neutral-600">
                            v{review.version_number} · {review.requester_name} ·{' '}
                            {formatActivityDate(review.requested_at)}
                          </p>
                          {review.note ? (
                            <p className="line-clamp-2 min-h-0 flex-1 overflow-hidden rounded border-l-2 border-neutral-300 bg-white px-2 py-1 text-xs italic leading-normal text-neutral-600">
                              {review.note}
                            </p>
                          ) : (
                            <div className="min-h-0 flex-1" aria-hidden />
                          )}
                        </div>
                        <div className="mt-2 flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 pt-2">
                          <p className="min-w-0 flex-1 line-clamp-1 break-words text-sm leading-snug text-neutral-700">
                            {review.commit_message}
                          </p>
                          <button
                            type="button"
                            className="inline-flex shrink-0 items-center text-sm font-medium text-oxfordBlue hover:underline"
                            onClick={() => router.push(adviserProjectPaperVersionsUrl(review.project_id))}
                          >
                            Review
                            <FiArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="min-w-0">
                <CardIconHeader
                  title="Recent Activity"
                  description="Latest updates from your advisees"
                  icon={<FiActivity className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
                />
                <div className="h-[26.75rem] space-y-3 overflow-y-auto overscroll-contain pr-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-neutral-600">No recent activity</p>
                  ) : (
                    recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-solid border-neutral-200 bg-neutral-50 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-800">{item.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">{item.message}</p>
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
