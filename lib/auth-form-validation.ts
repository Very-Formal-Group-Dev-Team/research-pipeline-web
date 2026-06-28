import { validatePassword } from '@/lib/passwordPolicy';
import { isAccountDeactivatedError, ACCOUNT_DEACTIVATED_DISPLAY_MESSAGE } from '@/lib/auth/accountDeactivated';

export type AuthField = 'fullName' | 'email' | 'password' | 'confirmPassword';

export type AuthErrorTarget =
  | { scope: 'field'; field: AuthField; message: string }
  | { scope: 'form'; message: string; fields?: AuthField[]; deactivated?: boolean };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidateAuthFormInput = {
  mode: 'login' | 'register';
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function validateAuthForm({
  mode,
  fullName,
  email,
  password,
  confirmPassword,
}: ValidateAuthFormInput): AuthErrorTarget | null {
  const trimmedEmail = email.trim();
  const trimmedFullName = fullName.trim();

  if (mode === 'register' && !trimmedFullName) {
    return { scope: 'field', message: 'Enter your full name.', field: 'fullName' };
  }

  const emailMissing = !trimmedEmail;
  const passwordMissing = !password;

  if (emailMissing && passwordMissing) {
    return {
      scope: 'form',
      message: 'Enter your email and password to continue.',
      fields: mode === 'register' ? ['email', 'password', 'confirmPassword'] : ['email', 'password'],
    };
  }

  if (emailMissing) {
    return { scope: 'field', message: 'Enter your email address.', field: 'email' };
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return { scope: 'field', message: 'Enter a valid email address.', field: 'email' };
  }

  if (passwordMissing) {
    return { scope: 'field', message: 'Enter your password.', field: 'password' };
  }

  const passwordPolicyError = validatePassword(password);
  if (passwordPolicyError) {
    return { scope: 'field', message: passwordPolicyError, field: 'password' };
  }

  if (mode === 'register') {
    if (!confirmPassword) {
      return { scope: 'field', message: 'Confirm your password.', field: 'confirmPassword' };
    }

    if (password !== confirmPassword) {
      return { scope: 'field', message: 'Passwords do not match.', field: 'confirmPassword' };
    }
  }

  return null;
}

function resolveFieldApiError(message: string): AuthField {
  const lower = message.toLowerCase();

  if (
    lower.includes('already exists')
    || lower.includes('google sign-in')
    || lower.includes('verify your email')
    || lower.includes('no account found')
    || lower.includes('already verified')
    || lower.includes('verification email')
  ) {
    return 'email';
  }

  return 'password';
}

export function resolveApiError(message: string): AuthErrorTarget {
  const lower = message.toLowerCase();

  if (isAccountDeactivatedError(message)) {
    return {
      scope: 'form',
      message: ACCOUNT_DEACTIVATED_DISPLAY_MESSAGE,
      deactivated: true,
    };
  }

  if (
    lower.includes('invalid email or password')
    || lower.includes('enter your email and password')
    || lower.includes("couldn't reach the server")
    || lower.includes('something went wrong')
  ) {
    return {
      scope: 'form',
      message,
      fields: lower.includes('invalid email or password') || lower.includes('enter your email and password')
        ? ['email', 'password']
        : undefined,
    };
  }

  return {
    scope: 'field',
    field: resolveFieldApiError(message),
    message,
  };
}

/** @deprecated Use resolveApiError instead */
export function mapApiErrorToField(message: string): AuthField {
  const resolved = resolveApiError(message);
  return resolved.scope === 'field' ? resolved.field : 'password';
}
