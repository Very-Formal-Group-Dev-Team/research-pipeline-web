import React from 'react';

export type BadgeVariant = 
  | 'draft' 
  | 'in-review' 
  | 'approved' 
  | 'rejected' 
  | 'in-progress'
  | 'completed'
  | 'pending'
  | 'default'
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  /** Research project stages — each has a distinct color */
  | 'stage-topic-proposal'
  | 'stage-approved'
  | 'stage-ongoing'
  | 'stage-pre-defense'
  | 'stage-final-defense'
  | 'stage-completed'
  | 'stage-publication'
  | 'stage-rejected';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  draft: 'bg-neutral-200 text-neutral-700 border-neutral-300',
  'in-review': 'bg-warning-100 text-warning-800 border-warning-200',
  approved: 'bg-success-100 text-success-800 border-success-200',
  rejected: 'bg-error-100 text-error-800 border-error-200',
  'in-progress': 'bg-accent-100 text-accent-800 border-accent-200',
  completed: 'bg-success-100 text-success-800 border-success-200',
  pending: 'bg-warning-100 text-warning-800 border-warning-200',
  default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  success: 'bg-success-100 text-success-800 border-success-200',
  error: 'bg-error-100 text-error-800 border-error-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  'stage-topic-proposal': 'bg-neutral-200 text-neutral-800 border-neutral-400',
  'stage-approved': 'bg-success-100 text-success-800 border-success-300',
  'stage-ongoing': 'bg-primary-100 text-primary-800 border-primary-300',
  'stage-pre-defense': 'bg-warning-100 text-warning-900 border-warning-300',
  'stage-final-defense': 'bg-error-100 text-error-800 border-error-300',
  'stage-completed': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'stage-publication': 'bg-accent-100 text-accent-900 border-accent-300',
  'stage-rejected': 'bg-rose-100 text-rose-950 border-rose-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  dot = false 
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
