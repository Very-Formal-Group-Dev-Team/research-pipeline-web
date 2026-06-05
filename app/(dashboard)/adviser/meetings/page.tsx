'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdviserMeetingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/adviser/events?tab=meetings');
  }, [router]);
  return null;
}
