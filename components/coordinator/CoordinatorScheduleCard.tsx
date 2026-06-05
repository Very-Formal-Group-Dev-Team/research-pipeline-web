'use client';

import React from 'react';
import { FiCheck, FiEdit2, FiMoreVertical, FiX } from 'react-icons/fi';

import CoordinatorScheduleMetadataRow from '@/components/coordinator/CoordinatorScheduleMetadataRow';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Dropdown from '@/components/ui/Dropdown';
import { formatMeetingStatusLabel, meetingStatusBadgeVariant } from '@/lib/meetings/display';
import { formatStatusLabel } from '@/lib/utils/formatStatus';

export interface CoordinatorScheduleCardActions {
  onEdit: () => void;
  onCancel: () => void;
  onComplete: () => void;
  disabled?: boolean;
}

export interface CoordinatorScheduleCardProps {
  title: string;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  modality?: string | null;
  location?: string | null;
  status: string;
  statusLabel?: string;
  statusVariant?: BadgeVariant;
  proposedBy?: string | null;
  defenseType?: string | null;
  actions?: CoordinatorScheduleCardActions;
  menu?: React.ReactNode;
  trailing?: React.ReactNode;
  expanded?: boolean;
  expandContent?: React.ReactNode;
  onToggleExpand?: () => void;
}

function ScheduleActionsMenu({
  actions,
  isTerminalStatus,
}: {
  actions: CoordinatorScheduleCardActions;
  isTerminalStatus: boolean;
}) {
  return (
    <Dropdown
      align="right"
      trigger={
        <button
          type="button"
          className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
          aria-label="Schedule options"
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

export default function CoordinatorScheduleCard({
  title,
  description,
  startTime,
  endTime,
  modality,
  location,
  status,
  statusLabel,
  statusVariant,
  proposedBy,
  defenseType,
  actions,
  menu,
  trailing,
  expanded,
  expandContent,
  onToggleExpand,
}: CoordinatorScheduleCardProps) {
  const statusKey = (status || '').toLowerCase();
  const isTerminalStatus = statusKey === 'cancelled' || statusKey === 'completed';
  const badgeVariant = statusVariant ?? meetingStatusBadgeVariant(status);
  const badgeLabel = statusLabel ?? formatMeetingStatusLabel(status);
  const descriptionText = description?.trim() || '';

  return (
    <Card padding="md">
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-center ${
          onToggleExpand ? 'cursor-pointer' : ''
        }`}
        onClick={onToggleExpand}
        onKeyDown={
          onToggleExpand
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleExpand();
                }
              }
            : undefined
        }
        role={onToggleExpand ? 'button' : undefined}
        tabIndex={onToggleExpand ? 0 : undefined}
      >
        <div className="min-w-0 flex-1">
          <h3
            className={`truncate font-semibold text-coordinator-ink ${
              descriptionText ? 'mb-1' : 'mb-2.5'
            }`}
          >
            {title}
          </h3>
          {descriptionText ? (
            <p className="mb-2.5 text-sm text-neutral-600">{descriptionText}</p>
          ) : null}
          <CoordinatorScheduleMetadataRow
            startTime={startTime}
            endTime={endTime}
            modality={modality}
            location={location}
            proposedBy={proposedBy}
          />
        </div>
        <div
          className="flex shrink-0 items-center gap-2 self-end sm:self-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            <Badge size="sm" variant={badgeVariant}>
              {badgeLabel}
            </Badge>
            {defenseType ? (
              <Badge size="sm" variant="default">
                {formatStatusLabel(defenseType)}
              </Badge>
            ) : null}
          </div>
          {menu}
          {actions ? (
            <ScheduleActionsMenu actions={actions} isTerminalStatus={isTerminalStatus} />
          ) : null}
          {trailing}
        </div>
      </div>
      {expanded && expandContent ? (
        <div className="mt-4 border-t border-neutral-200 pt-4">{expandContent}</div>
      ) : null}
    </Card>
  );
}
