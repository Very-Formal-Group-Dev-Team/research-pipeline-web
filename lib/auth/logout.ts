/**
 * Clears the session cookie locally and invalidates the server session.
 */
import { logout as logoutApi } from '@/lib/api/auth';
import { clearSessionTokenCookie } from '@/lib/auth-session';

export async function performLogout(): Promise<void> {
  try {
    await logoutApi();
  } catch {
    // Still clear local session if the API call fails.
  }
  await clearSessionTokenCookie();
}
