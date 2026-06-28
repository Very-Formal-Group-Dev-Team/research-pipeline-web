import { clearSessionTokenCookie } from '@/lib/auth-session';

export const ACCOUNT_DEACTIVATED_API_MESSAGE =
  'Account deactivated. Contact your administrator.';

export const ACCOUNT_DEACTIVATED_DISPLAY_MESSAGE =
  'Your account has been deactivated and you can no longer sign in. Please contact your platform administrator if you believe this is a mistake.';

export const ACCOUNT_DEACTIVATED_URL_ERROR = 'account_deactivated';

export function isAccountDeactivatedError(message: string | null | undefined): boolean {
  if (!message) return false;
  return message.toLowerCase().includes('deactivated');
}

let handlingRedirect = false;

/** Clear session and send the user to login with a dedicated deactivated notice. */
export async function redirectForDeactivatedAccount(): Promise<void> {
  if (typeof window === 'undefined' || handlingRedirect) return;

  const onLoginWithFlag =
    window.location.pathname === '/login'
    && window.location.search.includes(ACCOUNT_DEACTIVATED_URL_ERROR);
  if (onLoginWithFlag) return;

  handlingRedirect = true;
  try {
    await clearSessionTokenCookie();
  } finally {
    window.location.replace(`/login?error=${ACCOUNT_DEACTIVATED_URL_ERROR}`);
  }
}
