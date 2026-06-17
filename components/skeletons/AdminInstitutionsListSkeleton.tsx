'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const NAME_WIDTHS = ['w-[68%]', 'w-[54%]', 'w-[72%]', 'w-[60%]', 'w-[65%]'];

function InstitutionRowSkeleton({ index }: { index: number }) {
  const nameWidth = NAME_WIDTHS[index % NAME_WIDTHS.length];

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerLine className={`h-4 ${nameWidth} max-w-full`} />
        <ShimmerLine className="h-3.5 w-16" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ShimmerLine className="h-8 w-20 rounded-md" />
        <ShimmerLine className="h-8 w-24 rounded-md" />
      </div>
    </li>
  );
}

export default function AdminInstitutionsListSkeleton({
  count = 5,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <Card padding="none" className={className} hoverShadow={false}>
      <ul
        className="divide-y divide-neutral-100"
        aria-busy="true"
        aria-label="Loading institutions"
      >
        {Array.from({ length: count }, (_, index) => (
          <InstitutionRowSkeleton key={index} index={index} />
        ))}
      </ul>
    </Card>
  );
}
