'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const TITLE_WIDTHS = ['w-[78%]', 'w-[65%]', 'w-[82%]'];

function NotificationDropdownRowSkeleton({ index }: { index: number }) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];

  return (
    <div className="flex items-start gap-3 border-b border-neutral-50 px-4 py-3 last:border-b-0">
      <ShimmerLine className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerLine className={`h-3.5 ${titleWidth} max-w-full`} />
        <ShimmerLine className="h-3 w-full" />
        <ShimmerLine className="h-2.5 w-24" />
      </div>
      <ShimmerLine className="mt-1.5 h-2 w-2 shrink-0 rounded-full" />
    </div>
  );
}

export default function NotificationDropdownSkeleton({
  count = 3,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      aria-busy="true"
      aria-label="Loading notifications"
    >
      {Array.from({ length: count }, (_, index) => (
        <NotificationDropdownRowSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
