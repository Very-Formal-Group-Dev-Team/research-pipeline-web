'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { FiCalendar, FiClock, FiMapPin, FiUser } from 'react-icons/fi';
import EmptyState from '@/components/layout/EmptyState';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { getMyProjectDefenses, type Defense } from '@/lib/api/defenses';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const typeVariant: Record<string, 'primary' | 'warning' | 'success'> = {
  proposal: 'primary',
  midterm: 'warning',
  final: 'success',
};

export default function StudentDefensesPage() {
  const { user, handleLogout } = useDashboardUser('Student');
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await getMyProjectDefenses();
      if (!cancelled && res.data) setDefenses(res.data);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Defense Schedule</h1>
          <p className="text-neutral-600 mt-1">Your upcoming defense schedules</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : defenses.length > 0 ? (
          <div className="space-y-4">
            {defenses.map((defense) => (
              <Card key={defense.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-xl text-primary-700">
                      {defense.project_title}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-0.5">{defense.project_code}</p>
                    <Badge
                      variant={typeVariant[defense.defense_type] || 'warning'}
                      className="mt-2 capitalize"
                    >
                      {defense.defense_type} Defense
                    </Badge>
                  </div>
                  <Badge
                    variant={defense.status === 'scheduled' ? 'primary' : 'default'}
                    className="capitalize"
                  >
                    {defense.status}
                  </Badge>
                </div>

                <div className="space-y-3 text-neutral-700">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-accent-500 flex-shrink-0" />
                    <span>{formatDate(defense.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiClock className="text-accent-500 flex-shrink-0" />
                    <span>
                      {formatTime(defense.start_time)}
                      {defense.end_time ? ` - ${formatTime(defense.end_time)}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMapPin className="text-accent-500 flex-shrink-0" />
                    <span>{defense.location}</span>
                  </div>
                  {defense.created_by_name && (
                    <div className="flex items-center gap-3">
                      <FiUser className="text-accent-500 flex-shrink-0" />
                      <span>Scheduled by {defense.created_by_name}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiCalendar />}
              title="No upcoming defenses"
              description="You don't have any scheduled defenses at the moment."
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
