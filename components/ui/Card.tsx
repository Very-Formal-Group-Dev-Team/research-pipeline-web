import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'hard';
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const shadowStyles = {
  none: '',
  soft: 'shadow-sm',
  medium: 'shadow-md',
  hard: 'shadow-lg',
};

export default function Card({ 
  children, 
  className = '', 
  padding = 'md', 
  shadow = 'soft',
  hover = false,
  onClick 
}: CardProps) {
  return (
    <div
      className={`
        bg-white border border-neutral-200 rounded-xl
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${hover ? 'hover:shadow-lg hover:border-neutral-300 transition-all cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-b border-neutral-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-xl font-semibold text-primary-700 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-neutral-600 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-t border-neutral-200 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}
