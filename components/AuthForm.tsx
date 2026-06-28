"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { getUser, login, register, oAuthSignIn, resendVerification } from "@/lib/api/auth";
import { type AuthField, type AuthErrorTarget, resolveApiError, validateAuthForm } from "@/lib/auth-form-validation";
import {
  ACCOUNT_DEACTIVATED_URL_ERROR,
  isAccountDeactivatedError,
} from "@/lib/auth/accountDeactivated";
import DeactivatedAccountAlert from "@/components/auth/DeactivatedAccountAlert";
import {
  clearSessionTokenCookie,
  hydrateSessionFromServer,
  loadRememberMePreference,
  saveRememberMePreference,
  setSessionTokenCookie,
} from "@/lib/auth-session";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

type Mode = "login" | "register";

type FormFeedback = {
  text: string;
  isError: boolean;
};

const authCardClassName =
  'w-full bg-antiFlashWhite px-11 pt-7 pb-8 md:px-12 md:pt-8 rounded-xl shadow-medium border border-snow/60';

const authActionButtonClassName =
  'w-full h-11 flex items-center justify-center px-6 font-medium rounded-[3px] transition-all duration-200';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="mt-1 text-xs text-archivumRed" role="alert">
      {message}
    </p>
  );
}

function FormError({ message, errorRef }: { message?: string | null; errorRef?: React.RefObject<HTMLParagraphElement | null> }) {
  if (!message) return null;

  return (
    <p
      ref={errorRef}
      id="auth-form-error"
      className="mb-3 text-sm text-center text-archivumRed"
      role="alert"
    >
      {message}
    </p>
  );
}

function PasswordVisibilityButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="shrink-0 ml-2 text-eerieBlack/50 hover:text-eerieBlack transition-colors"
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
    >
      {visible ? <FaEyeSlash className="w-4 h-4" aria-hidden /> : <FaEye className="w-4 h-4" aria-hidden />}
    </button>
  );
}

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
        className={`${authActionButtonClassName} gap-3 bg-white border border-eerieBlack/20 text-eerieBlack/80 hover:bg-neutral-50 hover:border-eerieBlack/35 active:bg-neutral-100 group`}
        aria-label="Sign in with Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="transition-colors">Continue with Google</span>
      </button>
    );
  }
  

