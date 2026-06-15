import {
  getPasswordStrength,
  getPasswordStrengthBarColor,
  getPasswordStrengthTextColor,
} from '@/lib/password-strength';

type PasswordStrengthIndicatorProps = {
  password: string;
  visible: boolean;
};

const SEGMENT_COUNT = 4;

export default function PasswordStrengthIndicator({ password, visible }: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);
  const show = visible && strength.level !== 'empty';

  const barColor = getPasswordStrengthBarColor(strength.level);
  const textColor = getPasswordStrengthTextColor(strength.level);

  return (
    <div
      className={`shrink-0 transition-all duration-150 ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 invisible w-0 overflow-hidden'
      }`}
      role="status"
      aria-live="polite"
      aria-hidden={!show}
      aria-label={show ? `Password strength: ${strength.label}` : undefined}
    >
      <div className="flex items-center gap-2 rounded-[3px] border border-eerieBlack/15 bg-snow px-2.5 py-1 shadow-sm">
        <div className="flex gap-1 w-20" aria-hidden>
          {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                index < strength.segments ? barColor : 'bg-eerieBlack/10'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium leading-none ${textColor}`}>{strength.label}</span>
      </div>
    </div>
  );
}
