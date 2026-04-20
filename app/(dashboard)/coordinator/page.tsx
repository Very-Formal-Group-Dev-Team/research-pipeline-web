'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';
import { FiUsers, FiFolder, FiCalendar, FiBookOpen } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getCoordinatorDashboard,
  type CoordinatorStats,
  type Institution,
} from '@/lib/api/coordinator';

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [stats, setStats] = useState<CoordinatorStats | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await getCoordinatorDashboard();
      if (!cancelled && res.data) {
        setStats(res.data.stats);
        setInstitution(res.data.institution);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statCards = stats
    ? [
        { icon: <FiFolder />, label: 'Total Projects', value: String(stats.totalProjects), color: 'bg-primary-100 text-primary-600', href: '/coordinator/projects' },
        { icon: <FiUsers />, label: 'Faculty Advisers', value: String(stats.totalAdvisers), color: 'bg-accent-100 text-accent-600', href: '/coordinator/advisers' },
        { icon: <FiCalendar />, label: 'Pending Defenses', value: String(stats.pendingDefenses), color: 'bg-warning-100 text-warning-600', href: '/coordinator/defenses' },
        { icon: <FiBookOpen />, label: 'Courses', value: String(stats.totalCourses), color: 'bg-success-100 text-success-600', href: '/coordinator/courses' },
      ]
    : [];

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Coordinator Dashboard</h1>
          <p className="text-neutral-600 mt-1">
            {institution ? `${institution.name} — Institution-wide overview` : 'System-wide overview and management'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, idx) => (
                <Card key={idx} padding="md" hover onClick={() => router.push(stat.href)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <div className="text-2xl">{stat.icon}</div>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card hover onClick={() => router.push('/coordinator/defenses')}>
                <CardTitle>Defense Verification</CardTitle>
                <CardDescription>Review and approve defense schedules proposed by advisers</CardDescription>
                <div className="mt-4">
                  {stats && stats.pendingDefenses > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning-100 text-warning-700">
                      {stats.pendingDefenses} pending verification
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-500">No pending defenses</span>
                  )}
                </div>
              </Card>

              <Card hover onClick={() => router.push('/coordinator/courses')}>
                <CardTitle>Course Management</CardTitle>
                <CardDescription>Create and manage courses for your institution</CardDescription>
                <div className="mt-4">
                  <span className="text-sm text-neutral-500">
                    {stats ? `${stats.totalCourses} courses` : '0 courses'}
                  </span>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
