'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const DETAIL_WIDTHS = ['w-[72%]', 'w-[58%]', 'w-[64%]', 'w-[52%]', 'w-[68%]'];

function AuditRowSkeleton({ index }: { index: number }) {
  const detailWidth = DETAIL_WIDTHS[index % DETAIL_WIDTHS.length];

  return (
    <tr className="bg-white">
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-36" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-28" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <div className="space-y-2">
          <ShimmerLine className="h-4 w-32 max-w-full" />
          <ShimmerLine className="h-3.5 w-40 max-w-full" />
        </div>
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className={`h-4 ${detailWidth} max-w-full`} />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-6 w-16 rounded-full" />
      </td>
    </tr>
  );
}

export default function AdminAuditListSkeleton({
  count = 8,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <Card padding="none" className={`overflow-hidden ${className}`} hoverShadow={false}>
      <div className="overflow-x-auto" aria-busy="true" aria-label="Loading audit log">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">When</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Action</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Actor</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Details</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {Array.from({ length: count }, (_, index) => (
              <AuditRowSkeleton key={index} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
