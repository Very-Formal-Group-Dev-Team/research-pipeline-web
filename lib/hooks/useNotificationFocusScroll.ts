'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { notificationDomId } from '@/lib/notifications/navigation';

/**
 * Scrolls to and briefly highlights the notification card matching ?focus=<id>.
 */
export function useNotificationFocusScroll(loading: boolean, itemCount: number) {
  const searchParams = useSearchParams();
  const focusId = searchParams.get('focus');

  useEffect(() => {
    if (!focusId || loading || itemCount === 0) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(notificationDomId(focusId));
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-notification-focus-grow');
      window.setTimeout(() => {
        el.classList.remove('animate-notification-focus-grow');
      }, 500);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [focusId, loading, itemCount]);
}
