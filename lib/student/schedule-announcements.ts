import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export type AnnouncementKind = 'event' | 'meeting' | 'defense';

export interface ScheduleAnnouncement {
  id: string;
  title: string;
  start: Date;
  end: Date;
  kind: AnnouncementKind;
}

function parseScheduleDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parsed = new Date(iso.replace(/Z$/i, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function flattenScheduleToAnnouncements(
  defenses: Defense[],
  meetings: Defense[],
  events: InstitutionEvent[],
): ScheduleAnnouncement[] {
  const items: ScheduleAnnouncement[] = [];

  for (const row of defenses) {
    const start = parseScheduleDate(row.start_time || row.scheduled_at);
    const end = parseScheduleDate(row.end_time || row.start_time || row.scheduled_at);
    if (!start || !end) continue;
    items.push({
      id: `defense-${row.id}`,
      title: row.project_title || 'Defense',
      start,
      end,
      kind: 'defense',
    });
  }

  for (const row of meetings) {
    const start = parseScheduleDate(row.start_time || row.scheduled_at);
    const end = parseScheduleDate(row.end_time || row.start_time || row.scheduled_at);
    if (!start || !end) continue;
    items.push({
      id: `meeting-${row.id}`,
      title: row.project_title || 'Meeting',
      start,
      end,
      kind: 'meeting',
    });
  }

  for (const row of events) {
    if (row.status === 'cancelled') continue;
    const start = parseScheduleDate(row.start_time);
    const end = parseScheduleDate(row.end_time);
    if (!start || !end) continue;
    items.push({
      id: `event-${row.id}`,
      title: row.title,
      start,
      end,
      kind: 'event',
    });
  }

  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function filterAnnouncementsForWeek(
  items: ScheduleAnnouncement[],
  anchor: Date,
): ScheduleAnnouncement[] {
  const start = startOfWeek(anchor, { weekStartsOn: 0 });
  const end = endOfWeek(anchor, { weekStartsOn: 0 });
  return items.filter((item) =>
    isWithinInterval(item.start, { start, end }),
  );
}

export function filterAnnouncementsForMonth(
  items: ScheduleAnnouncement[],
  anchor: Date,
): ScheduleAnnouncement[] {
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  return items.filter((item) =>
    isWithinInterval(item.start, { start, end }),
  );
}

export function groupAnnouncementsByDay(items: ScheduleAnnouncement[]) {
  const map = new Map<string, ScheduleAnnouncement[]>();

  for (const item of items) {
    const key = format(item.start, 'yyyy-MM-dd');
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dayItems]) => ({
      dateKey,
      label: format(new Date(`${dateKey}T12:00:00`), 'EEEE, MMM d'),
      items: dayItems.sort((a, b) => a.start.getTime() - b.start.getTime()),
    }));
}

export function getWeekDayColumns(anchor: Date) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dateKey: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE'),
      sublabel: format(date, 'MMM d'),
    };
  });
}

export const KIND_STYLES: Record<
  AnnouncementKind,
  { dot: string; label: string }
> = {
  event: { dot: 'bg-purple-500', label: 'Event' },
  meeting: { dot: 'bg-orange-500', label: 'Meeting' },
  defense: { dot: 'bg-primary-500', label: 'Defense' },
};
