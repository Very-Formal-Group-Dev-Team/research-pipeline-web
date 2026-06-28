"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuth from '@/lib/hooks/useAuth';
import { getRoleHomePath } from '@/lib/auth/roleAccess';
import { isDebriefPending } from '@/lib/onboarding/debriefSession';
import { clearSessionTokenCookie, setSessionTokenCookie } from '@/lib/auth-session';
import { isAccountDeactivatedError, redirectForDeactivatedAccount } from '@/lib/auth/accountDeactivated';

function AuthContinueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (!urlToken) {
      setTokenSaved(true);
      return;
    }

    void (async () => {
      await setSessionTokenCookie(urlToken, true);
      window.history.replaceState({}, '', '/auth/continue');
      setTokenSaved(true);
    })();
  }, [searchParams]);

  const { user, loading, error } = useAuth();

  useEffect(() => {
    if (!tokenSaved || loading) return;

    if (!user) {
      if (isAccountDeactivatedError(error)) {
        void redirectForDeactivatedAccount();
        return;
      }
      void clearSessionTokenCookie();
      router.replace('/login');
      return;
    }

    const needsOnboarding = !user.full_name || !user.role;
    if (needsOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (isDebriefPending()) {
      router.replace('/onboarding/welcome');
      return;
    }

    router.replace(getRoleHomePath(user.role));
  }, [tokenSaved, loading, user, error, router]);

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
