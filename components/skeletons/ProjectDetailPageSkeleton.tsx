'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function SummaryCardSkeleton({
  tall = false,
  showAction = false,
}: {
  tall?: boolean;
  showAction?: boolean;
}) {
  return (
    <Card hoverShadow={false} className={tall ? 'flex h-full min-h-0 flex-col md:col-start-2 md:row-span-2 md:row-start-1' : ''}>
      <div className={tall ? 'mb-0 shrink-0 border-b border-neutral-300 pb-4' : 'border-b border-neutral-300 pb-4 mb-4'}>
        <ShimmerLine className="mb-2 h-6 w-6" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerLine className="h-5 w-32" />
            <ShimmerLine className="h-4 w-48 max-w-full" />
          </div>
          {showAction ? <ShimmerLine className="h-8 w-24 shrink-0 rounded-md" /> : null}
        </div>
      </div>
      <div className={tall ? 'mt-5 flex flex-1 flex-col justify-center space-y-3' : 'mt-4 space-y-2'}>
        {tall ? (
          Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <ShimmerLine className="h-4 w-24 shrink-0" />
              <ShimmerLine className="h-10 w-full rounded-md" />
            </div>
          ))
        ) : (
          <>
            <ShimmerLine className="h-4 w-full max-w-xs" />
            <ShimmerLine className="h-4 w-40" />
          </>
        )}
      </div>
    </Card>
  );
}

function ContentCardSkeleton({
  tall = false,
  showAction = false,
}: {
  tall?: boolean;
  showAction?: boolean;
}) {
  return (
    <Card hoverShadow={false} className={tall ? 'flex h-full min-h-0 flex-col' : ''}>
      <div className={`shrink-0 border-b border-neutral-300 pb-4 ${tall ? 'mb-0' : 'mb-4'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <ShimmerLine className="h-5 w-28" />
            <ShimmerLine className="h-4 w-44 max-w-full" />
          </div>
          {showAction ? <ShimmerLine className="h-8 w-28 shrink-0 rounded-md" /> : null}
        </div>
      </div>
      <div className={tall ? 'mt-4 min-h-[12rem] flex-1 space-y-3' : 'space-y-3'}>
        {tall ? (
          <>
            <ShimmerLine className="h-4 w-full" />
            <ShimmerLine className="h-4 w-[92%]" />
            <ShimmerLine className="h-4 w-[85%]" />
            <ShimmerLine className="h-4 w-[78%]" />
            <ShimmerLine className="h-4 w-[70%]" />
          </>
        ) : (
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2">
              <ShimmerLine className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <ShimmerLine className="h-4 w-32" />
                <ShimmerLine className="h-3 w-40 max-w-full" />
              </div>
              <ShimmerLine className="h-5 w-16 rounded-full" />
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function MeetingRowSkeleton() {
  return (
    <div className="rounded-md border border-neutral-300 p-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerLine className="h-5 w-[70%] max-w-full" />
          <ShimmerLine className="h-3.5 w-48" />
        </div>
        <ShimmerLine className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export type ProjectDetailPageSkeletonVariant = 'student' | 'adviser' | 'coordinator';

export default function ProjectDetailPageSkeleton({
  variant = 'student',
  className = '',
}: {
  variant?: ProjectDetailPageSkeletonVariant;
  className?: string;
}) {
  const showKeywords = variant === 'student';
  const showResearchStage = variant === 'adviser';
  const showMeetings = variant === 'adviser' || variant === 'coordinator';
  const detailsEditable = variant === 'student';

  return (
    <div
      className={`project-detail-forms space-y-6 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading project"
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <ShimmerLine className="h-9 w-[72%] max-w-xl" />
          <ShimmerLine className="h-6 w-24 rounded-full sm:shrink-0" />
        </div>
        <ShimmerLine className="hidden h-9 w-36 shrink-0 rounded-md sm:block" />
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2 md:items-stretch">
        <div className="md:col-start-1 md:row-start-1">
          <SummaryCardSkeleton />
        </div>
        <div className="md:col-start-1 md:row-start-2">
          <SummaryCardSkeleton />
        </div>
        <SummaryCardSkeleton tall showAction={detailsEditable} />
      </div>

      {showResearchStage ? (
        <Card hoverShadow={false}>
          <div className="border-b border-neutral-300 pb-4 mb-4 space-y-2">
            <ShimmerLine className="h-5 w-36" />
            <ShimmerLine className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <ShimmerLine key={index} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <ContentCardSkeleton tall />
        <ContentCardSkeleton />
      </div>

      {showKeywords ? (
        <Card hoverShadow={false}>
          <div className="border-b border-neutral-300 pb-4 mb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <ShimmerLine className="h-5 w-28" />
                <ShimmerLine className="h-4 w-56 max-w-full" />
              </div>
              <div className="flex gap-2">
                <ShimmerLine className="h-8 w-32 rounded-md" />
                <ShimmerLine className="h-8 w-16 rounded-md" />
                <ShimmerLine className="h-8 w-16 rounded-md" />
              </div>
            </div>
          </div>
          <ShimmerLine className="mb-3 h-10 w-full rounded-md" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <ShimmerLine key={index} className="h-7 w-20 rounded-full" />
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-neutral-300 pt-4">
            <ShimmerLine className="h-5 w-40" />
            <ShimmerLine className="h-9 w-full rounded-md" />
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <MeetingRowSkeleton key={index} />
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {showMeetings ? (
        <Card hoverShadow={false}>
          <div className="border-b border-neutral-300 pb-4 mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <ShimmerLine className="h-5 w-28" />
                <ShimmerLine className="h-4 w-48" />
              </div>
              <div className="flex gap-2">
                <ShimmerLine className="h-9 w-36 rounded-md" />
                {variant === 'adviser' ? <ShimmerLine className="h-9 w-32 rounded-md" /> : null}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <MeetingRowSkeleton />
            <MeetingRowSkeleton />
          </div>
        </Card>
      ) : null}

      <Card hoverShadow={false}>
        <div className="border-b border-neutral-300 pb-4 mb-4 space-y-2">
          <ShimmerLine className="h-5 w-40" />
          <ShimmerLine className="h-4 w-56 max-w-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex gap-4">
              <ShimmerLine className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2 border-l-2 border-neutral-200 pl-4">
                <ShimmerLine className="h-4 w-32" />
                <ShimmerLine className="h-4 w-full" />
                <ShimmerLine className="h-3.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
