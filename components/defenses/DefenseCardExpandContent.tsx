'use client';

import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import { isOnlineModality } from '@/lib/meetings/jitsi';

export interface DefenseCardExpandFields {
  project_code: string;
  location?: string | null;
  venue?: string | null;
  adviser_name?: string | null;
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
      </div>
      {showJoin ? (
        <div className="flex shrink-0 items-center justify-start sm:justify-end">
          <JoinMeetingButton
            meeting_url={defense.meeting_url}
            meeting_room={defense.meeting_room}
            label="Join Defense"
            size="sm"
            className="shrink-0"
          />
        </div>
      ) : null}
    </div>
  );
}
