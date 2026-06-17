'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/api/auth';

const authCardClassName =
  'w-full bg-antiFlashWhite px-11 pt-7 pb-8 md:px-12 md:pt-8 rounded-xl shadow-medium border border-snow/60';

const authActionButtonClassName =
  'w-full h-11 flex items-center justify-center px-6 font-medium rounded-[3px] transition-all duration-200';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const interval = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (cooldown > 0) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await requestPasswordReset(email.trim());
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setMessage(
      res.data?.message ||
        'If an account exists for that email, we sent password reset instructions.',
    );
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div className="w-full">
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
            <h1 className="text-3xl font-bold text-eerieBlack">Forgot password</h1>
            <p className="text-sm text-eerieBlack/80 mt-1">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-eerieBlack mb-1.5">
            Email Address
          </label>
          <div className="flex items-center min-h-[36px] bg-snow border border-eerieBlack/15 rounded-[3px] px-4 py-2">
            <svg className="w-4 h-4 text-eerieBlack/70 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-eerieBlack placeholder:text-eerieBlack/50"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-archivumRed text-center" role="alert">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 text-sm text-success-700 text-center" role="status">
            {message}
          </p>
        ) : null}

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className={`${authActionButtonClassName} bg-velvetWine text-snow text-md shadow-sm hover:bg-velvetWine/90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send reset link'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-eerieBlack/70">
          <Link href="/login" className="text-eerieBlack hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
