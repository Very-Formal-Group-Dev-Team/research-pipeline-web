'use client';

import React from 'react';
import Link from 'next/link';
import { FiCheck, FiEdit2, FiMoreVertical, FiX } from 'react-icons/fi';

import CoordinatorScheduleMetadataRow from '@/components/coordinator/CoordinatorScheduleMetadataRow';
import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import type { Defense } from '@/lib/api/defenses';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Dropdown from '@/components/ui/Dropdown';
import {
  MEETING_CARD_BODY_CLASS,
  MEETING_CARD_TITLE_CLASS,
  formatMeetingStatusLabel,
  getMeetingCardHeading,
  meetingStatusBadgeVariant,
} from '@/lib/meetings/display';
import { isOnlineModality, normalizeJitsiJoinUrl } from '@/lib/meetings/jitsi';
import { defenseTranscriptionArchiveUrl } from '@/lib/meetings/navigation';

const MEETING_CARD_TITLE_ROW_CLASS = `truncate font-semibold text-coordinator-ink ${MEETING_CARD_TITLE_CLASS}`;
const MEETING_CARD_METADATA_CLASS = `${MEETING_CARD_BODY_CLASS} text-neutral-600`;

export interface MeetingScheduleCardActions {
  onEdit: () => void;
  onCancel: () => void;
  onComplete: () => void;
  disabled?: boolean;
}

export type MeetingScheduleCardLayout = 'adviser' | 'student';

export interface MeetingScheduleCardProps {
  meeting: Defense;
  /** Adviser project detail layout (default) vs student events layout. */
  layout?: MeetingScheduleCardLayout;
  actions?: MeetingScheduleCardActions;
}

function StatusBadge({ meeting }: { meeting: Defense }) {
  return (
    <Badge
      variant={meetingStatusBadgeVariant(meeting.status)}
      size="sm"
      className="capitalize md:px-2.5 md:py-1 md:text-sm"
    >
      {formatMeetingStatusLabel(meeting.status, meeting.status_label)}
    </Badge>
  );
}

function MeetingActionsMenu({
  actions,
  isTerminalStatus,
}: {
  actions: MeetingScheduleCardActions;
  isTerminalStatus: boolean;
}) {
  return (
    <Dropdown
      align="right"
      trigger={
        <button
          type="button"
          className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
          aria-label="Meeting options"
        >
          <FiMoreVertical className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
        </button>
      }
      items={[
        {
          label: 'Edit',
          value: 'edit',
          icon: <FiEdit2 className="h-4 w-4" aria-hidden />,
          onClick: actions.onEdit,
          disabled: isTerminalStatus || actions.disabled,
        },
        {
          label: 'Mark as complete',
          value: 'complete',
          icon: <FiCheck className="h-4 w-4" aria-hidden />,
          onClick: actions.onComplete,
          disabled: isTerminalStatus || actions.disabled,
        },
        {
          label: 'Cancel',
          value: 'cancel',
          icon: <FiX className="h-4 w-4" aria-hidden />,
          danger: true,
          onClick: actions.onCancel,
          disabled: isTerminalStatus || actions.disabled,
        },
      ]}
    />
  );
}

function MeetingJoinAction({
  meeting,
  online,
  joinUrl,
  isTerminalStatus,
  compact,
}: {
  meeting: Defense;
  online: boolean;
  joinUrl: string | null;
  isTerminalStatus: boolean;
  compact?: boolean;
}) {
  if (isTerminalStatus) return null;

  if (online && joinUrl) {
    return (
      <JoinMeetingButton
        meetingId={meeting.id}
        meeting_url={meeting.meeting_url}
        meeting_room={meeting.meeting_room}
        label={compact ? 'Join meeting' : 'Join Meeting'}
        size="sm"
        className="shrink-0"
      />
    );
  }

  if (online && !joinUrl) {
    return (
      <p
        className={`max-w-[11rem] shrink-0 text-right text-neutral-500 ${MEETING_CARD_BODY_CLASS}`}
      >
        Link available when confirmed
      </p>
    );
  }

  return null;
}

function MeetingScheduleCardLayout({
  meeting,
  meetingHeading,
  startTime,
  endTime,
  location,
  actions,
  showJoin,
  joinCompact,
}: {
  meeting: Defense;
  meetingHeading: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  actions?: MeetingScheduleCardActions;
  showJoin: boolean;
  joinCompact?: boolean;
}) {
  const statusKey = (meeting.status || '').toLowerCase();
  const isTerminalStatus = statusKey === 'cancelled' || statusKey === 'completed';
  const online = isOnlineModality(meeting.modality);
  const joinUrl = normalizeJitsiJoinUrl(meeting.meeting_url, meeting.meeting_room);
  const joinAction =
    showJoin && !isTerminalStatus ? (
      <MeetingJoinAction
        meeting={meeting}
        online={online}
        joinUrl={joinUrl}
        isTerminalStatus={isTerminalStatus}
        compact={joinCompact}
      />
    ) : null;

  return (
    <Card padding="md" hover>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className={`${MEETING_CARD_TITLE_ROW_CLASS} mb-2.5`}>{meetingHeading}</h3>
          <CoordinatorScheduleMetadataRow
            className={MEETING_CARD_METADATA_CLASS}
            startTime={startTime}
            endTime={endTime}
            modality={meeting.modality}
            location={location}
          />
        </div>
        <div
          className={`flex shrink-0 flex-wrap items-center justify-end self-end sm:self-auto ${
            joinCompact ? 'gap-3' : 'gap-2'
          }`}
        >
          <StatusBadge meeting={meeting} />
          {actions ? (
            <MeetingActionsMenu actions={actions} isTerminalStatus={isTerminalStatus} />
          ) : null}
          {joinAction}
          <Link
            href={defenseTranscriptionArchiveUrl()}
            className="inline-flex items-center rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Transcription
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function MeetingScheduleCard({
  meeting,
  layout = 'adviser',
  actions,
}: MeetingScheduleCardProps) {
  const meetingHeading = getMeetingCardHeading(meeting);
  const startTime = meeting.start_time || meeting.scheduled_at || '';
  const location = meeting.venue || meeting.location || null;

  return (
    <MeetingScheduleCardLayout
      meeting={meeting}
      meetingHeading={meetingHeading}
      startTime={startTime}
      endTime={meeting.end_time}
      location={location}
      actions={layout === 'adviser' ? actions : undefined}
      showJoin
      joinCompact={layout === 'student'}
    />
  );
}
