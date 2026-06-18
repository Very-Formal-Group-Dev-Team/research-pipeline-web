import { get, post, del } from './client';

export interface Branch {
  id: string;
  project_id: string;
  name: string;
  head_version_id: string | null;
  created_from_version_id: string | null;
  created_at: string;
  head_commit_message: string | null;
  head_commit_date: string | null;
  head_version_number: number | null;
  head_uploader_name: string | null;
  head_uploader_avatar: string | null;
}

export function listBranches(projectId: string) {
  return get<Branch[]>(`/projects/${projectId}/branches`);
}

export function getBranch(projectId: string, branchName: string) {
  return get<Branch>(`/projects/${projectId}/branches/${encodeURIComponent(branchName)}`);
}

export function createBranch(
  projectId: string,
  name: string,
  fromVersionId: string,
) {
  return post<Branch>(`/projects/${projectId}/branches`, { name, fromVersionId });
}

export function deleteBranch(projectId: string, branchName: string) {
  return del<void>(
    `/projects/${projectId}/branches/${encodeURIComponent(branchName)}`,
  );
}
