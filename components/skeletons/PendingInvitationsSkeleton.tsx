'use client';

import React from 'react';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const TITLE_WIDTHS = ['w-[72%]', 'w-[58%]', 'w-[80%]'];

function InvitationRowSkeleton({ index }: { index: number }) {
  return (
    <div className="flex justify-between rounded-lg border border-neutral-200 px-6 py-4">
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerLine className={`h-5 ${TITLE_WIDTHS[index % TITLE_WIDTHS.length]} max-w-full`} />
        <ShimmerLine className="h-3 w-44 max-w-full" />
        <ShimmerLine className="h-3 w-24" />
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <ShimmerLine className="h-8 w-20 rounded-md" />
        <ShimmerLine className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

export default function PendingInvitationsSkeleton({
  count = 2,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`space-y-3 py-4 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading invitations"
    >
      {Array.from({ length: count }, (_, index) => (
        <InvitationRowSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
