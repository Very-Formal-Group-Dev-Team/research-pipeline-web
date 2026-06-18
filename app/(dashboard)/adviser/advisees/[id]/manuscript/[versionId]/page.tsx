'use client';

import { use } from 'react';
import ManuscriptReviewPage from '@/components/manuscript/ManuscriptReviewPage';
import { getProjectDetailsPath } from '@/lib/projects/navigation';

export default function AdviserManuscriptPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = use(params);

  return (
    <ManuscriptReviewPage
      role="adviser"
      projectId={id}
      versionId={versionId}
      backUrl={getProjectDetailsPath('adviser', id)}
      canComment
      canCompleteReview
    />
  );
}
