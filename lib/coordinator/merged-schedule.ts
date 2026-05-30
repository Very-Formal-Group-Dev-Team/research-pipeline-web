import type { Defense } from '@/lib/api/coordinator';
import type { InstitutionEvent } from '@/lib/api/events';
import type { IEvent, IUser } from '@/features/calendar/interfaces';
import type { TEventColor } from '@/features/calendar/types';
import { calendarEventId } from '@/lib/calendar/event-id';

export type MergedScheduleKind = 'event' | 'defense';

export interface MergedScheduleItem {
  id: string;
  kind: MergedScheduleKind;
  title: string;
  startTime: string;
  endTime: string;
}

const DEFENSE_COLORS: Record<string, TEventColor> = {
  proposal: 'blue',
  midterm: 'yellow',
  final: 'green',
};

function parseScheduleDate(iso?: string | null) {
  if (!iso) return null;
  const parsed = new Date(iso.replace(/Z$/i, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildMergedScheduleItems(
  defenses: Defense[],
  institutionEvents: InstitutionEvent[],
): MergedScheduleItem[] {
  const inactive = new Set(['cancelled', 'rejected', 'completed']);

  const defenseItems: MergedScheduleItem[] = defenses
    .filter((d) => !inactive.has(d.status))
    .map((d) => {
      const start = d.start_time || (d as Defense & { scheduled_at?: string }).scheduled_at;
      const end = d.end_time || start;
      if (!start || !end) return null;
      return {
        id: d.id,
        kind: 'defense' as const,
        title: d.project_title || 'Defense',
        startTime: start,
        endTime: end,
      };
    })
    .filter((item): item is MergedScheduleItem => Boolean(item));

  const eventItems: MergedScheduleItem[] = institutionEvents
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({
      id: e.id,
      kind: 'event' as const,
      title: e.title,
      startTime: e.start_time,
      endTime: e.end_time,
    }));

  return [...defenseItems, ...eventItems].sort(
    (a, b) => parseScheduleDate(a.startTime)!.getTime() - parseScheduleDate(b.startTime)!.getTime(),
  );
}

export function mergedScheduleItemsToCalendarEvents(
  items: MergedScheduleItem[],
  defenses: Defense[],
  user: IUser,
): IEvent[] {
  const defenseById = new Map(defenses.map((d) => [d.id, d]));

  return items
    .map((item) => {
      const start = parseScheduleDate(item.startTime);
      const end = parseScheduleDate(item.endTime);
      if (!start || !end) return null;

      const isDefense = item.kind === 'defense';
      const defense = isDefense ? defenseById.get(item.id) : null;
      const color = isDefense
        ? (DEFENSE_COLORS[defense?.defense_type || ''] || 'blue')
        : ('purple' as TEventColor);

      return {
        id: calendarEventId(item.kind, item.id),
        title: item.title,
        description: isDefense ? 'Defense' : 'Event',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        color,
        user,
      };
    })
    .filter((event): event is IEvent => Boolean(event));
}
