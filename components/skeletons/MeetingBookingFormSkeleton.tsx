'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function FieldSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <ShimmerLine className="h-3.5 w-24" />
      <ShimmerLine className="h-10 w-full rounded-md" />
    </div>
  );
}

export default function MeetingBookingFormSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`mt-4 space-y-4 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading meeting form"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
      <FieldSkeleton className="max-w-md" />
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <ShimmerLine className="h-10 w-full rounded-md sm:w-28" />
        <ShimmerLine className="h-10 w-full rounded-md sm:w-36" />
      </div>
    </div>
  );
}
