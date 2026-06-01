'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — rubric creation is handled via modal on the main rubrics page. */
export default function CoordinatorRubricCreationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/coordinator/rubrics');
  }, [router]);

  return null;
}
