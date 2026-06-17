'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function FieldSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <ShimmerLine className="h-3.5 w-24" />
      <ShimmerLine className="h-10 w-full rounded-md" />
    </div>
  );
}

function CardHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <ShimmerLine className="h-5 w-40" />
      <ShimmerLine className="h-4 w-56 max-w-full" />
    </div>
  );
}

export default function CreateProjectFormSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`space-y-6 max-w-full ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading project form"
    >
      <Card>
        <CardHeaderSkeleton />
        <div className="mt-4 space-y-4">
          <FieldSkeleton />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <CardHeaderSkeleton />
          <ShimmerLine className="h-9 w-36 shrink-0 rounded-md" />
        </div>
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <ShimmerLine className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerLine className="h-4 w-36" />
            <ShimmerLine className="h-3.5 w-48 max-w-full" />
          </div>
          <ShimmerLine className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      </Card>

      <Card>
        <CardHeaderSkeleton />
        <div className="mt-4 space-y-4">
          <FieldSkeleton className="max-w-xs sm:max-w-sm" />
          <div className="rounded-md border-2 border-dashed border-neutral-200 p-8">
            <div className="flex flex-col items-center gap-3">
              <ShimmerLine className="h-12 w-12 rounded-full" />
              <ShimmerLine className="h-4 w-48" />
              <ShimmerLine className="h-3 w-28" />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <ShimmerLine className="h-10 w-24 rounded-md" />
        <ShimmerLine className="h-10 w-36 rounded-md" />
      </div>
    </div>
  );
}
