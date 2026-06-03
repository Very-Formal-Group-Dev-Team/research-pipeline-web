'use client';

import React from 'react';
import { FiCalendar, FiCheck, FiClock, FiEdit2, FiMoreVertical, FiX } from 'react-icons/fi';

import ModalityIcon from '@/components/meetings/ModalityIcon';

import type { Defense } from '@/lib/api/defenses';
import Badge from '@/components/ui/Badge';
import DotSeparatedRow from '@/components/ui/DotSeparatedRow';
import Dropdown from '@/components/ui/Dropdown';
import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import {
  MEETING_CARD_BODY_CLASS,
  MEETING_CARD_TITLE_CLASS,
  formatMeetingDateCompact,
  formatMeetingStatusLabel,
  formatMeetingTime,
  getMeetingCardHeading,
  getMeetingLocationLine,
  meetingStatusBadgeVariant,
} from '@/lib/meetings/display';
import { isOnlineModality, normalizeJitsiJoinUrl } from '@/lib/meetings/jitsi';

/** Matches `Card` hover elevation (shadow-sm → hover:shadow-lg). */
const MEETING_CARD_SURFACE_CLASS =
  'rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm transition-all hover:border-neutral-400 hover:shadow-lg';

/** Tighter vertical rhythm for student events list cards. */
const STUDENT_MEETING_CARD_SURFACE_CLASS =
  'rounded-lg border border-neutral-300 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-neutral-400 hover:shadow-lg';

/** Join/action column — only rendered for online meetings that need it. */
const MEETING_CARD_ACTION_SLOT_CLASS =
  'flex shrink-0 flex-col items-end justify-center';

/** Reserved width/height so face-to-face and online student cards align. */
const STUDENT_MEETING_CARD_ACTION_SLOT_CLASS =
  'flex h-8 min-w-[7.25rem] shrink-0 items-center justify-end';

const MEETING_CARD_FOOTER_CLASS = 'mt-2 flex items-center justify-between gap-3';

const STUDENT_MEETING_CARD_FOOTER_CLASS =
  'mt-1.5 flex min-h-8 items-center justify-between gap-3';

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

