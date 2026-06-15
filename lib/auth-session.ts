export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const REMEMBER_ME_STORAGE_KEY = 'auth_remember_me';

export function setSessionTokenCookie(token: string, rememberMe: boolean) {
  const encoded = encodeURIComponent(token);
  const base = `session_token=${encoded}; path=/; samesite=lax`;
  document.cookie = rememberMe ? `${base}; max-age=${SESSION_MAX_AGE_SECONDS}` : base;
}

export function clearSessionTokenCookie() {
  document.cookie = 'session_token=; path=/; max-age=0; samesite=lax';
}

export function loadRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveRememberMePreference(rememberMe: boolean) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMe ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}
