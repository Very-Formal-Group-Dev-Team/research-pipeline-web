'use client';

import React from 'react';
import Link from 'next/link';
import { FiBookOpen, FiClipboard, FiUsers } from 'react-icons/fi';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardDescription, CardTitle } from '@/components/ui/Card';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';

export default function AdminDashboardPage() {
  const { user, handleLogout } = useDashboardUser('Admin');

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Welcome, {user.name || 'Admin'}!</h1>
          <p className="mt-1 text-neutral-600">
            Manage institutions, users, and platform access for Archivum
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/institutions" className="block">
            <Card hover className="h-full">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary-100 p-3 text-primary-700">
                  <FiBookOpen className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <CardTitle className="!text-lg">Institutions</CardTitle>
                  <CardDescription lines={2} className="!mt-2">
                    Register schools and manage their program catalogs
                  </CardDescription>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin/users" className="block">
            <Card hover className="h-full">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary-100 p-3 text-primary-700">
                  <FiUsers className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <CardTitle className="!text-lg">Users</CardTitle>
                  <CardDescription lines={2} className="!mt-2">
                    Assign roles, manage institutions, and deactivate accounts
                  </CardDescription>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin/audit" className="block">
            <Card hover className="h-full">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary-100 p-3 text-primary-700">
                  <FiClipboard className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <CardTitle className="!text-lg">Audit Log</CardTitle>
                  <CardDescription lines={2} className="!mt-2">
                    Review logins, role changes, uploads, and other platform activity
                  </CardDescription>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
