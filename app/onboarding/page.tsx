'use client';

import React, { useEffect } from 'react';
import NewAccountConfigModal from '@/components/NewAccountConfigModal';
import useAuth from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getRoleHomePath } from '@/lib/auth/roleAccess';
import { isDebriefPending } from '@/lib/onboarding/debriefSession';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user?.role) return;

    if (isDebriefPending()) {
      router.replace('/onboarding/welcome');
    } else {
      router.replace(getRoleHomePath(user.role));
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="onboarding-ui min-h-screen flex items-center justify-center bg-deepSpaceBlue">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-snow" />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (user.role) {
    return (
      <div className="onboarding-ui min-h-screen flex items-center justify-center bg-deepSpaceBlue">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-snow" />
      </div>
    );
  }

  const handleClose = () => {
    // Don't allow closing without completing setup
  };

  return (
    <div className="onboarding-ui min-h-screen flex items-center justify-center bg-deepSpaceBlue px-4 py-8">
      <NewAccountConfigModal
        isOpen={true}
        onClose={handleClose}
        userId={user.id}
        userEmail={user.email}
        googleDisplayName={user.full_name ?? null}
        googlePhotoUrl={user.avatar_url ?? null}
      />
    </div>
  );
}
