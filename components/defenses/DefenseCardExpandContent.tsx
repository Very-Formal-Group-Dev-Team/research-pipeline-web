'use client';

import Link from 'next/link';
import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';
import { isOnlineModality } from '@/lib/meetings/jitsi';

export interface DefenseCardExpandFields {
  id?: string;
  project_code: string;
  location?: string | null;
  venue?: string | null;
  adviser_name?: string | null;
  panelist_names?: string | null;
  modality?: string | null;
  meeting_url?: string | null;
  meeting_room?: string | null;
}

export default function DefenseCardExpandContent({ defense }: { defense: DefenseCardExpandFields }) {
  const locationLabel = defense.venue || defense.location || 'Not set';
  const showJoin = isOnlineModality(defense.modality);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-3 text-sm">
        <div>
          <span className="font-medium text-neutral-500">Project Code:</span>{' '}
          {defense.project_code}
        </div>
        <div>
          <span className="font-medium text-neutral-500">Location:</span> {locationLabel}
        </div>
        {defense.adviser_name ? (
          <div>
            <span className="font-medium text-neutral-500">Adviser:</span> {defense.adviser_name}
          </div>
        ) : null}
        {defense.panelist_names ? (
          <div>
            <span className="font-medium text-neutral-500">Panelists:</span> {defense.panelist_names}
          </div>
        ) : null}
      </div>
      {showJoin || defense.id ? (
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          {defense.id ? (
            <Link
              href={defenseTranscriptionArchiveUrl()}
              className="inline-flex items-center rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Transcription
            </Link>
          ) : null}
          {showJoin && defense.id ? (
            <JoinMeetingButton
              meetingId={defense.id}
              meeting_url={defense.meeting_url}
              meeting_room={defense.meeting_room}
              label="Join Defense"
              size="sm"
              className="shrink-0"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
