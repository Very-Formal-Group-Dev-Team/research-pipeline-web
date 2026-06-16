'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import RoleGuidePanel from '@/components/onboarding/RoleGuidePanel';
import useAuth from '@/lib/hooks/useAuth';
import {
  getRoleHomePath,
  normalizeUserRole,
} from '@/lib/auth/roleAccess';
import {
  clearDebriefPending,
  isDebriefPending,
} from '@/lib/onboarding/debriefSession';

export default function OnboardingWelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const dashboardRole = normalizeUserRole(user?.role);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.role || !dashboardRole) {
      router.replace('/onboarding');
      return;
    }

    if (!isDebriefPending()) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [loading, user, dashboardRole, router]);

  const handleGoToDashboard = () => {
    if (!user?.role) return;
    clearDebriefPending();
    router.push(getRoleHomePath(user.role));
  };

  if (loading || !user || !dashboardRole || !isDebriefPending()) {
    return (
      <div className="onboarding-ui min-h-screen flex items-center justify-center bg-deepSpaceBlue">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-snow" />
      </div>
    );
  }

  const displayName = user.full_name?.trim() || 'there';

  return (
    <div className="onboarding-ui min-h-screen bg-deepSpaceBlue px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center text-snow">
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome, {displayName}!</h1>
          <p className="mt-2 text-sm leading-relaxed text-snow/80 md:text-md">
            Here is a quick overview of what you can do as a{' '}
            {dashboardRole === 'adviser' ? 'teacher / adviser' : dashboardRole}.
          </p>
        </div>

        <RoleGuidePanel role={dashboardRole} variant="concise" highlighted />

        <p className="text-center text-sm text-snow/70 md:text-md">
          For step-by-step workflows, tips, and guides for every role, visit the{' '}
          <Link
            href="/help?from=onboarding-welcome"
            className="text-snow/90 underline underline-offset-2 hover:text-snow transition-colors"
          >
            Help Center
          </Link>
          . It is also linked in the footer on any page.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={handleGoToDashboard}>
            Go to Dashboard
          </Button>
          <Link
            href="/help?from=onboarding-welcome"
            className="text-sm text-snow/90 underline underline-offset-2 hover:text-snow transition-colors md:text-md"
          >
            Browse all role guides
          </Link>
        </div>
      </div>
    </div>
  );
}
