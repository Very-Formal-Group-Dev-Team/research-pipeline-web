'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Managed defenses merged into Events — redirect legacy route. */
export default function CoordinatorDefensesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/coordinator/events?tab=pending');
  }, [router]);

  return null;
}
