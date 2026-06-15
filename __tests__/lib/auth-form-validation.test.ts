import { resolveApiError, validateAuthForm } from '@/lib/auth-form-validation';

const baseLogin = {
  mode: 'login' as const,
  fullName: '',
  email: 'user@example.com',
  password: 'secret12',
  confirmPassword: '',
};

const baseRegister = {
  mode: 'register' as const,
  fullName: 'Jane Doe',
  email: 'user@example.com',
  password: 'secret12',
  confirmPassword: 'secret12',
};

describe('validateAuthForm', () => {
  it('returns null for valid login input', () => {
    expect(validateAuthForm(baseLogin)).toBeNull();
  });

  it('returns null for valid register input', () => {
    expect(validateAuthForm(baseRegister)).toBeNull();
  });

  it('requires email and password when both are missing on login', () => {
    expect(validateAuthForm({ ...baseLogin, email: '', password: '' })).toEqual({
      scope: 'form',
      message: 'Enter your email and password to continue.',
      fields: ['email', 'password'],
    });
  });

  it('highlights confirm password too when email and password are missing on register', () => {
    expect(validateAuthForm({ ...baseRegister, email: '', password: '', confirmPassword: '' })).toEqual({
      scope: 'form',
      message: 'Enter your email and password to continue.',
      fields: ['email', 'password', 'confirmPassword'],
    });
  });

  it('requires a valid email format', () => {
    expect(validateAuthForm({ ...baseLogin, email: 'not-an-email' })).toEqual({
      scope: 'field',
      message: 'Enter a valid email address.',
      field: 'email',
    });
  });

  it('requires a password with at least 6 characters', () => {
    expect(validateAuthForm({ ...baseLogin, password: '123' })).toEqual({
      scope: 'field',
      message: 'Use a password with at least 6 characters.',
      field: 'password',
    });
  });

  it('requires matching passwords on register', () => {
    expect(validateAuthForm({ ...baseRegister, confirmPassword: 'different' })).toEqual({
      scope: 'field',
      message: 'Passwords do not match.',
      field: 'confirmPassword',
    });
  });
});

describe('resolveApiError', () => {
  it('maps duplicate email errors to the email field', () => {
    expect(resolveApiError('An account with this email already exists. Try signing in instead.')).toEqual({
      scope: 'field',
      field: 'email',
      message: 'An account with this email already exists. Try signing in instead.',
    });
  });

  it('maps invalid credentials to a form-level error', () => {
    expect(resolveApiError('Invalid email or password')).toEqual({
      scope: 'form',
      message: 'Invalid email or password',
      fields: ['email', 'password'],
    });
  });
});
