import { post } from './client';

export interface MergedParagraph {
  status: 'unchanged' | 'fromA' | 'fromB' | 'conflict';
  content?: string;
  conflictA?: string;
  conflictB?: string;
}

export interface MergePreviewResult {
  type: 'already-merged' | 'fast-forward' | 'conflict' | 'clean';
  paragraphs?: MergedParagraph[];
  sourceHeadId?: string;
  ancestorVersionId?: string;
  sourceVersionId?: string;
  targetVersionId?: string;
}

export interface MergeCommitResult {
  type: 'already-merged' | 'fast-forward' | 'conflict' | 'merged';
  versionId?: string;
  versionNumber?: number;
  paragraphs?: MergedParagraph[];
  sourceHeadId?: string;
  ancestorVersionId?: string;
  sourceVersionId?: string;
  targetVersionId?: string;
}

export function previewMerge(projectId: string, sourceBranch: string, targetBranch: string) {
  return post<MergePreviewResult>(`/projects/${projectId}/merge/preview`, {
    sourceBranch,
    targetBranch,
  });
}

export function commitMerge(
  projectId: string,
  sourceBranch: string,
  targetBranch: string,
  resolutions?: Array<'A' | 'B' | string> | null,
) {
  return post<MergeCommitResult>(`/projects/${projectId}/merge/commit`, {
    sourceBranch,
    targetBranch,
    ...(resolutions != null ? { resolutions } : {}),
  });
}
