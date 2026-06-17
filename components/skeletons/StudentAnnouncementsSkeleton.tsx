'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function DayColumnSkeleton({ index }: { index: number }) {
  const itemCount = index % 3;

  return (
    <div className="min-h-[6rem] rounded-lg border border-neutral-200 bg-neutral-50/80 p-2">
      <ShimmerLine className="h-3 w-10" />
      <ShimmerLine className="mb-2 mt-1 h-2.5 w-8" />
      <div className="space-y-2">
        {Array.from({ length: itemCount }, (_, itemIndex) => (
          <div key={itemIndex} className="flex items-start gap-1.5">
            <ShimmerLine className="mt-1 h-2 w-2 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <ShimmerLine className="h-3 w-full" />
              <ShimmerLine className="h-2.5 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentAnnouncementsSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading announcements"
    >
      {Array.from({ length: 7 }, (_, index) => (
        <DayColumnSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
