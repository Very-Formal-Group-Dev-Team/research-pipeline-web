'use client';

import React from 'react';
import Card from '@/components/ui/Card';

const SCHEDULE_SHIMMER_LINE_CLASS =
  'rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer';

function ShimmerLine({ className = '' }: { className?: string }) {
  return <div className={`${SCHEDULE_SHIMMER_LINE_CLASS} ${className}`.trim()} aria-hidden />;
}

const TITLE_WIDTHS = ['w-[68%]', 'w-[54%]', 'w-[76%]', 'w-[62%]', 'w-[70%]', 'w-[58%]'];

function SortControlsSkeleton() {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-y-2" aria-hidden>
      <div className="flex flex-wrap items-center gap-2">
        <ShimmerLine className="h-4 w-14" />
        <ShimmerLine className="h-7 w-14 rounded-full" />
        <ShimmerLine className="h-7 w-16 rounded-full" />
        <ShimmerLine className="h-7 w-16 rounded-full" />
      </div>
      <ShimmerLine className="h-8 w-8 rounded-md" />
    </div>
  );
}

function ScheduleCardSkeleton({
  index,
  showDescription = false,
  showActions = false,
  showSecondBadge = false,
  showTrailing = false,
  showMeetingExtras = false,
}: {
  index: number;
  showDescription?: boolean;
  showActions?: boolean;
  showSecondBadge?: boolean;
  showTrailing?: boolean;
  showMeetingExtras?: boolean;
}) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const hasDescription = showDescription && index % 2 === 0;

  return (
    <Card padding="md" hoverShadow={false}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <ShimmerLine className={`h-5 ${titleWidth} max-w-full ${hasDescription ? 'mb-1' : 'mb-2.5'}`} />
          {hasDescription ? <ShimmerLine className="mb-2.5 h-4 w-[85%]" /> : null}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ShimmerLine className="h-3.5 w-36" />
            <span className="text-neutral-300" aria-hidden>
              ·
            </span>
            <ShimmerLine className="h-3.5 w-16" />
            <span className="text-neutral-300" aria-hidden>
              ·
            </span>
            <ShimmerLine className="h-3.5 w-24" />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
          <ShimmerLine className="h-6 w-20" />
          {showSecondBadge ? <ShimmerLine className="h-6 w-16" /> : null}
          {showActions ? <ShimmerLine className="h-6 w-6 rounded-md" /> : null}
          {showMeetingExtras ? (
            <>
              <ShimmerLine className="h-8 w-24 rounded-md" />
              <ShimmerLine className="h-8 w-28 rounded-md" />
            </>
          ) : null}
          {showTrailing ? <ShimmerLine className="h-5 w-5" /> : null}
        </div>
      </div>
    </Card>
  );
}

export default function ScheduleListSkeleton({
  count = 4,
  showDescription = false,
  showSortControls = false,
  showActions = false,
  showSecondBadge = false,
  showTrailing = false,
  showMeetingExtras = false,
  className = '',
  ariaLabel = 'Loading schedule',
}: {
  count?: number;
  showDescription?: boolean;
  showSortControls?: boolean;
  showActions?: boolean;
  showSecondBadge?: boolean;
  showTrailing?: boolean;
  showMeetingExtras?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={`space-y-4 ${className}`.trim()}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {showSortControls ? <SortControlsSkeleton /> : null}
      <div className="space-y-3">
        {Array.from({ length: count }, (_, index) => (
          <ScheduleCardSkeleton
            key={index}
            index={index}
            showDescription={showDescription}
            showActions={showActions}
            showSecondBadge={showSecondBadge}
            showTrailing={showTrailing}
            showMeetingExtras={showMeetingExtras}
          />
        ))}
      </div>
    </div>
  );
}
