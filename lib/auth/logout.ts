/**
 * Clears the session cookie locally and invalidates the server session.
 */
import { logout as logoutApi } from '@/lib/api/auth';

export async function performLogout(): Promise<void> {
  try {
    await logoutApi();
  } catch {
    // Still clear local session if the API call fails.
  }
  document.cookie = 'session_token=; path=/; max-age=0';
}
