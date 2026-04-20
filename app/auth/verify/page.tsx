'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/api/auth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    (async () => {
      const res = await verifyEmail(token);

      if (res.error) {
        setStatus('error');
        setMessage(res.error);
        return;
      }

      if (res.data?.token) {
        document.cookie = `session_token=${encodeURIComponent(res.data.token)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      }

      setStatus('success');
      setMessage(res.data?.message || 'Email verified successfully!');

      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 1500);
    })();
  }, [token, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-lightGray text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-crimsonRed rounded-xl mb-2">
          <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>

        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crimsonRed" />
            </div>
            <p className="text-neutral-600">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-darkSlateBlue">Email Verified!</h2>
            <p className="text-neutral-600">{message}</p>
            <p className="text-sm text-neutral-400">Redirecting to complete your profile...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full">
              <svg className="w-7 h-7 text-crimsonRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-darkSlateBlue">Verification Failed</h2>
            <p className="text-neutral-600">{message}</p>
            <button
              onClick={() => router.push('/register')}
              className="mt-4 inline-block px-6 py-2.5 bg-crimsonRed text-white rounded-lg font-medium hover:bg-crimsonRed/90 transition-colors"
            >
              Back to Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crimsonRed" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
