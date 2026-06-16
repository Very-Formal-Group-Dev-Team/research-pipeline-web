'use client';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import Footer from '@/components/layout/Footer';
import RoleGuidePanel from '@/components/onboarding/RoleGuidePanel';
import useAuth from '@/lib/hooks/useAuth';
import {
  getRoleHomePath,
  normalizeUserRole,
  type DashboardRole,
} from '@/lib/auth/roleAccess';
import { ROLE_GUIDE_ORDER } from '@/lib/content/roleGuides';

function HelpCenterContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userRole = normalizeUserRole(user?.role);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

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

  const fromOnboardingWelcome = searchParams.get('from') === 'onboarding-welcome';
  const backHref = fromOnboardingWelcome
    ? '/onboarding/welcome'
    : user.role
      ? getRoleHomePath(user.role)
      : '/login';
  const backLabel = fromOnboardingWelcome ? 'Back to welcome' : 'Back to dashboard';

  const contentWidthClass =
    'mx-auto w-full max-w-3xl px-4 sm:px-6 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className={`${contentWidthClass} flex items-center justify-between gap-4 py-5`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-archivumRed">
              Archivum
            </p>
            <h1 className="text-2xl font-bold text-primary-700">Help Center</h1>
          </div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-archivumRed transition-colors"
          >
            <FiArrowLeft className="text-base" />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className={`${contentWidthClass} py-8 space-y-6`}>
          <p className="text-sm leading-relaxed text-neutral-600 md:text-md">
            Learn what each role can do in Archivum, from starting a research project and submitting
            papers to scheduling defenses and managing institutions. Each guide includes an overview,
            key tasks, step-by-step workflows, detailed capabilities, and good-to-know tips. Your
            role is highlighted below.
          </p>

          <div className="space-y-6">
            {ROLE_GUIDE_ORDER.map((role: DashboardRole) => (
              <RoleGuidePanel
                key={role}
                role={role}
                variant="full"
                highlighted={userRole === role}
                defaultExpanded={userRole === role}
                collapsible
              />
            ))}
          </div>
        </div>
      </main>

      <Footer variant="public" />
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-archivumRed" />
        </div>
      }
    >
      <HelpCenterContent />
    </Suspense>
  );
}
