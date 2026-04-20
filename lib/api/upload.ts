/**
 * Upload API service – replaces all direct Supabase storage calls.
 */

import { post } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/**
 * Upload an avatar / profile picture.
 * The backend handles storage, validation, and returns the public URL.
 */
export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return post<UploadResult>('/upload/avatar', formData);
}

/** Upload a cropped avatar using a base64 data URL. */
export async function uploadCroppedAvatar(dataUrl: string) {
  return post<UploadResult>('/upload/avatar-cropped', { image: dataUrl });
}

/**
 * Upload a project document (PDF, DOC, DOCX).
 * The backend handles storage, validation, and returns the public URL.
 */
export async function uploadDocument(projectId: string, file: File) {
  const formData = new FormData();
  formData.append('document', file);
  return post<UploadResult>(`/upload/document/${projectId}`, formData);
}