function AuthForm({ mode }: { mode: Mode }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AuthField, string>>>({});
  const [highlightedFields, setHighlightedFields] = useState<Partial<Record<AuthField, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeactivatedAlert, setShowDeactivatedAlert] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  const router = useRouter();

  const fieldRefs: Record<AuthField, React.RefObject<HTMLInputElement | null>> = {
    fullName: fullNameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  };

  function showFeedback(text: string, isError: boolean) {
    setFeedback({ text, isError });
  }

  function clearErrors() {
    setFieldErrors({});
    setHighlightedFields({});
    setFormError(null);
    setShowDeactivatedAlert(false);
  }

  function clearFieldError(field: AuthField) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setHighlightedFields((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
    setShowDeactivatedAlert(false);
  }

  function applyAuthError(target: AuthErrorTarget) {
    if (target.scope === 'form' && target.deactivated) {
      setShowDeactivatedAlert(true);
      setFormError(null);
      setFieldErrors({});
      setHighlightedFields({});
      return;
    }

    setShowDeactivatedAlert(false);
    if (target.scope === 'form') {
      setFormError(target.message);
      setFieldErrors({});
      const highlights = (target.fields ?? []).reduce<Partial<Record<AuthField, boolean>>>((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
      setHighlightedFields(highlights);
      return;
    }

    setFormError(null);
    setHighlightedFields({});
    setFieldErrors({ [target.field]: target.message });
    focusField(target.field);
  }

  function fieldHasError(field: AuthField) {
    return !!fieldErrors[field] || !!highlightedFields[field];
  }

  function fieldWrapperClassName(hasError: boolean) {
    return `flex items-center min-h-[36px] bg-snow border rounded-[3px] px-4 py-2 transition-colors ${
      hasError
        ? 'border-archivumRed ring-1 ring-archivumRed/30'
        : 'border-eerieBlack/15 focus-within:border-velvetWine focus-within:ring-1 focus-within:ring-velvetWine/40'
    }`;
  }

  function focusField(field: AuthField) {
    fieldRefs[field].current?.focus();
  }

  useEffect(() => {
    setRememberMe(loadRememberMePreference());
  }, []);

  useEffect(() => {
    if (mode !== 'login') return;
    const oauthError = searchParams.get('error');
    if (oauthError === ACCOUNT_DEACTIVATED_URL_ERROR) {
      setShowDeactivatedAlert(true);
      void clearSessionTokenCookie();
      window.history.replaceState({}, '', '/login');
    }
  }, [mode, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function resolveExistingSession() {
      if (typeof document === 'undefined') {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      await hydrateSessionFromServer();
      const result = await getUser();
      if (cancelled) return;

      if (result.data && !result.error) {
        router.replace('/auth/continue');
        return;
      }

      if (result.status === 403 && isAccountDeactivatedError(result.error)) {
        await clearSessionTokenCookie();
        setShowDeactivatedAlert(true);
        setCheckingSession(false);
        return;
      }

      if (result.status === 401) {
        clearSessionTokenCookie();
      }

      setCheckingSession(false);
    }

    resolveExistingSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!formError) return;
    formErrorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [formError]);

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
    clearErrors();

    const validationError = validateAuthForm({
      mode,
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (validationError) {
      applyAuthError(validationError);
      setLoading(false);
      return;
    }

    try {
      const result = mode === "register"
        ? await register({ email: email.trim(), password, full_name: fullName.trim() })
        : await login({ email: email.trim(), password, remember_me: rememberMe });

      const apiError = result.error || (result.data as { error?: string } | null)?.error;
      if (apiError) {
        applyAuthError(resolveApiError(apiError));
        setLoading(false);
        return;
      }

      if (result.data?.pending) {
        setPendingVerification(true);
        showFeedback(result.data.message || 'Please check your email to verify your account.', false);
        setLoading(false);
        return;
      }

      if (result.data?.token) {
        if (mode === 'login') {
          saveRememberMePreference(rememberMe);
        }
        await setSessionTokenCookie(result.data.token, mode === 'register' ? true : rememberMe);
      }

      window.location.href = "/auth/continue";
    } catch {
      applyAuthError(resolveApiError('Something went wrong. Please try again.'));
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
      showFeedback(res.error, true);
    } else {
      showFeedback(res.data?.message || 'We sent another verification email. Check your inbox.', false);
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
        <div className={`${authCardClassName} text-center space-y-6`}>
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
          {feedback && (
            <p
              role={feedback.isError ? 'alert' : 'status'}
              className={`text-xs ${feedback.isError ? 'text-archivumRed' : 'text-deepSeaGreen'}`}
            >
              {feedback.text}
            </p>
          )}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="w-full py-3 bg-velvetWine text-snow font-medium rounded-[3px] hover:bg-velvetWine/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => { setPendingVerification(false); setFeedback(null); }}
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
        <form onSubmit={handleSubmit} noValidate className={authCardClassName}>
          {/* Logo + Header */}
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
              <h1 className="text-3xl font-bold text-eerieBlack">{mode === 'login' ? 'Welcome back' : 'Get Started'}</h1>
              <p className="text-sm text-eerieBlack/80 mt-1">{mode === 'login' ? 'Sign in to your account' : 'Create your account to continue'}</p>
            </div>
          </div>

          {showDeactivatedAlert ? (
            <div className="mb-6">
              <DeactivatedAccountAlert />
            </div>
          ) : null}

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-eerieBlack mb-1.5">Full Name</label>
                <div className={fieldWrapperClassName(fieldHasError('fullName'))}>
                  <FaUser className="text-eerieBlack/70 mr-3" />
                  <input
                    ref={fullNameRef}
                    className="flex-1 bg-transparent outline-none text-sm text-eerieBlack placeholder:text-eerieBlack/40"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      clearFieldError('fullName');
                    }}
                    aria-invalid={fieldHasError('fullName')}
                    aria-describedby={fieldErrors.fullName ? 'auth-fullName-error' : formError && highlightedFields.fullName ? 'auth-form-error' : undefined}
                    autoComplete="name"
                  />
                </div>
                <FieldError id="auth-fullName-error" message={fieldErrors.fullName} />
              </div>
            )}

            <div>
              <label className="block text-sm text-eerieBlack mb-1.5">Email Address</label>
              <div className={fieldWrapperClassName(fieldHasError('email'))}>
                <svg className="w-4 h-4 text-eerieBlack/70 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                <input
                  ref={emailRef}
                  className="flex-1 bg-transparent outline-none text-sm sm:text-md text-eerieBlack placeholder:text-eerieBlack/50"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  aria-invalid={fieldHasError('email')}
                  aria-describedby={fieldErrors.email ? 'auth-email-error' : formError && highlightedFields.email ? 'auth-form-error' : undefined}
                  autoComplete="email"
                />
              </div>
              <FieldError id="auth-email-error" message={fieldErrors.email} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[22px]">
                <label className="text-sm text-eerieBlack shrink-0">Password</label>
                {mode === 'register' && (
                  <PasswordStrengthIndicator password={password} visible={passwordFocused} />
                )}
              </div>
              <div className={fieldWrapperClassName(fieldHasError('password'))}>
                <FaLock className="text-eerieBlack/70 mr-3" />
                <input
                  ref={passwordRef}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-md text-eerieBlack placeholder:text-eerieBlack/40"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  aria-invalid={fieldHasError('password')}
                  aria-describedby={fieldErrors.password ? 'auth-password-error' : formError && highlightedFields.password ? 'auth-form-error' : undefined}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <PasswordVisibilityButton
                  visible={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                />
              </div>
              <FieldError id="auth-password-error" message={fieldErrors.password} />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-eerieBlack mb-1.5">Confirm Password</label>
                <div className={fieldWrapperClassName(fieldHasError('confirmPassword'))}>
                  <FaLock className="text-eerieBlack/70 mr-3" />
                  <input
                    ref={confirmPasswordRef}
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-md text-eerieBlack placeholder:text-eerieBlack/40"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    aria-invalid={fieldHasError('confirmPassword')}
                    aria-describedby={fieldErrors.confirmPassword ? 'auth-confirmPassword-error' : formError && highlightedFields.confirmPassword ? 'auth-form-error' : undefined}
                    autoComplete="new-password"
                  />
                  <PasswordVisibilityButton
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  />
                </div>
                <FieldError id="auth-confirmPassword-error" message={fieldErrors.confirmPassword} />
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-between gap-3 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm pt-1">
                <label className="flex items-center gap-2.5 text-eerieBlack/80">
                  <input
                    id="rememberMe"
                    className="w-4 h-4 shrink-0 bg-snow border border-eerieBlack/20 accent-velvetWine"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRememberMe(checked);
                      saveRememberMePreference(checked);
                    }}
                  />
                  <span>Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-eerieBlack/80 hover:text-eerieBlack transition-colors sm:text-right">Forgot Password?</Link>
              </div>
            )}
          </div>

          <div className="mt-8">
            <FormError message={formError} errorRef={formErrorRef} />
            <button
              type="submit"
              disabled={loading}
              className={`${authActionButtonClassName} bg-velvetWine text-snow text-md shadow-sm hover:bg-velvetWine/90 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
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

export default function AuthFormWithSuspense({ mode }: { mode: Mode }) {
  return (
    <Suspense
      fallback={
        <div className="w-full flex items-center justify-center py-12 px-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-velvetWine" />
        </div>
      }
    >
      <AuthForm mode={mode} />
    </Suspense>
  );
}