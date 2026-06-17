'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <ShimmerLine className="h-3.5 w-28" />
      <ShimmerLine className="h-10 w-full rounded-md" />
    </div>
  );
}

function ProgramRowSkeleton({ index }: { index: number }) {
  const widths = ['w-[70%]', 'w-[58%]', 'w-[76%]'];

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerLine className={`h-4 ${widths[index % widths.length]} max-w-full`} />
        <ShimmerLine className="h-3.5 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <ShimmerLine className="h-8 w-20 rounded-md" />
        <ShimmerLine className="h-8 w-8 rounded-md" />
      </div>
    </li>
  );
}

export default function AdminInstitutionDetailSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`space-y-6 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading institution"
    >
      <Card>
        <ShimmerLine className="h-5 w-40" />
        <div className="mt-4 space-y-4">
          <FieldSkeleton />
          <FieldSkeleton />
          <div className="flex flex-wrap gap-2 pt-1">
            <ShimmerLine className="h-9 w-24 rounded-md" />
            <ShimmerLine className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ShimmerLine className="h-5 w-32" />
        <ShimmerLine className="h-9 w-32 rounded-md" />
      </div>

      <Card padding="none" hoverShadow={false}>
        <ul className="divide-y divide-neutral-100">
          {Array.from({ length: 3 }, (_, index) => (
            <ProgramRowSkeleton key={index} index={index} />
          ))}
        </ul>
      </Card>
    </div>
  );
}