function StudentJoinAction({
  online,
  joinUrl,
  isTerminalStatus,
  meeting,
}: {
  online: boolean;
  joinUrl: string | null;
  isTerminalStatus: boolean;
  meeting: Defense;
}) {
  if (isTerminalStatus) return null;

  if (online && joinUrl) {
    return (
      <JoinMeetingButton
        meeting_url={meeting.meeting_url}
        meeting_room={meeting.meeting_room}
        label="Join meeting"
        size="sm"
        className="shrink-0 !px-2.5 !py-2 !text-xs [&_svg]:h-3.5 [&_svg]:w-3.5"
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

function MeetingCardActionSlot({
  children,
  slotClassName = MEETING_CARD_ACTION_SLOT_CLASS,
}: {
  children?: React.ReactNode;
  slotClassName?: string;
}) {
  return <div className={slotClassName}>{children}</div>;
}

function AdviserMeetingCard({
  meeting,
  actions,
  meetingHeading,
  startTime,
  timeRange,
  locationLine,
  online,
  joinUrl,
  isTerminalStatus,
  hasCustomTitle,
}: {
  meeting: Defense;
  actions?: MeetingScheduleCardActions;
  meetingHeading: string;
  startTime: string;
  timeRange: string;
  locationLine: string;
  online: boolean;
  joinUrl: string | null;
  isTerminalStatus: boolean;
  hasCustomTitle: boolean;
}) {
  return (
    <article className={MEETING_CARD_SURFACE_CLASS}>
      <div className="flex items-start justify-between gap-2.5">
        <h4
          className={`min-w-0 flex-1 font-serif text-eerieBlack ${MEETING_CARD_TITLE_CLASS} ${
            hasCustomTitle ? '' : ''
          }`}
        >
          {meetingHeading}
        </h4>
        <div className="flex shrink-0 items-center gap-1.5">
          <StatusBadge meeting={meeting} />
          {actions ? (
            <MeetingActionsMenu actions={actions} isTerminalStatus={isTerminalStatus} />
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className={`min-w-0 space-y-0.5 ${MEETING_CARD_BODY_CLASS}`}>
          <p className="text-neutral-600">{locationLine}</p>
          <p className="font-medium text-neutral-900 tabular-nums">
            {formatMeetingDateCompact(startTime)}
          </p>
          <p className="text-neutral-600 tabular-nums">{timeRange}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-end">
          {online && joinUrl && !isTerminalStatus ? (
            <JoinMeetingButton
              meeting_url={meeting.meeting_url}
              meeting_room={meeting.meeting_room}
              label="Join Meeting"
              size="sm"
              className="md:!text-base"
            />
          ) : online && !joinUrl && !isTerminalStatus ? (
            <p
              className={`max-w-[11rem] text-right text-neutral-500 ${MEETING_CARD_BODY_CLASS}`}
            >
              Link available when confirmed
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StudentMeetingCard({
  meeting,
  meetingHeading,
  startTime,
  timeRange,
  locationLine,
  online,
  joinUrl,
  isTerminalStatus,
}: {
  meeting: Defense;
  meetingHeading: string;
  startTime: string;
  timeRange: string;
  locationLine: string;
  online: boolean;
  joinUrl: string | null;
  isTerminalStatus: boolean;
}) {
  const showJoinAction = online && !isTerminalStatus;

  return (
    <article className={STUDENT_MEETING_CARD_SURFACE_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <h4
          className={`min-w-0 flex-1 font-serif font-semibold text-eerieBlack ${MEETING_CARD_TITLE_CLASS}`}
        >
          {meetingHeading}
        </h4>
        <StatusBadge meeting={meeting} />
      </div>

      <div className={STUDENT_MEETING_CARD_FOOTER_CLASS}>
        <DotSeparatedRow
          className={`min-w-0 flex-1 text-neutral-600 ${MEETING_CARD_BODY_CLASS}`}
          parts={[
            <>
              <FiCalendar className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span className="tabular-nums">{formatMeetingDateCompact(startTime)}</span>
            </>,
            <>
              <FiClock className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span className="tabular-nums">{timeRange}</span>
            </>,
            <>
              <ModalityIcon modality={meeting.modality} className="h-4 w-4 shrink-0 text-neutral-500" />
              <span>{locationLine}</span>
            </>,
          ]}
        />
        <MeetingCardActionSlot slotClassName={STUDENT_MEETING_CARD_ACTION_SLOT_CLASS}>
          {showJoinAction ? (
            <StudentJoinAction
              online={online}
              joinUrl={joinUrl}
              isTerminalStatus={isTerminalStatus}
              meeting={meeting}
            />
          ) : null}
        </MeetingCardActionSlot>
      </div>
    </article>
  );
}

export default function MeetingScheduleCard({
  meeting,
  layout = 'adviser',
  actions,
}: MeetingScheduleCardProps) {
  const online = isOnlineModality(meeting.modality);
  const joinUrl = normalizeJitsiJoinUrl(meeting.meeting_url, meeting.meeting_room);
  const meetingHeading = getMeetingCardHeading(meeting);
  const startTime = meeting.start_time || meeting.scheduled_at || '';
  const timeRange = meeting.end_time
    ? `${formatMeetingTime(startTime)} – ${formatMeetingTime(meeting.end_time)}`
    : formatMeetingTime(startTime);
  const statusKey = (meeting.status || '').toLowerCase();
  const isTerminalStatus = statusKey === 'cancelled' || statusKey === 'completed';
  const locationLine = getMeetingLocationLine(meeting);
  const hasCustomTitle = Boolean(meeting.meeting_title?.trim());

  if (layout === 'student') {
    return (
      <StudentMeetingCard
        meeting={meeting}
        meetingHeading={meetingHeading}
        startTime={startTime}
        timeRange={timeRange}
        locationLine={locationLine}
        online={online}
        joinUrl={joinUrl}
        isTerminalStatus={isTerminalStatus}
      />
    );
  }

  return (
    <AdviserMeetingCard
      meeting={meeting}
      actions={actions}
      meetingHeading={meetingHeading}
      startTime={startTime}
      timeRange={timeRange}
      locationLine={locationLine}
      online={online}
      joinUrl={joinUrl}
      isTerminalStatus={isTerminalStatus}
      hasCustomTitle={hasCustomTitle}
    />
  );
}
