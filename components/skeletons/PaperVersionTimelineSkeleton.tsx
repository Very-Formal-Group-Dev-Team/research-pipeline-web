'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function VersionCardSkeleton({ isLatest = false }: { isLatest?: boolean }) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center">
        <ShimmerLine
          className={`mt-1 h-8 w-8 shrink-0 rounded-full ${isLatest ? '' : 'opacity-70'}`}
        />
        <div className="mt-1 w-px flex-1 bg-neutral-200" aria-hidden />
      </div>
      <div className="mb-4 flex-1">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <ShimmerLine className="h-4 w-[75%] max-w-full" />
              <div className="flex flex-wrap items-center gap-3">
                <ShimmerLine className="h-5 w-14 rounded" />
                <ShimmerLine className="h-4 w-8" />
                <ShimmerLine className="h-4 w-24" />
                <ShimmerLine className="h-4 w-20" />
              </div>
            </div>
            <ShimmerLine className="h-5 w-5 shrink-0 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaperVersionTimelineSkeleton({
  count = 3,
  includeHeader = false,
  className = '',
}: {
  count?: number;
  includeHeader?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      aria-busy="true"
      aria-label="Loading paper versions"
    >
      {includeHeader ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <ShimmerLine className="h-6 w-52" />
            <ShimmerLine className="h-4 w-64 max-w-full" />
          </div>
          <ShimmerLine className="h-9 w-40 rounded-md" />
        </div>
      ) : null}
      <div>
        {Array.from({ length: count }, (_, index) => (
          <VersionCardSkeleton key={index} isLatest={index === 0} />
        ))}
        <div className="flex gap-4">
          <ShimmerLine className="ml-2.5 h-3 w-3 rounded-full" />
          <ShimmerLine className="mt-0.5 h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
