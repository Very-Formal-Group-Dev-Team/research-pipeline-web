'use client';

import React, { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { resetPasswordWithToken } from '@/lib/api/auth';
import { validatePassword } from '@/lib/passwordPolicy';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

const authCardClassName =
  'w-full bg-antiFlashWhite px-11 pt-7 pb-8 md:px-12 md:pt-8 rounded-xl shadow-medium border border-snow/60';

const authActionButtonClassName =
  'w-full h-11 flex items-center justify-center px-6 font-medium rounded-[3px] transition-all duration-200';

function fieldWrapperClassName(hasError: boolean) {
  return `flex items-center min-h-[36px] bg-snow border rounded-[3px] px-4 py-2 transition-colors ${
    hasError
      ? 'border-archivumRed ring-1 ring-archivumRed/30'
      : 'border-eerieBlack/15 focus-within:border-velvetWine focus-within:ring-1 focus-within:ring-velvetWine/40'
  }`;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }

    const passwordPolicyError = validatePassword(password);
    if (passwordPolicyError) {
      setError(passwordPolicyError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordWithToken(token, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  if (!token) {
    return (
      <div className={authCardClassName}>
        <p className="text-sm text-archivumRed text-center">Missing reset token. Please use the link from your email.</p>
        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-eerieBlack hover:underline">
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`${authCardClassName} text-center`}>
        <h1 className="text-2xl font-semibold text-eerieBlack">Password updated</h1>
        <p className="text-sm text-eerieBlack/70 mt-2">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={authCardClassName}>
      <div className="w-full mb-8 sm:mb-6">
        <div className="flex justify-center">
          <Image
            src="/brand/student-research-portal-logo-alt.png"
            alt="Archivum logo"
            width={64}
            height={64}
            className="w-12 h-12 sm:w-16 sm:h-16"
            priority
          />
        </div>
        <div className="text-center mt-3">
          <h1 className="text-3xl font-bold text-eerieBlack">Reset password</h1>
          <p className="text-sm text-eerieBlack/80 mt-1">Choose a new password for your account.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm text-eerieBlack mb-1.5">
            New password
          </label>
          <div className={fieldWrapperClassName(Boolean(error && !password))}>
            <FaLock className="text-eerieBlack/70 mr-3" aria-hidden />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="flex-1 bg-transparent outline-none text-sm text-eerieBlack"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-eerieBlack/50 hover:text-eerieBlack"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
          {passwordFocused ? (
            <PasswordStrengthIndicator password={password} visible={passwordFocused} />
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm text-eerieBlack mb-1.5">
            Confirm password
          </label>
          <div className={fieldWrapperClassName(Boolean(error && password !== confirmPassword))}>
            <FaLock className="text-eerieBlack/70 mr-3" aria-hidden />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-eerieBlack"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="text-eerieBlack/50 hover:text-eerieBlack"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-archivumRed text-center" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <button
          type="submit"
          disabled={loading}
          className={`${authActionButtonClassName} bg-velvetWine text-snow text-md shadow-sm hover:bg-velvetWine/90 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-eerieBlack/70">
        <Link href="/login" className="text-eerieBlack hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full">
      <Suspense
        fallback={
          <div className={`${authCardClassName} flex justify-center py-8`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-archivumRed" />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
