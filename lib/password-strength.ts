export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel;
  label: string;
  segments: number;
};

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { level: 'empty', label: '', segments: 0 };
  }

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const metCount = checks.filter(Boolean).length;

  if (password.length < 6) {
    return { level: 'weak', label: 'Too short', segments: 1 };
  }
  if (metCount <= 1) {
    return { level: 'weak', label: 'Weak', segments: 1 };
  }
  if (metCount === 2) {
    return { level: 'fair', label: 'Fair', segments: 2 };
  }
  if (metCount === 3) {
    return { level: 'good', label: 'Good', segments: 3 };
  }
  return { level: 'strong', label: 'Strong', segments: 4 };
}

export function getPasswordStrengthBarColor(level: PasswordStrengthLevel): string {
  switch (level) {
    case 'weak':
      return 'bg-archivumRed';
    case 'fair':
      return 'bg-oldGold';
    case 'good':
      return 'bg-deepSeaGreen';
    case 'strong':
      return 'bg-malachiteDark';
    default:
      return 'bg-eerieBlack/10';
  }
}

export function getPasswordStrengthTextColor(level: PasswordStrengthLevel): string {
  switch (level) {
    case 'weak':
      return 'text-archivumRed';
    case 'fair':
      return 'text-oldGold';
    case 'good':
      return 'text-deepSeaGreen';
    case 'strong':
      return 'text-malachiteDark';
    default:
      return 'text-eerieBlack/50';
  }
}
