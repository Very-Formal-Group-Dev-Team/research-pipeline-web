'use client';

import React from 'react';
import Card from '@/components/ui/Card';

const PROJECT_SHIMMER_LINE_CLASS =
  'rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer';

function ShimmerLine({ className = '' }: { className?: string }) {
  return <div className={`${PROJECT_SHIMMER_LINE_CLASS} ${className}`.trim()} aria-hidden />;
}

const TITLE_WIDTHS = ['w-[88%]', 'w-[75%]', 'w-[92%]', 'w-[80%]', 'w-[85%]', 'w-[72%]'];

function ProjectCardSkeleton({
  index,
  showRoleBadge = false,
}: {
  index: number;
  showRoleBadge?: boolean;
}) {
  return (
    <div className="h-full">
      <Card className="flex h-full flex-col justify-between" hoverShadow={false}>
        <div className="min-w-0">
          <div className="flex items-start justify-between">
            <ShimmerLine className="h-6 w-6" />
            <div className="flex items-center gap-2">
              {showRoleBadge ? <ShimmerLine className="h-5 w-20" /> : null}
              <ShimmerLine className="h-5 w-5 rounded-full" />
            </div>
          </div>
          <ShimmerLine className={`mt-3 h-5 ${TITLE_WIDTHS[index % TITLE_WIDTHS.length]}`} />
          <div className="mt-2 space-y-2">
            <ShimmerLine className="h-4 w-full" />
            <ShimmerLine className="h-4 w-[70%]" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-300 pt-4">
          <ShimmerLine className="h-4 w-32 max-w-[55%]" />
          <ShimmerLine className="h-4 w-24 shrink-0" />
        </div>
      </Card>
    </div>
  );
}

export default function ProjectListSkeleton({
  count = 6,
  showRoleBadge = false,
  className = '',
}: {
  count?: number;
  showRoleBadge?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading projects"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProjectCardSkeleton key={index} index={index} showRoleBadge={showRoleBadge} />
      ))}
    </div>
  );
}
