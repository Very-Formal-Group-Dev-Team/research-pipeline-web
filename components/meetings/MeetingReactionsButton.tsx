'use client';

import React, { useState } from 'react';
import { FiSmile } from 'react-icons/fi';

import MeetingControlButton from '@/components/meetings/MeetingControlButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/ui/popover';
import type { JitsiMeetApi } from '@/lib/meetings/jitsiApi';
import { JITSI_REACTIONS, sendJitsiReaction } from '@/lib/meetings/jitsiApi';

interface MeetingReactionsButtonProps {
  jitsiApi: JitsiMeetApi | null;
}

export default function MeetingReactionsButton({ jitsiApi }: MeetingReactionsButtonProps) {
  const [open, setOpen] = useState(false);

  function handleReaction(reactionKey: (typeof JITSI_REACTIONS)[number]['key']) {
    sendJitsiReaction(jitsiApi, reactionKey);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <MeetingControlButton
          label="Reactions"
          icon={<FiSmile />}
          active={open}
          ariaLabel="Send a reaction"
        />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={8}
        className="w-auto border-white/15 bg-neutral-900 p-2 text-white shadow-xl"
      >
        <p className="px-1 pb-2 text-xs font-medium text-neutral-300">Send a reaction</p>
        <div className="grid grid-cols-4 gap-1">
          {JITSI_REACTIONS.map((reaction) => (
            <button
              key={reaction.key}
              type="button"
              title={reaction.label}
              aria-label={reaction.label}
              onClick={() => handleReaction(reaction.key)}
              className="flex h-10 w-10 items-center justify-center rounded-sm text-xl transition hover:bg-white/10"
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
