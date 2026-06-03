'use client';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import ModalityIcon from '@/components/meetings/ModalityIcon';
import DotSeparatedRow from '@/components/ui/DotSeparatedRow';
import {
  formatMeetingDateCompact,
  formatMeetingVenueDisplay,
  formatModalityLabel,
  formatScheduleTimeRange,
} from '@/lib/meetings/display';

export interface CoordinatorScheduleMetadataRowProps {
  startTime?: string | null;
  endTime?: string | null;
  modality?: string | null;
  location?: string | null;
  proposedBy?: string | null;
  className?: string;
}

export default function CoordinatorScheduleMetadataRow({
  startTime,
  endTime,
  modality,
  location,
  proposedBy,
  className = 'text-sm text-neutral-600',
}: CoordinatorScheduleMetadataRowProps) {
  const locationLabel = formatMeetingVenueDisplay(location) || location?.trim() || '';
  return (
    <DotSeparatedRow
      className={className}
      parts={[
        <>
          <FiCalendar className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          <span className="tabular-nums">{formatMeetingDateCompact(startTime)}</span>
        </>,
        <>
          <FiClock className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          <span className="tabular-nums">{formatScheduleTimeRange(startTime, endTime)}</span>
        </>,
        modality || locationLabel ? (
          <>
            <ModalityIcon modality={modality} className="h-4 w-4 shrink-0 text-neutral-400" />
            <span>
              {modality && locationLabel
                ? `${formatModalityLabel(modality)} - ${locationLabel}`
                : modality
                  ? formatModalityLabel(modality)
                  : locationLabel}
            </span>
          </>
        ) : null,
        proposedBy ? (
          <>
            <FiUser className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            <span className="text-neutral-500">Proposed by {proposedBy}</span>
          </>
        ) : null,
      ]}
    />
  );
}
