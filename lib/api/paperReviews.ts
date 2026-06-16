/**
 * Paper review request API.
 */

import { get, patch, post } from './client';

export interface PaperReviewRequest {
  id: string;
  project_id: string;
  paper_version_id: string;
  version_number: number;
  commit_message: string;
  file_name: string;
  requested_by: string;
  requester_name: string;
  note: string | null;
  status: 'pending' | 'reviewed' | 'withdrawn' | 'superseded';
  requested_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  withdrawn_at?: string | null;
  project_title?: string;
}

export interface AdviserPendingReview {
  id: string;
  project_id: string;
  project_title: string;
  paper_version_id: string;
  version_number: number;
  commit_message: string;
  file_name: string;
  requested_by: string;
  requester_name: string;
  note: string | null;
  requested_at: string;
}

/** Active pending review request for a project, or null. */
export function getProjectReviewRequest(projectId: string) {
  return get<PaperReviewRequest | null>(`/projects/${projectId}/review-request`);
}

/** Request adviser review on a specific paper version. */
export function requestPaperReview(projectId: string, versionId: string, note: string) {
  return post<PaperReviewRequest>(
    `/projects/${projectId}/paper-versions/${versionId}/request-review`,
    { note },
  );
}

/** Withdraw the active review request for a project. */
export function withdrawPaperReviewRequest(projectId: string) {
  return post<{ success: boolean }>(`/projects/${projectId}/review-request/withdraw`, {});
}

/** Mark the active review request as reviewed (adviser). */
export function completePaperReviewRequest(projectId: string) {
  return patch<{ success: boolean }>(`/projects/${projectId}/review-request/complete`, {});
}

/** Pending review requests across advised projects (adviser). */
export function getAdviserPendingReviews() {
  return get<AdviserPendingReview[]>('/adviser/pending-reviews');
}
