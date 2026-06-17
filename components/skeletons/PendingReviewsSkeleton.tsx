'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const TITLE_WIDTHS = ['w-[88%]', 'w-[76%]', 'w-[82%]'];

function PendingReviewCardSkeleton({ index }: { index: number }) {
  return (
    <div className="flex h-52 flex-col rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <ShimmerLine className={`h-4 ${TITLE_WIDTHS[index % TITLE_WIDTHS.length]} max-w-full`} />
        <ShimmerLine className="h-3 w-40" />
        <ShimmerLine className="mt-1 h-12 w-full rounded border border-neutral-200" />
      </div>
      <div className="mt-2 flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 pt-2">
        <ShimmerLine className="h-4 w-[70%] max-w-full" />
        <ShimmerLine className="h-4 w-16 shrink-0" />
      </div>
    </div>
  );
}

export default function PendingReviewsSkeleton({
  count = 3,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`h-[26.75rem] space-y-3 overflow-hidden pr-3 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading pending reviews"
    >
      {Array.from({ length: count }, (_, index) => (
        <PendingReviewCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
