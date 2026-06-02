import type { Defense } from '@/lib/api/defenses';

export type MeetingStatusFilter = 'scheduled' | 'completed' | 'cancelled' | 'all';

export const MEETING_STATUS_FILTER_OPTIONS: { value: MeetingStatusFilter; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'Show all' },
];

/** Matches adviser meetings toolbar control height. */
export const MEETINGS_FILTER_CONTROL_CLASS =
  'h-9 min-h-9 max-h-9 shrink-0 box-border !py-0 inline-flex items-center';

export function meetingMatchesStatusFilter(
  meeting: Defense,
  filter: MeetingStatusFilter,
): boolean {
  const status = (meeting.status || '').toLowerCase();
  if (filter === 'all') return true;
  if (filter === 'completed') return status === 'completed';
  if (filter === 'cancelled') return status === 'cancelled';
  return status === 'scheduled' || status === 'pending' || status === 'rescheduled';
}

export function meetingStatusFilterEmptyLabel(filter: MeetingStatusFilter): string {
  if (filter === 'all') return 'meetings';
  const option = MEETING_STATUS_FILTER_OPTIONS.find((o) => o.value === filter);
  return `${option?.label.toLowerCase() ?? filter} meetings`;
}
