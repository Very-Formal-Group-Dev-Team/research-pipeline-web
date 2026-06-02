import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'hard';
  /** Lift shadow + border on hover (default on). Use false to disable. */
  hoverShadow?: boolean;
  /** Clickable card — includes hover shadow and pointer cursor. */
  hover?: boolean;
  onClick?: () => void;
}

/** Default card content padding — use for split sections when padding="none". */
export const CARD_PADDING_CLASS = 'p-4 sm:p-6';
export const CARD_HEADER_SECTION_CLASS =
  'border-b border-neutral-300 px-4 py-4 sm:px-6 sm:py-5';
/** Body flush under a header divider (e.g. calendars). */
export const CARD_BODY_FLUSH_CLASS = 'px-4 pb-4 pt-0 sm:px-6 sm:pb-6 sm:pt-0';
/** Horizontal inset for table rows / list rows inside padding="none" cards. */
export const CARD_INSET_X_CLASS = 'px-4 sm:px-6';

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: CARD_PADDING_CLASS,
  lg: 'p-6 sm:p-8',
};

const shadowStyles = {
  none: '',
  soft: 'shadow-sm',
  medium: 'shadow-md',
  hard: 'shadow-lg',
};

export default function Card({ 
  children,
  id,
  className = '', 
  padding = 'md', 
  shadow = 'soft',
  hoverShadow = true,
  hover = false,
  onClick 
}: CardProps) {
  const elevateOnHover = hoverShadow || hover;

  return (
    <div
      id={id}
      className={`
        bg-white border-[1px] border-solid border-neutral-400 rounded-md
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${elevateOnHover ? 'transition-all hover:shadow-lg hover:border-neutral-400' : ''}
        ${hover || onClick ? 'cursor-pointer' : ''}
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
    <div className={`border-b border-neutral-300 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-serif text-xl font-semibold text-eerieBlack ${className}`}>
      {children}
    </h3>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
  /** Max visible lines (default 3). Use 2 with `uniformHeight` on project list cards. */
  lines?: 2 | 3;
  /** Fixed block height matching `lines` for aligned card grids. */
  uniformHeight?: boolean;
}

export function CardDescription({
  children,
  className = '',
  lines = 3,
  uniformHeight = false,
}: CardDescriptionProps) {
  const isProjectCardAbstract = uniformHeight && lines === 2;
  const clampClass = isProjectCardAbstract
    ? 'project-card-abstract-2 min-w-0 text-left'
    : lines === 2
      ? 'line-clamp-2 break-words text-left'
      : 'line-clamp-3 break-words text-justify';
  const heightClass =
    !isProjectCardAbstract && uniformHeight && lines === 3 ? 'h-[3.75rem] leading-5' : '';

  return (
    <p
      className={`w-full min-w-0 overflow-hidden font-sans text-sm text-neutral-600 mt-1 ${clampClass} ${heightClass} ${className}`}
    >
      {children}
    </p>
  );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-t border-neutral-300 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}
