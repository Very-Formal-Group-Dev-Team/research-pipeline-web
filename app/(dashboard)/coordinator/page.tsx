'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CARD_BODY_FLUSH_CLASS, CARD_HEADER_SECTION_CLASS } from '@/components/ui/Card';
import CardIconHeader from '@/components/ui/CardIconHeader';
import { FiFolder, FiCalendar, FiBookOpen, FiShield, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import CoordinatorFullCalendar from '@/components/coordinator/CoordinatorFullCalendar';
import {
  getAllDefenses,
  getCoordinatorDashboard,
  type CoordinatorStats,
  type Institution,
} from '@/lib/api/coordinator';
import { getCoordinatorEvents } from '@/lib/api/events';

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [stats, setStats] = useState<CoordinatorStats | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [defenses, setDefenses] = useState<Awaited<ReturnType<typeof getAllDefenses>>['data']>([]);
  const [institutionEvents, setInstitutionEvents] = useState<Awaited<ReturnType<typeof getCoordinatorEvents>>['data']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [dashRes, defensesRes, eventsRes] = await Promise.all([
        getCoordinatorDashboard(),
        getAllDefenses(),
        getCoordinatorEvents(),
      ]);
      if (!cancelled && dashRes.data) {
        setStats(dashRes.data.stats);
        setInstitution(dashRes.data.institution);
      }
      if (!cancelled && defensesRes.data) setDefenses(defensesRes.data);
      if (!cancelled && eventsRes.data) setInstitutionEvents(eventsRes.data);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statCards = stats
    ? [
        {
          icon: <FiFolder />,
          label: 'Total Projects',
          value: String(stats.totalProjects),
          color: 'bg-primary-100 text-primary-600',
          href: '/coordinator/projects',
        },
        {
          icon: <FiCalendar />,
          label: 'Pending Defenses',
          value: String(stats.pendingDefenses),
          color: 'bg-warning-100 text-warning-600',
          href: '/coordinator/events?tab=pending',
        },
        {
          icon: <FiBookOpen />,
          label: 'Courses',
          value: String(stats.totalCourses),
          color: 'bg-success-100 text-success-600',
          href: '/coordinator/courses',
        },
        {
          icon: <FiUsers />,
          label: 'Faculty Advisers',
          value: String(stats.totalAdvisers),
          color: 'bg-accent-100 text-accent-600',
          href: '/coordinator/courses',
        },
      ]
    : [];

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Welcome back, {user.name}!</h1>
          <p className="text-neutral-600 mt-1">
            {institution
              ? `${institution.name} — institution-wide overview and management`
              : 'System-wide overview and management'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {statCards.map((stat, idx) => (
                <Card key={idx} hover onClick={() => router.push(stat.href)}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                      <div className="text-xl sm:text-2xl">{stat.icon}</div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-neutral-600 truncate">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary-700">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card hover onClick={() => router.push('/coordinator/events?tab=pending')}>
              <CardIconHeader
                title="Defense Verification"
                description="Review and approve defense schedules proposed by advisers"
                icon={<FiShield className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
              />
              <div className="flex items-center justify-between gap-2 min-w-0">
                {stats && stats.pendingDefenses > 0 ? (
                  <span className="inline-flex min-w-0 shrink items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-warning-100 text-warning-700 truncate">
                    {stats.pendingDefenses} pending verification
                  </span>
                ) : (
                  <span className="text-sm text-neutral-600 min-w-0 truncate">No pending defenses</span>
                )}
                <span className="text-sm font-medium text-primary-600 shrink-0">
                  Review defenses →
                </span>
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className={CARD_HEADER_SECTION_CLASS}>
                <CardIconHeader
                  className="mb-0"
                  title="Schedule Calendar"
                  description="Defenses and institution events in month, week, day, year, and agenda views"
                  icon={<FiCalendar className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
                />
              </div>
              <div className={CARD_BODY_FLUSH_CLASS}>
                <CoordinatorFullCalendar
                  defenses={defenses ?? []}
                  institutionEvents={institutionEvents ?? []}
                  coordinatorId={user.email}
                  coordinatorName={user.name}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
