'use client';

import { FiLayers, FiMapPin, FiMonitor } from 'react-icons/fi';

import { normalizeModalityKind } from '@/lib/meetings/display';

export interface ModalityIconProps {
  modality?: string | null;
  className?: string;
}

export default function ModalityIcon({
  modality,
  className = 'h-4 w-4 shrink-0 text-neutral-400',
}: ModalityIconProps) {
  const kind = normalizeModalityKind(modality);
  const iconProps = { className, 'aria-hidden': true as const };

  switch (kind) {
    case 'in-person':
      return <FiMapPin {...iconProps} />;
    case 'hybrid':
      return <FiLayers {...iconProps} />;
    case 'online':
    default:
      return <FiMonitor {...iconProps} />;
  }
}
