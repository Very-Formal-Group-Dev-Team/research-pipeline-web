'use client';

import React, { useState } from 'react';
import { FiActivity } from 'react-icons/fi';

import MeetingControlButton from '@/components/meetings/MeetingControlButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/ui/popover';
import type { JitsiMeetApi } from '@/lib/meetings/jitsiApi';
import { setJitsiAudioOnly, setJitsiVideoQuality } from '@/lib/meetings/jitsiApi';

const PERFORMANCE_PRESETS = [
  { id: 'audio-only', label: 'Best performance', description: 'Audio and screen share only' },
  { id: 'low', label: 'Low definition', description: '180p max' },
  { id: 'standard', label: 'Standard definition', description: '360p max' },
  { id: 'high', label: 'High definition', description: '720p+ max' },
] as const;

interface MeetingPerformanceButtonProps {
  jitsiApi: JitsiMeetApi | null;
}

export default function MeetingPerformanceButton({ jitsiApi }: MeetingPerformanceButtonProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<(typeof PERFORMANCE_PRESETS)[number]['id']>('standard');

  function applyPreset(presetId: (typeof PERFORMANCE_PRESETS)[number]['id']) {
    setActivePreset(presetId);

    if (presetId === 'audio-only') {
      setJitsiAudioOnly(jitsiApi, true);
      return;
    }

    setJitsiAudioOnly(jitsiApi, false);

    const qualityByPreset = {
      low: 180,
      standard: 360,
      high: 2160,
    } as const;

    setJitsiVideoQuality(jitsiApi, qualityByPreset[presetId]);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <MeetingControlButton
          label="Performance"
          icon={<FiActivity />}
          active={open}
          ariaLabel="Performance settings"
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-64 border-white/15 bg-neutral-900 p-2 text-white shadow-xl"
      >
        <p className="px-2 py-1 text-xs font-medium text-neutral-300">Performance settings</p>
        <ul className="space-y-0.5">
          {PERFORMANCE_PRESETS.map((preset) => (
            <li key={preset.id}>
              <button
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`flex w-full flex-col rounded-sm px-2 py-2 text-left transition hover:bg-white/10 ${
                  activePreset === preset.id ? 'bg-white/10' : ''
                }`}
              >
                <span className="text-sm text-neutral-100">{preset.label}</span>
                <span className="text-[11px] text-neutral-400">{preset.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
