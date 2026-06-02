'use client';

import React from 'react';
import { FiVideo } from 'react-icons/fi';
import Button, { type ButtonVariant } from '@/components/Button';
import { hasJoinableMeeting, normalizeJitsiJoinUrl, type JitsiMeetingFields } from '@/lib/meetings/jitsi';

export interface JoinMeetingButtonProps extends JitsiMeetingFields {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: ButtonVariant;
  className?: string;
}

export default function JoinMeetingButton({
  meeting_url,
  meeting_room,
  label = 'Join Meeting',
  size = 'sm',
  variant = 'primary',
  className = '',
}: JoinMeetingButtonProps) {
  const joinUrl = normalizeJitsiJoinUrl(meeting_url, meeting_room);

  if (!joinUrl) {
    return null;
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      leftIcon={<FiVideo />}
      className={className}
      onClick={() => window.open(joinUrl, '_blank', 'noopener,noreferrer')}
    >
      {label}
    </Button>
  );
}
