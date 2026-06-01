"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import { getUser, login, register, oAuthSignIn, resendVerification } from "@/lib/api/auth";

type Mode = "login" | "register";

function GoogleSignInButton() {
    const handleGoogleSignIn = async () => {
      // Demo: just redirect to onboarding
      const result = await oAuthSignIn('google', '/auth/continue');
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    };

    return (
      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-velvetWine border border-velvetWine rounded-[3px] hover:bg-velvetWine/90 transform transition-all duration-200 font-medium text-snow group min-h-[48px]"
        aria-label="Sign in with Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="group-hover:text-snow transition-colors">Continue with Google</span>
      </button>
    );
  }
  

function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function resolveExistingSession() {
      if (typeof document === 'undefined') {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      const hasSessionToken = /(?:^|;\s*)session_token=([^;]*)/.test(document.cookie);
      if (!hasSessionToken) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      const result = await getUser();
      if (cancelled) return;

      if (result.data && !result.error) {
        router.replace('/auth/continue');
        return;
      }

      if (result.status === 401) {
        document.cookie = 'session_token=; path=/; max-age=0; samesite=lax';
      }

      setCheckingSession(false);
    }

    resolveExistingSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <div className="w-full flex items-center justify-center py-12 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-velvetWine" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = mode === "register"
        ? await register({ email, password, full_name: fullName })
        : await login({ email, password });

      if (result.error) {
        setMessage(result.error);
        setLoading(false);
        return;
      }

      if (result.data?.pending) {
        setPendingVerification(true);
        setMessage(result.data.message || 'Please check your email to verify your account.');
        setLoading(false);
        return;
      }

      if (result.data?.token) {
        document.cookie = `session_token=${encodeURIComponent(result.data.token)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      }

      setMessage(mode === "register" ? "Registration successful!" : "Signed in successfully");
      setTimeout(() => {
        window.location.href = "/auth/continue";
      }, 200);
    } catch {
      setMessage("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    const res = await resendVerification(email);
    setLoading(false);
    if (res.error) {
      setMessage(res.error);
    } else {
      setMessage(res.data?.message || 'Verification email resent!');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }

  if (pendingVerification) {
    return (
      <div className="w-full">
        <div className="w-full bg-antiFlashWhite rounded-sm shadow-medium px-6 py-8 sm:p-8 border border-snow/60 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-velvetWine/15 rounded-full">
            <svg className="w-7 h-7 text-velvetWine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-eerieBlack">Check Your Email</h2>
          <p className="text-eerieBlack/75">
            We sent a verification link to <span className="font-semibold text-eerieBlack">{email}</span>.
            Click the link in the email to verify your account.
          </p>
          {message && (
            <div className={`p-3 rounded-sm text-sm font-medium border ${
              message.includes('error') || message.includes('Failed') || message.includes('failed')
                ? 'bg-archivumRed/10 text-archivumRed border-archivumRed/30'
                : 'bg-deepSeaGreen/10 text-deepSeaGreen border-deepSeaGreen/30'
            }`}>
              {message}
            </div>
          )}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="w-full py-3.5 bg-velvetWine text-snow font-medium rounded-[3px] hover:bg-velvetWine/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[48px]"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => { setPendingVerification(false); setMessage(null); }}
              className="w-full py-2.5 text-eerieBlack/70 font-medium text-sm hover:text-eerieBlack transition-colors"
            >
              Back to {mode === 'register' ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
        <form onSubmit={handleSubmit} className="bg-antiFlashWhite px-10 py-12 md:px-12 rounded-xl shadow-medium border border-snow/60">
          {/* Logo + Header */}
          <div className="w-full mb-8 sm:mb-6">
            <div className="flex justify-center">
              <img src="/brand/student-research-portal-logo-alt.png" alt="logo" className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <div className="text-center mt-3">
              <h1 className="text-3xl font-bold text-eerieBlack">{mode === 'login' ? 'Welcome back' : 'Get Started'}</h1>
              <p className="text-sm text-eerieBlack/80 mt-1">{mode === 'login' ? 'Sign in to your account' : 'Create your account to continue'}</p>
            </div>
          </div>

          <div className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-eerieBlack mb-2.5">Full Name</label>
                <div className="flex items-center min-h-[48px] bg-snow border border-eerieBlack/15 rounded-[3px] px-4 py-3 focus-within:border-velvetWine focus-within:ring-1 focus-within:ring-velvetWine/40 transition-colors">
                  <FaUser className="text-eerieBlack/70 mr-3" />
                  <input className="flex-1 bg-transparent outline-none text-sm text-eerieBlack placeholder:text-eerieBlack/40" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-eerieBlack mb-2.5">Email Address</label>
              <div className="flex items-center min-h-[42px] bg-snow border border-eerieBlack/15 rounded-[3px] px-4 py-3 focus-within:border-velvetWine focus-within:ring-1 focus-within:ring-velvetWine/40 transition-colors">
                <svg className="w-4 h-4 text-eerieBlack/70 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                <input className="flex-1 bg-transparent outline-none text-sm sm:text-md text-eerieBlack placeholder:text-eerieBlack/50" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-eerieBlack mb-2.5">Password</label>
              <div className="flex items-center min-h-[42px] bg-snow border border-eerieBlack/15 rounded-[3px] px-4 py-3 focus-within:border-velvetWine focus-within:ring-1 focus-within:ring-velvetWine/40 transition-colors">
                <FaLock className="text-eerieBlack/70 mr-3" />
                <input className="flex-1 bg-transparent outline-none text-sm sm:text-md text-eerieBlack placeholder:text-eerieBlack/40" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex justify-between gap-3 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm pt-1">
                <label className="flex items-center gap-2.5 text-eerieBlack/80">
                  <input id="rememberMe" className="w-4 h-4 shrink-0 bg-snow border border-eerieBlack/20 accent-velvetWine" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-eerieBlack/80 hover:text-eerieBlack transition-colors sm:text-right">Forgot Password?</a>
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-[3px] text-sm mt-5 text-center font-medium border ${message.includes('error') || message.includes('Failed') || message.includes('invalid') || message.includes('already') ? 'bg-archivumRed/10 text-archivumRed border-archivumRed/20' : 'bg-deepSeaGreen/10 text-deepSeaGreen border-deepSeaGreen/20'}`}>
              {message}
            </div>
          )}

          <div className="mt-8">
            <button type="submit" disabled={loading} className="w-full py-3 min-h-[42px] bg-velvetWine text-snow text-md rounded-[3px] shadow-sm hover:bg-velvetWine/90 transition-colors disabled:opacity-50">
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="flex items-center my-6 sm:my-5 opacity-70">
            <div className="flex-1 h-px bg-eerieBlack/20"></div>
            <div className="px-4 text-sm text-eerieBlack">Or</div>
            <div className="flex-1 h-px bg-eerieBlack/20"></div>
          </div>

          <div className="mb-6 sm:mb-4">
            <GoogleSignInButton />
          </div>

          <p className="text-center text-sm text-eerieBlack/80 px-1 pb-1">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <a href={mode === 'login' ? '/register' : '/login'} className="font-semibold text-eerieBlack hover:text-velvetWine transition-colors">{mode === 'login' ? 'Sign up' : 'Sign in'}</a>
          </p>
        </form>
    </div>
  );
}

export default AuthForm