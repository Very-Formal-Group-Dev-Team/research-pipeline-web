'use client';

import React, { useState } from 'react';
import { FiLock, FiLogOut } from 'react-icons/fi';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Card, { CardTitle } from '@/components/ui/Card';
import { changePassword, resendVerification } from '@/lib/api/auth';
import { performLogout } from '@/lib/auth/logout';
import type { UserProfileView } from '@/lib/hooks/useUserProfile';
import { settingsSectionIntroClassName } from '@/components/settings/settingsUi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SecuritySection({
  profile,
  onLogout,
}: {
  profile: UserProfileView;
  onLogout?: () => void;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isEmailAccount = profile.authProvider === 'email';
  const needsVerification = isEmailAccount && !profile.emailVerified;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsSaving(true);
    const res = await changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    });
    setIsSaving(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResendVerification = async () => {
    if (!profile.email) return;
    setIsResending(true);
    const res = await resendVerification(profile.email);
    setIsResending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(res.data?.message || 'Verification email sent');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await performLogout();
    onLogout?.();
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      {needsVerification ? (
        <Card className="border-l-4 border-l-warning-500 bg-warning-50/40">
          <h3 className="text-lg font-semibold text-primary-700">Email not verified</h3>
          <p className={`mb-4 mt-1 ${settingsSectionIntroClassName}`}>
            Verify your email address to secure your account and receive important updates.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? 'Sending…' : 'Resend verification email'}
          </Button>
        </Card>
      ) : null}

      <Card>
        <CardTitle className="mb-4 flex items-center gap-2 text-primary-700">
          <FiLock className="text-coordinator-rose" />
          Password
        </CardTitle>
        {isEmailAccount ? (
          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Button type="submit" disabled={isSaving} className="coordinator-btn-primary">
              {isSaving ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        ) : (
          <p className={settingsSectionIntroClassName}>
            Your account uses Google sign-in. Password changes are managed through your Google account.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4 flex items-center gap-2 text-primary-700">
          <FiLogOut className="text-coordinator-rose" />
          Session
        </CardTitle>
        <p className={`mb-4 ${settingsSectionIntroClassName}`}>
          Sign out of Archivum on this device. Your session will be cleared on the server.
        </p>
        <Button
          type="button"
          variant="outline"
          className="coordinator-btn-secondary"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </Card>
    </div>
  );
}
