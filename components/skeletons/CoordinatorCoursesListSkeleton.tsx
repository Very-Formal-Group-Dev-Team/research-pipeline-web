'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const NAME_WIDTHS = ['w-[72%]', 'w-[58%]', 'w-[80%]', 'w-[65%]', 'w-[76%]'];

function CourseRowSkeleton({ index, expanded = false }: { index: number; expanded?: boolean }) {
  const nameWidth = NAME_WIDTHS[index % NAME_WIDTHS.length];
  const showDescription = index % 2 === 0;

  return (
    <li>
      <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
        <ShimmerLine className="h-6 w-6 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerLine className={`h-4 ${nameWidth} max-w-full`} />
          {showDescription ? <ShimmerLine className="h-3.5 w-[85%] max-w-full" /> : null}
          <ShimmerLine className="h-3 w-20" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ShimmerLine className="h-8 w-8 rounded-lg" />
          <ShimmerLine className="h-8 w-8 rounded-lg" />
          <ShimmerLine className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-neutral-100 bg-neutral-50/80 px-4 py-3 pl-12">
          <div className="space-y-2">
            {Array.from({ length: 2 }, (_, adviserIndex) => (
              <div
                key={adviserIndex}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2"
              >
                <ShimmerLine className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <ShimmerLine className="h-3.5 w-32" />
                  <ShimmerLine className="h-3 w-40 max-w-full" />
                </div>
                <ShimmerLine className="h-8 w-8 shrink-0 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export default function CoordinatorCoursesListSkeleton({
  count = 4,
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
        aria-label="Loading courses"
      >
        {Array.from({ length: count }, (_, index) => (
          <CourseRowSkeleton key={index} index={index} expanded={index === 0} />
        ))}
      </ul>
    </Card>
  );
}
