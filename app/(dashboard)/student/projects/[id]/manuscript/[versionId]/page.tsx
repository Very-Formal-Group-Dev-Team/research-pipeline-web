'use client';

import { use } from 'react';
import ManuscriptReviewPage from '@/components/manuscript/ManuscriptReviewPage';
import { getProjectDetailsPath } from '@/lib/projects/navigation';

export default function StudentManuscriptPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = use(params);

  return (
    <ManuscriptReviewPage
      role="student"
      projectId={id}
      versionId={versionId}
      backUrl={getProjectDetailsPath('student', id)}
      backLabel="Back to project"
      canComment={true}
      canCompleteReview={false}
    />
  );
}
