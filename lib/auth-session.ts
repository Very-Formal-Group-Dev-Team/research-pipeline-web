export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const REMEMBER_ME_STORAGE_KEY = 'auth_remember_me';

let clientSessionToken: string | null = null;

export function getClientSessionToken(): string | null {
  return clientSessionToken;
}

function setClientSessionToken(token: string | null) {
  clientSessionToken = token;
}

export async function setSessionTokenCookie(token: string, rememberMe: boolean) {
  setClientSessionToken(token);
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, rememberMe }),
    credentials: 'include',
  });
}

export async function clearSessionTokenCookie() {
  setClientSessionToken(null);
  await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'include',
  });
}

/** Restore in-memory token from the httpOnly app cookie after a full page load. */
export async function hydrateSessionFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (!res.ok) {
      setClientSessionToken(null);
      return false;
    }
    const body = (await res.json()) as { token?: string };
    if (typeof body.token === 'string' && body.token.trim()) {
      setClientSessionToken(body.token.trim());
      return true;
    }
    return false;
  } catch {
    return false;
  }
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
