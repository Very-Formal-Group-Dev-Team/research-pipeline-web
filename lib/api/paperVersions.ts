import { get, post } from './client';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PaperVersion {
  file_type: string;
  content_preview: string;
  id: string;
  project_id: string;
  version_number: number;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  commit_message: string;
  tag: string | null;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string | null;
  is_generated: number; // 0 | 1 (tinyint)
  created_at: string;
}

export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface DiffStats {
  addedWords: number;
  removedWords: number;
  currentWords: number;
  previousWords: number;
}

export interface DiffResult {
  supported: boolean;
  message?: string;
  changes?: DiffChange[];
  stats?: DiffStats;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/** Fetch all paper versions for a project, newest first. */
export function getPaperVersions(projectId: string) {
  return get<PaperVersion[]>(`/projects/${projectId}/paper-versions`);
}

/** Upload a new paper version (multipart). */
export async function uploadPaperVersion(
  projectId: string,
  file: File,
  commitMessage: string,
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('commitMessage', commitMessage);
  return post<{ versionNumber: number; fileUrl: string }>(
    `/projects/${projectId}/paper-versions`,
    formData,
  );
}

/** Generate a .docx template version from the project's paper standard. */
export function generatePaperTemplate(projectId: string, commitMessage?: string) {
  return post<{ versionNumber: number; fileUrl: string }>(
    `/projects/${projectId}/paper-versions/generate`,
    commitMessage ? { commitMessage } : {},
  );
}

/** Build the download URL for a specific paper version. */
export function getPaperVersionDownloadUrl(projectId: string, versionId: string): string {
  return `${API_BASE_URL}/projects/${projectId}/paper-versions/${versionId}/download`;
}

/** Fetch the diff between a version and its predecessor. */
export function getPaperVersionDiff(projectId: string, versionId: string) {
  return get<DiffResult>(`/projects/${projectId}/paper-versions/${versionId}/diff`);
}
