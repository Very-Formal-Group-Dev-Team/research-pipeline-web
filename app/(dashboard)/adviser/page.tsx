'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import AdviserFullCalendar from '@/components/adviser/AdviserFullCalendar';
import { FiUsers, FiFolder, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { MOCK_ADVISER_STATS } from '@/lib/mock-data';
import { getMyProjectDefenses, type Defense } from '@/lib/api/defenses';

export default function AdviserDashboardPage() {
  const { user, isLoading, handleLogout } = useDashboardUser('Adviser');
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [defensesLoading, setDefensesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDefenses() {
      const res = await getMyProjectDefenses();
      if (!cancelled && res.data) setDefenses(res.data);
      if (!cancelled) setDefensesLoading(false);
    }

    loadDefenses();
    return () => { cancelled = true; };
  }, []);

  const loading = isLoading || defensesLoading;

  const stats = [
    { icon: <FiUsers />, label: 'Total Advisees', value: String(MOCK_ADVISER_STATS.totalAdvisees), color: 'bg-accent-100 text-accent-600' },
    { icon: <FiFolder />, label: 'Active Projects', value: String(MOCK_ADVISER_STATS.activeProjects), color: 'bg-success-100 text-success-600' },
    { icon: <FiCalendar />, label: 'Upcoming Defenses', value: String(defenses.length), color: 'bg-warning-100 text-warning-600', href: '/adviser/meetings' },
    { icon: <FiTrendingUp />, label: 'Completed Projects', value: String(MOCK_ADVISER_STATS.completedProjects), color: 'bg-primary-100 text-primary-600' },
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

            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-row-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <Card key={idx} padding="md">
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
              <div className="grid grid-row gap-6">
                <JoinGroupCard />

                <Card>
                  <CardTitle>Pending Reviews</CardTitle>
                  <CardDescription>Documents awaiting your feedback</CardDescription>
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-neutral-600">No pending reviews</p>
                  </div>
                </Card>
              </div>

              <Card>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your advisees</CardDescription>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-neutral-600">No recent activity</p>
                </div>
              </Card>
            </div>

            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-neutral-200 px-6 py-4">
                <CardTitle>Defense Calendar</CardTitle>
                <CardDescription>
                  Month, week, day, year, and agenda views with defense type tags
                </CardDescription>
              </div>
              <div className="p-3 pt-0 sm:p-4">
                <AdviserFullCalendar
                  defenses={defenses}
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
