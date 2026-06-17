'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <ShimmerLine className="h-3.5 w-24" />
      <ShimmerLine className="h-10 w-full rounded-md" />
    </div>
  );
}

export default function ProfileFormSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`space-y-6 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="flex items-start justify-between gap-4">
        <ShimmerLine className="h-4 w-[70%] max-w-md" />
        <ShimmerLine className="h-9 w-28 shrink-0 rounded-md" />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
        <div className="flex min-h-full min-w-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-200 p-8">
          <ShimmerLine className="h-20 w-20 rounded-full" />
          <ShimmerLine className="h-4 w-40" />
          <ShimmerLine className="h-3 w-28" />
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-4">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>
    </div>
  );
}
