'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function StatTileSkeleton() {
  return (
    <Card className="h-full" hoverShadow={false}>
      <div className="flex h-full items-center gap-3 sm:gap-4">
        <ShimmerLine className="h-10 w-10 shrink-0 rounded-lg sm:h-12 sm:w-12" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerLine className="h-3 w-20 sm:w-24" />
          <ShimmerLine className="h-7 w-12" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardStatTilesSkeleton({
  count = 4,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      aria-busy="true"
      aria-label="Loading dashboard statistics"
    >
      {Array.from({ length: count }, (_, index) => (
        <StatTileSkeleton key={index} />
      ))}
    </div>
  );
}
