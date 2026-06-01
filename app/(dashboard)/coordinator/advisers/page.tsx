'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — advisers are managed under Courses. */
export default function CoordinatorAdvisersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/coordinator/courses');
  }, [router]);

  return null;
}
