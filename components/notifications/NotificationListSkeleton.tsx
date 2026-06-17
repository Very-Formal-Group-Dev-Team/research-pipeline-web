'use client';

import React from 'react';
import Card from '@/components/ui/Card';

const NOTIFICATION_SHIMMER_LINE_CLASS =
  'rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer';

function ShimmerLine({ className = '' }: { className?: string }) {
  return <div className={`${NOTIFICATION_SHIMMER_LINE_CLASS} ${className}`.trim()} aria-hidden />;
}

const TITLE_WIDTHS = ['w-[72%]', 'w-[58%]', 'w-[80%]', 'w-[65%]', 'w-[76%]', 'w-[62%]'];

function NotificationCardSkeleton({ index }: { index: number }) {
  const showUnreadAccent = index % 3 !== 2;
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const showSecondMessageLine = index % 2 === 0;
  const showMarkRead = index % 2 === 0;

  return (
    <Card
      className={showUnreadAccent ? 'border-l-4 border-l-neutral-200' : ''}
      hoverShadow={false}
    >
      <div className="flex items-start gap-4">
        <ShimmerLine className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmerLine className={`h-5 ${titleWidth} max-w-full`} />
              <ShimmerLine className="h-3 w-28" />
            </div>
            <ShimmerLine className="h-5 w-20 shrink-0" />
          </div>
          <div className="mt-1 space-y-2">
            <ShimmerLine className="h-4 w-full" />
            {showSecondMessageLine ? <ShimmerLine className="h-4 w-[65%]" /> : null}
          </div>
          {showMarkRead ? <ShimmerLine className="mt-2 h-3 w-20" /> : null}
        </div>
      </div>
    </Card>
  );
}

export default function NotificationListSkeleton({
  count = 5,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`space-y-3 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading notifications"
    >
      {Array.from({ length: count }, (_, index) => (
        <NotificationCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
