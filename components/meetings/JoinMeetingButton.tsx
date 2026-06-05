'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiVideo } from 'react-icons/fi';
import Button, { type ButtonVariant } from '@/components/Button';
import { normalizeJitsiJoinUrl, type JitsiMeetingFields } from '@/lib/meetings/jitsi';
import { defenseMeetingUrl } from '@/lib/meetings/navigation';

export interface JoinMeetingButtonProps extends JitsiMeetingFields {
  meetingId?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: ButtonVariant;
  className?: string;
}

export default function JoinMeetingButton({
  meeting_url,
  meeting_room,
  meetingId,
  label = 'Join Meeting',
  size = 'sm',
  variant = 'primary',
  className = '',
}: JoinMeetingButtonProps) {
  const router = useRouter();
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
      onClick={() => {
        if (meetingId) {
          router.push(defenseMeetingUrl(meetingId));
          return;
        }
        window.open(joinUrl, '_blank', 'noopener,noreferrer');
      }}
    >
      {label}
    </Button>
  );
}
