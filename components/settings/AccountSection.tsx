'use client';

import React from 'react';
import Link from 'next/link';
import Card, { CardTitle } from '@/components/ui/Card';
import type { UserProfileView } from '@/lib/hooks/useUserProfile';
import { getRoleProfilePath } from '@/lib/auth/roleAccess';
import type { DashboardRole } from '@/lib/auth/roleAccess';
import {
  settingsInlineLinkClassName,
  settingsSectionIntroClassName,
} from '@/components/settings/settingsUi';
import {
  formControlClassName,
  formControlTextSizeClassName,
  formLabelClassName,
} from '@/lib/utils/formControls';

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={formLabelClassName}>{label}</p>
      <p
        className={`${formControlClassName} ${formControlTextSizeClassName} bg-neutral-50 text-neutral-700`}
      >
        {value}
      </p>
    </div>
  );
}

function authProviderLabel(provider?: 'email' | 'google'): string {
  if (provider === 'google') return 'Google';
  if (provider === 'email') return 'Email & password';
  return 'Unknown';
}

export default function AccountSection({
  profile,
  role,
}: {
  profile: UserProfileView;
  role: DashboardRole;
}) {
  const profilePath = getRoleProfilePath(role);

  return (
    <Card>
      <CardTitle className="mb-4">Account</CardTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Email" value={profile.email || '—'} />
        <ReadOnlyField label="Role" value={profile.role || '—'} />
        <ReadOnlyField
          label="Institution"
          value={profile.institutionName || 'Not assigned'}
        />
        <ReadOnlyField
          label="Sign-in method"
          value={authProviderLabel(profile.authProvider)}
        />
      </div>
      <p className={`mt-4 ${settingsSectionIntroClassName}`}>
        Email and role are managed by your institution. Update your display name and avatar on your{' '}
        <Link href={profilePath} className={settingsInlineLinkClassName}>
          profile page
        </Link>
        .
      </p>
    </Card>
  );
}
