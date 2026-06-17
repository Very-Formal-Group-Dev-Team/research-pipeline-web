'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const TITLE_WIDTHS = ['w-[85%]', 'w-[72%]', 'w-[90%]', 'w-[68%]', 'w-[80%]', 'w-[76%]'];

function ProjectTableRowSkeleton({ index }: { index: number }) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];

  return (
    <tr>
      <td className="min-w-[10rem] max-w-xs px-4 py-3 sm:px-6">
        <ShimmerLine className={`h-4 ${titleWidth} max-w-full`} />
      </td>
      <td className="max-w-[11rem] px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-24" />
      </td>
      <td className="max-w-[12rem] px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-28" />
      </td>
      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-32" />
      </td>
      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
        <ShimmerLine className="h-6 w-20 rounded-full" />
      </td>
      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-20" />
      </td>
    </tr>
  );
}

export default function CoordinatorProjectsListSkeleton({
  count = 6,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <Card padding="none" className={`overflow-hidden ${className}`.trim()} hoverShadow={false}>
      <div
        className="overflow-x-auto overscroll-x-contain"
        aria-busy="true"
        aria-label="Loading projects"
      >
        <table className="min-w-full w-max text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-600 sm:px-6">Title</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-600 sm:px-6">Code</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-600 sm:px-6">Adviser</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-600 sm:px-6">Course</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-600 sm:px-6">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-neutral-600 sm:px-6">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {Array.from({ length: count }, (_, index) => (
              <ProjectTableRowSkeleton key={index} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
