/**
 * Inline manuscript comment API.
 */

import { get, patch, post } from './client';

export type PaperCommentStatus = 'open' | 'resolved' | 'needs_revision';
export type AnchorStatus = 'active' | 'modified' | 'orphaned';

export interface TextQuoteSelector {
  type: 'TextQuoteSelector';
  exact: string;
  prefix: string;
  suffix: string;
  start: number;
  end: number;
}

export interface PaperComment {
  id: string;
  project_id: string;
  anchor_version_id: string;
  anchor_version_number: number | null;
  review_request_id: string | null;
  parent_id: string | null;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_role: 'leader' | 'member' | 'adviser' | null;
  body: string;
  anchor: TextQuoteSelector | null;
  plain_text_hash: string | null;
  status: PaperCommentStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  revision_requested_by: string | null;
  revision_requested_at: string | null;
  created_at: string;
  updated_at: string;
  mapped_start: number | null;
  mapped_end: number | null;
  anchor_status: AnchorStatus | null;
  touched_by_diff: boolean;
}

export interface PaperCommentSummary {
  total: number;
  open: number;
  needs_revision: number;
  resolved: number;
  by_version: Record<string, { open: number; needs_revision: number }>;
}

export function getPaperComments(projectId: string, versionId: string, status?: PaperCommentStatus) {
  const params = new URLSearchParams({ versionId });
  if (status) params.set('status', status);
  return get<PaperComment[]>(`/projects/${projectId}/paper-comments?${params.toString()}`);
}

export function getPaperCommentSummary(projectId: string) {
  return get<PaperCommentSummary>(`/projects/${projectId}/paper-comments/summary`);
}

export function createPaperComment(
  projectId: string,
  payload: {
    versionId: string;
    anchor: TextQuoteSelector;
    body: string;
    parentId?: string;
  },
) {
  return post<PaperComment>(`/projects/${projectId}/paper-comments`, payload);
}

export function updatePaperComment(projectId: string, commentId: string, body: string) {
  return patch<PaperComment>(`/projects/${projectId}/paper-comments/${commentId}`, { body });
}

export function resolvePaperComment(projectId: string, commentId: string) {
  return post<PaperComment>(`/projects/${projectId}/paper-comments/${commentId}/resolve`, {});
}

export function requestPaperCommentRevision(projectId: string, commentId: string) {
  return post<PaperComment>(`/projects/${projectId}/paper-comments/${commentId}/request-revision`, {});
}

export function reopenPaperComment(projectId: string, commentId: string) {
  return post<PaperComment>(`/projects/${projectId}/paper-comments/${commentId}/reopen`, {});
}
