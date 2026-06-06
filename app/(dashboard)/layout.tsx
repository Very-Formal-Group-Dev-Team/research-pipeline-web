'use client';

import React, { useEffect } from 'react';
import useAuth from '@/lib/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import {
  canAccessPath,
  getRoleHomePath,
  isRoleProtectedPath,
} from '@/lib/auth/roleAccess';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.role && isRoleProtectedPath(pathname)) {
      router.replace('/onboarding');
      return;
    }

    if (user.role && isRoleProtectedPath(pathname) && !canAccessPath(user.role, pathname)) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-archivumRed" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const lacksRoleForDashboard = !user.role && isRoleProtectedPath(pathname);
  const wrongRoleDashboard =
    Boolean(user.role) &&
    isRoleProtectedPath(pathname) &&
    !canAccessPath(user.role, pathname);

  if (lacksRoleForDashboard || wrongRoleDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-archivumRed" />
      </div>
    );
  }

  return <>{children}</>;
}
