'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function CalendarCellSkeleton({ index }: { index: number }) {
  const eventCount = index % 4;

  return (
    <div className="border-b border-r p-1">
      <ShimmerLine className="mb-1 h-6 w-6 rounded-full" />
      <div className="mt-1 space-y-1">
        {Array.from({ length: eventCount }, (_, eventIndex) => (
          <ShimmerLine key={eventIndex} className="h-5 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ScheduleCalendarSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`portal-calendar mt-1.5 w-full overflow-hidden rounded-xl bg-white ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading calendar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ShimmerLine className="h-8 w-8 rounded-md" />
          <ShimmerLine className="h-8 w-32" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShimmerLine className="h-8 w-24 rounded-md" />
          <ShimmerLine className="h-8 w-8 rounded-md" />
          <ShimmerLine className="h-8 w-8 rounded-md" />
          <ShimmerLine className="h-8 w-8 rounded-md" />
          <ShimmerLine className="h-8 w-24 rounded-md" />
        </div>
      </div>
      <div className="min-h-[min(24rem,55vh)] overflow-hidden sm:min-h-[28rem] lg:min-h-[32rem]">
        <div className="grid grid-cols-7 border-b py-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="flex justify-center">
              <ShimmerLine className="h-6 w-10" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6">
          {Array.from({ length: 42 }, (_, index) => (
            <CalendarCellSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
