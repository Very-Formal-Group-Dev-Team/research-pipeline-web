import React from 'react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'success' 
  | 'error' 
  | 'warning'
  // Legacy variants for backward compatibility
  | 'primaryBg' 
  | 'primaryTxt' 
  | 'secondaryBg' 
  | 'accent' 
  | 'alert';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-darkSlateBlue text-white hover:bg-darkSlateBlue/90 focus:ring-darkSlateBlue/30 disabled:bg-darkSlateBlue/50',
  secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-300 disabled:bg-neutral-100',
  outline: 'border-2 border-darkSlateBlue text-darkSlateBlue hover:bg-darkSlateBlue/5 focus:ring-darkSlateBlue/30 disabled:border-neutral-300 disabled:text-neutral-400',
  ghost: 'text-darkSlateBlue hover:bg-neutral-100 focus:ring-neutral-300 disabled:text-neutral-400',
  success: 'bg-mutedGreen text-white hover:bg-mutedGreen/90 focus:ring-mutedGreen/30 disabled:bg-mutedGreen/50',
  error: 'bg-crimsonRed text-white hover:bg-crimsonRed/90 focus:ring-crimsonRed/30 disabled:bg-crimsonRed/50',
  warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-300 disabled:bg-warning-300',
  // Legacy variants
  primaryBg: 'bg-ivory text-darkSlateBlue hover:bg-neutral-100',
  primaryTxt: 'bg-darkSlateBlue text-white hover:bg-darkSlateBlue/90',
  secondaryBg: 'bg-lightGray text-neutral-900 hover:bg-neutral-300',
  accent: 'bg-skyBlue text-white hover:bg-skyBlue/90',
  alert: 'bg-crimsonRed text-white hover:bg-crimsonRed/90',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3 text-lg',
  xl: 'px-9 py-3.5 text-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const shadowColor = {
    primary: 'hover:shadow-[0_4px_12px_rgba(25,55,109,0.2)] active:shadow-[0_2px_8px_rgba(25,55,109,0.3)]',
    secondary: 'hover:shadow-[0_4px_12px_rgba(229,231,235,0.4)] active:shadow-[0_2px_8px_rgba(229,231,235,0.5)]',
    outline: 'hover:shadow-[0_4px_12px_rgba(25,55,109,0.2)] active:shadow-[0_2px_8px_rgba(25,55,109,0.3)]',
    ghost: 'hover:shadow-[0_4px_12px_rgba(229,231,235,0.4)] active:shadow-[0_2px_8px_rgba(229,231,235,0.5)]',
    success: 'hover:shadow-[0_4px_12px_rgba(76,175,80,0.2)] active:shadow-[0_2px_8px_rgba(76,175,80,0.3)]',
    error: 'hover:shadow-[0_4px_12px_rgba(220,53,69,0.2)] active:shadow-[0_2px_8px_rgba(220,53,69,0.3)]',
    warning: 'hover:shadow-[0_4px_12px_rgba(255,193,7,0.2)] active:shadow-[0_2px_8px_rgba(255,193,7,0.3)]',
    primaryBg: 'hover:shadow-[0_4px_12px_rgba(245,245,220,0.4)] active:shadow-[0_2px_8px_rgba(245,245,220,0.5)]',
    primaryTxt: 'hover:shadow-[0_4px_12px_rgba(25,55,109,0.2)] active:shadow-[0_2px_8px_rgba(25,55,109,0.3)]',
    secondaryBg: 'hover:shadow-[0_4px_12px_rgba(211,211,211,0.4)] active:shadow-[0_2px_8px_rgba(211,211,211,0.5)]',
    accent: 'hover:shadow-[0_4px_12px_rgba(135,206,235,0.2)] active:shadow-[0_2px_8px_rgba(135,206,235,0.3)]',
    alert: 'hover:shadow-[0_4px_12px_rgba(220,53,69,0.2)] active:shadow-[0_2px_8px_rgba(220,53,69,0.3)]',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-200
        focus:outline-none ${shadowColor[variant]}
        disabled:cursor-not-allowed disabled:opacity-60
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}