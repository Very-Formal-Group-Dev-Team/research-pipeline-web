import React from 'react';

export interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200',
  primary: 'bg-primary-100 text-primary-700 border-primary-300 hover:bg-primary-200',
  success: 'bg-success-100 text-success-700 border-success-300 hover:bg-success-200',
  error: 'bg-error-100 text-error-700 border-error-300 hover:bg-error-200',
  warning: 'bg-warning-100 text-warning-700 border-warning-300 hover:bg-warning-200',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function Tag({ 
  children, 
  onRemove, 
  variant = 'default', 
  size = 'md',
  className = '' 
}: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-md border
        transition-colors
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label="Remove tag"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
