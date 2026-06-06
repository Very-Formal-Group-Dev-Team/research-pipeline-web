'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Scrolls to and briefly highlights a page section matching ?section=<param>.
 */
export function useSectionFocusScroll(
  sectionParam: string,
  sectionId: string,
  ready: boolean,
) {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section');

  useEffect(() => {
    if (activeSection !== sectionParam || !ready) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('animate-notification-focus-grow');
      window.setTimeout(() => {
        el.classList.remove('animate-notification-focus-grow');
      }, 500);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [activeSection, sectionParam, sectionId, ready]);
}
