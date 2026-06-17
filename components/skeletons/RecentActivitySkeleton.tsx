'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const TITLE_WIDTHS = ['w-[72%]', 'w-[58%]', 'w-[80%]', 'w-[65%]', 'w-[76%]'];

function ActivityRowSkeleton({ index }: { index: number }) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const showSecondLine = index % 2 === 0;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-solid border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerLine className={`h-4 ${titleWidth} max-w-full`} />
        <ShimmerLine className="h-3 w-full" />
        {showSecondLine ? <ShimmerLine className="h-3 w-[65%]" /> : null}
        <ShimmerLine className="h-3 w-20" />
      </div>
      <ShimmerLine className="h-5 w-20 shrink-0" />
    </div>
  );
}

export default function RecentActivitySkeleton({
  count = 5,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`h-[26.75rem] space-y-3 overflow-hidden pr-3 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading recent activity"
    >
      {Array.from({ length: count }, (_, index) => (
        <ActivityRowSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
