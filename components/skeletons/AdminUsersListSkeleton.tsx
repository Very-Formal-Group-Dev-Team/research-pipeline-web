'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const NAME_WIDTHS = ['w-[58%]', 'w-[48%]', 'w-[62%]', 'w-[52%]', 'w-[56%]'];

function UserRowSkeleton({ index }: { index: number }) {
  const nameWidth = NAME_WIDTHS[index % NAME_WIDTHS.length];

  return (
    <tr className="bg-white">
      <td className="px-4 py-3 sm:px-6">
        <div className="space-y-2">
          <ShimmerLine className={`h-4 ${nameWidth} max-w-full`} />
          <ShimmerLine className="h-3.5 w-40 max-w-full" />
        </div>
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-20" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-4 w-32 max-w-full" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3 sm:px-6">
        <ShimmerLine className="h-8 w-24 rounded-md" />
      </td>
    </tr>
  );
}

export default function AdminUsersListSkeleton({
  count = 8,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <Card padding="none" className={`overflow-hidden ${className}`} hoverShadow={false}>
      <div className="overflow-x-auto" aria-busy="true" aria-label="Loading users">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Name</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Role</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Institution</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {Array.from({ length: count }, (_, index) => (
              <UserRowSkeleton key={index} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
