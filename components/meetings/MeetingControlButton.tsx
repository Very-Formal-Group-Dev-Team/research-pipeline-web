'use client';

import React from 'react';

export interface MeetingControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  muted?: boolean;
  danger?: boolean;
  ariaLabel?: string;
}

const MeetingControlButton = React.forwardRef<HTMLButtonElement, MeetingControlButtonProps>(
  function MeetingControlButton(
    {
      label,
      icon,
      onClick,
      active = false,
      muted = false,
      danger = false,
      disabled = false,
      ariaLabel,
      className = '',
      ...rest
    },
    ref,
  ) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      {...rest}
      className={`group flex min-w-[3.5rem] flex-col items-center gap-1 rounded-sm px-2.5 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${className} ${
        danger
          ? 'text-red-300 hover:bg-red-950/50'
          : active
            ? 'bg-white/10 text-white'
            : muted
              ? 'text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
              : 'text-neutral-200 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center text-lg leading-none ${
          muted && !danger ? 'opacity-80' : ''
        }`}
      >
        {icon}
      </span>
      <span className="max-w-[4.5rem] truncate text-[10px] leading-tight">{label}</span>
    </button>
  );
  },
);

export default MeetingControlButton;

export function MeetingControlDivider() {
  return <div className="mx-1 h-8 w-px shrink-0 bg-white/15" aria-hidden />;
}
