'use client';

import React from 'react';
import NewAccountConfigModal from '@/components/NewAccountConfigModal';
import useAuth from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crimsonRed" />
      </div>
    );
  }

  if (!user) {
    // No session — send to login. Client middleware allowed access to login
    // earlier, so this won't loop with the server middleware.
    router.replace('/login');
    return null;
  }

  const handleClose = () => {
    // Don't allow closing without completing setup
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
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

