'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

const COLUMN_COUNT = 8;

function TableRowSkeleton() {
  const widths = ['w-[72%]', 'w-16', 'w-20', 'w-14', 'w-14', 'w-12', 'w-16', 'w-20'];

  return (
    <tr>
      {widths.map((width, colIndex) => (
        <td key={colIndex} className="px-4 py-3">
          <ShimmerLine className={`h-4 ${width} max-w-full`} />
        </td>
      ))}
    </tr>
  );
}

export default function ScheduledMeetingsTableSkeleton({
  rowCount = 4,
  className = '',
}: {
  rowCount?: number;
  className?: string;
}) {
  return (
    <Card className={`border border-neutral-300 overflow-hidden ${className}`.trim()} hoverShadow={false}>
      <div className="overflow-x-auto" aria-busy="true" aria-label="Loading scheduled meetings">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              {Array.from({ length: COLUMN_COUNT }, (_, index) => (
                <th key={index} className="px-4 py-3">
                  <ShimmerLine className="h-3.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: rowCount }, (_, index) => (
              <TableRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
