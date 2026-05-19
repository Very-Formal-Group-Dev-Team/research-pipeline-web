import { format, startOfDay } from 'date-fns';

import type { Defense } from '@/lib/api/defenses';

export const DEFENSE_TYPE_TAG = {
  proposal: {
    label: 'Proposal',
    short: 'Prop',
    variant: 'primary' as const,
    cellClass: 'bg-primary-100 text-primary-800 border-primary-200',
    selectedCellClass: 'bg-white/20 text-white border-white/30',
  },
  midterm: {
    label: 'Midterm',
    short: 'Mid',
    variant: 'warning' as const,
    cellClass: 'bg-warning-100 text-warning-800 border-warning-200',
    selectedCellClass: 'bg-white/20 text-white border-white/30',
  },
  final: {
    label: 'Final',
    short: 'Final',
    variant: 'success' as const,
    cellClass: 'bg-success-100 text-success-800 border-success-200',
    selectedCellClass: 'bg-white/20 text-white border-white/30',
  },
} satisfies Record<
  Defense['defense_type'],
  {
    label: string;
    short: string;
    variant: 'primary' | 'warning' | 'success';
    cellClass: string;
    selectedCellClass: string;
  }
>;

export type DefenseCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  defenseType: Defense['defense_type'];
  projectTitle: string;
  projectCode: string;
  location: string;
  status: string;
};

export function parseDefenseDate(iso?: string | null) {
  if (!iso) return null;
  const parsed = new Date(iso.replace(/Z$/i, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function defensesToCalendarEvents(defenses: Defense[]): DefenseCalendarEvent[] {
  return defenses
    .map((defense) => {
      const start = parseDefenseDate(defense.start_time || defense.scheduled_at);
      const end = parseDefenseDate(defense.end_time || defense.start_time || defense.scheduled_at);
      if (!start || !end) return null;

      return {
        id: defense.id,
        title: `${defense.project_title} · ${defense.defense_type}`,
        start,
        end,
        defenseType: defense.defense_type,
        projectTitle: defense.project_title,
        projectCode: defense.project_code,
        location: defense.location || defense.venue || '',
        status: defense.status_label || defense.status,
      };
    })
    .filter((event): event is DefenseCalendarEvent => Boolean(event));
}

export function groupEventsByDay(events: DefenseCalendarEvent[]) {
  const map = new Map<string, DefenseCalendarEvent[]>();

  for (const event of events) {
    const key = format(startOfDay(event.start), 'yyyy-MM-dd');
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }

  for (const list of map.values()) {
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  return map;
}
