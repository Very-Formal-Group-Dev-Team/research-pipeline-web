'use client';

import React from 'react';

export interface DotSeparatedRowProps {
  parts: React.ReactNode[];
  className?: string;
}

export default function DotSeparatedRow({ parts, className = '' }: DotSeparatedRowProps) {
  const items = parts.filter(
    (part) => part !== null && part !== undefined && part !== false && part !== '',
  );
  if (items.length === 0) return null;

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`.trim()}>
      {items.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <span className="text-neutral-400 select-none" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">{part}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
