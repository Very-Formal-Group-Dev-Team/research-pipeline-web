'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function ReadOnlyFieldSkeleton() {
  return (
    <div className="space-y-2">
      <ShimmerLine className="h-3.5 w-20" />
      <ShimmerLine className="h-10 w-full rounded-md" />
    </div>
  );
}

export default function SettingsSectionSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <Card className={className} hoverShadow={false}>
      <ShimmerLine className="mb-4 h-6 w-28" />
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyFieldSkeleton />
        <ReadOnlyFieldSkeleton />
        <ReadOnlyFieldSkeleton />
        <ReadOnlyFieldSkeleton />
      </div>
      <ShimmerLine className="mt-4 h-4 w-48" />
    </Card>
  );
}
