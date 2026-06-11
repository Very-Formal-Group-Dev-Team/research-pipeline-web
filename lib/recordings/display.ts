import type { MeetingRecordingSummary } from '@/lib/api/recordings';

export function recordingFallbackTitle(recording: MeetingRecordingSummary): string {
  return (
    recording.project_title?.trim()
    || recording.meeting_title?.trim()
    || recording.project_code?.trim()
    || 'Meeting recording'
  );
}

export function recordingDisplayTitle(recording: MeetingRecordingSummary): string {
  const custom = recording.display_name?.trim();
  if (custom) return custom;
  return recordingFallbackTitle(recording);
}

export function recordingDownloadFilename(
  recording: MeetingRecordingSummary,
  extension = 'webm',
): string {
  const base = recordingDisplayTitle(recording)
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return `${base || 'meeting-recording'}.${extension}`;
}
