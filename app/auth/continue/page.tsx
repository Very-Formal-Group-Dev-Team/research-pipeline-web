"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuth from '@/lib/hooks/useAuth';
import { getRoleHomePath } from '@/lib/auth/roleAccess';

function AuthContinueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && typeof document !== 'undefined') {
      document.cookie = `session_token=${encodeURIComponent(urlToken)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      window.history.replaceState({}, '', '/auth/continue');
    }
    setTokenSaved(true);
  }, [searchParams]);

  const { user, loading } = useAuth();

  useEffect(() => {
    if (!tokenSaved || loading) return;

    if (!user) {
      if (typeof document !== 'undefined') {
        document.cookie = 'session_token=; path=/; max-age=0; samesite=lax';
      }
      router.replace('/login');
      return;
    }

    const needsOnboarding = !user.full_name || !user.role;
    if (needsOnboarding) {
      router.replace('/onboarding');
      return;
    }

    router.replace(getRoleHomePath(user.role));
  }, [tokenSaved, loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-archivumRed" />
    </div>
  );
}

export default function AuthContinue() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-archivumRed" />
        </div>
      }
    >
      <AuthContinueContent />
    </Suspense>
  );
}
