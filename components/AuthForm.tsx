"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import Button from "./Button"
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
        className="flex items-center justify-center gap-3 px-6 py-2.5 bg-ivory border border-lightGray rounded-lg hover:bg-lightGray transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium text-darkSlateBlue group"
        aria-label="Sign in with Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="group-hover:text-darkSlateBlue transition-colors">Continue with Google</span>
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
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crimsonRed" />
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
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-lightGray text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-crimsonRed/10 rounded-full">
            <svg className="w-7 h-7 text-crimsonRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-darkSlateBlue">Check Your Email</h2>
          <p className="text-neutral-600">
            We sent a verification link to <span className="font-semibold text-darkSlateBlue">{email}</span>.
            Click the link in the email to verify your account.
          </p>
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium border ${
              message.includes('error') || message.includes('Failed') || message.includes('failed')
                ? 'bg-crimsonRed/10 text-crimsonRed border-crimsonRed/30'
                : 'bg-mutedGreen/10 text-mutedGreen border-mutedGreen/30'
            }`}>
              {message}
            </div>
          )}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="w-full py-2.5 bg-neutral-100 text-darkSlateBlue font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => { setPendingVerification(false); setMessage(null); }}
              className="w-full py-2.5 text-neutral-500 font-medium text-sm hover:text-darkSlateBlue transition-colors"
            >
              Back to {mode === 'register' ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-lightGray">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-crimsonRed rounded-xl mb-2">
              <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-darkSlateBlue">
              {mode === "login" ? "Welcome Back" : "Get Started"}
            </h1>
            <p className="text-gray-600 text-sm">
              {mode === "login" ? "Sign in to your account" : "Create your account to continue"}
            </p>
          </div>
        
          {mode === "register" && (
            <div className="relative group">
              <label className="block text-sm font-medium text-darkSlateBlue mb-2">Full Name</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pl-11 bg-ivory border border-lightGray rounded-lg outline-none transition-all duration-200 focus:border-crimsonRed focus:ring-2 focus:ring-crimsonRed/20 hover:border-darkSlateBlue text-darkSlateBlue placeholder:text-gray-400"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-crimsonRed transition-colors" />
              </div>
            </div>
          )}

          <div className="relative group">
            <label className="block text-sm font-medium text-darkSlateBlue mb-2">Email Address</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 pl-11 bg-ivory border border-lightGray rounded-lg outline-none transition-all duration-200 focus:border-crimsonRed focus:ring-2 focus:ring-crimsonRed/20 hover:border-darkSlateBlue text-darkSlateBlue placeholder:text-gray-400"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-crimsonRed transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>

          <div className="relative group">
            <label className="block text-sm font-medium text-darkSlateBlue mb-2">Password</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 pl-11 bg-ivory border border-lightGray rounded-lg outline-none transition-all duration-200 focus:border-crimsonRed focus:ring-2 focus:ring-crimsonRed/20 hover:border-darkSlateBlue text-darkSlateBlue placeholder:text-gray-400"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-crimsonRed transition-colors" />
            </div>
          </div>

          {mode === "login" && (
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center cursor-pointer group">
                <input 
                  id="rememberMe" 
                  className="w-4 h-4 accent-crimsonRed rounded cursor-pointer"
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-gray-600 group-hover:text-darkSlateBlue transition-colors">
                  Remember me
                </span>
              </label>

              <a href="#" className="text-crimsonRed hover:text-darkSlateBlue font-medium transition-colors">
                Forgot Password?
              </a>
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm text-center font-medium border ${
              message.includes("error") || message.includes("Failed") || message.includes("invalid") || message.includes("already") 
                ? "bg-crimsonRed/10 text-crimsonRed border-crimsonRed/30" 
                : "bg-mutedGreen/10 text-mutedGreen border-mutedGreen/30"
            }`}>
              {message}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-crimsonRed text-white font-semibold rounded-lg hover:bg-crimsonRed/90 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-lightGray"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-600">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleSignInButton />
          </div>

          <p className="text-center text-sm text-gray-600">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <a href={mode === "login" ? "/register" : "/login"} className="font-semibold text-crimsonRed hover:text-darkSlateBlue transition-colors">
              {mode === "login" ? "Sign up" : "Sign in"}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default AuthForm