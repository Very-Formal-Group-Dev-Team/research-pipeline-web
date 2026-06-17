'use client';

import React from 'react';

export const SHIMMER_LINE_CLASS =
  'rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer';

export default function ShimmerLine({ className = '' }: { className?: string }) {
  return <div className={`${SHIMMER_LINE_CLASS} ${className}`.trim()} aria-hidden />;
}
