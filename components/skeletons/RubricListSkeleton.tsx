'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const NAME_WIDTHS = ['w-[85%]', 'w-[72%]', 'w-[90%]', 'w-[68%]', 'w-[80%]'];

function RubricTableRowSkeleton({ index }: { index: number }) {
  const nameWidth = NAME_WIDTHS[index % NAME_WIDTHS.length];

  return (
    <tr>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className={`h-4 ${nameWidth} max-w-full`} />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-[90%] max-w-xs" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-16" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-8" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-12" />
      </td>
      <td className="px-4 py-3 sm:px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <ShimmerLine className="h-8 w-8 rounded-lg" />
          <ShimmerLine className="h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export default function RubricListSkeleton({
  count = 5,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`.trim()} aria-busy="true" aria-label="Loading rubrics">
      <Card padding="none" hoverShadow={false}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Rubric name</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Description</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Defense type</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Criteria</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Total weight</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-600 sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: count }, (_, index) => (
              <RubricTableRowSkeleton key={index} index={index} />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
