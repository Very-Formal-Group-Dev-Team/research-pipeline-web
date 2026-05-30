'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import { FiArrowLeft } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';

export default function CoordinatorRubricCreationPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/coordinator/rubrics">
            <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
              <FiArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Create Rubric</h1>
            <p className="text-neutral-600 mt-1">Define a new rubric for your institution</p>
          </div>
        </div>

        <Card>
          <div className="text-center py-12 text-neutral-500">
            <p className="text-lg mb-4">Rubric creation form coming soon</p>
            <p className="text-sm">This feature is under development</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}