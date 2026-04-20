'use client';

import React, { useEffect } from 'react';
import useAuth from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

/**
 * Dashboard layout — passthrough for frontend demo (no auth checks).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crimsonRed" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
