'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';

export default function AdminDashboardPage() {
  const { user, handleLogout } = useDashboardUser('Admin');

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-primary-700">Welcome, {user.name || 'Admin'}!</h1>
        <p className="text-neutral-600">
          Your admin account is set up. Admin tools will be available here soon.
        </p>
      </div>
    </DashboardLayout>
  );
}
