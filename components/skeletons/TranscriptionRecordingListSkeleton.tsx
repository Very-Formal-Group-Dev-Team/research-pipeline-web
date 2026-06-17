'use client';

import React from 'react';
import Card, { CARD_HEADER_SECTION_CLASS, CARD_INSET_X_CLASS } from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const GROUP_TITLE_WIDTHS = ['w-[72%]', 'w-[58%]', 'w-[80%]'];

function RecordingRowSkeleton({ index }: { index: number }) {
  const showDelete = index % 2 === 0;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 py-4 ${CARD_INSET_X_CLASS}`}>
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerLine className="h-4 w-[85%] max-w-full" />
        <ShimmerLine className="h-4 w-28" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ShimmerLine className="h-6 w-24 rounded-full" />
        {showDelete ? <ShimmerLine className="h-8 w-20 rounded-md" /> : null}
      </div>
    </div>
  );
}

function RecordingGroupSkeleton({ index }: { index: number }) {
  const titleWidth = GROUP_TITLE_WIDTHS[index % GROUP_TITLE_WIDTHS.length];
  const rowCount = index === 0 ? 2 : 1;

  return (
    <Card padding="none" className="overflow-hidden" hoverShadow={false}>
      <div className={CARD_HEADER_SECTION_CLASS}>
        <ShimmerLine className={`h-6 ${titleWidth} max-w-full`} />
        <ShimmerLine className="mt-2 h-4 w-[70%] max-w-full" />
      </div>
      <div className="divide-y divide-neutral-300">
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <RecordingRowSkeleton key={rowIndex} index={index + rowIndex} />
        ))}
      </div>
    </Card>
  );
}

export default function TranscriptionRecordingListSkeleton({
  count = 3,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`space-y-3 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading recordings"
    >
      {Array.from({ length: count }, (_, index) => (
        <RecordingGroupSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
