import type { Defense } from '@/lib/api/defenses';
import type { IEvent, IUser } from '@/features/calendar/interfaces';
import type { TEventColor } from '@/features/calendar/types';
import { defensesToCalendarEvents } from '@/lib/adviser/defense-calendar';

const DEFENSE_COLOR: Record<Defense['defense_type'], TEventColor> = {
  proposal: 'blue',
  midterm: 'yellow',
  final: 'green',
};

function defenseEventId(defenseId: string, index: number) {
  const digits = defenseId.replace(/\D/g, '');
  if (digits.length > 0) {
    const parsed = Number.parseInt(digits.slice(-9), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return index + 1;
}

export function mapDefensesToCalendarEvents(
  defenses: Defense[],
  adviser: IUser,
): IEvent[] {
  return defensesToCalendarEvents(defenses).map((event, index) => ({
    id: defenseEventId(event.id, index),
    title: `${event.projectTitle} (${event.defenseType})`,
    description: [
      `Type: ${event.defenseType}`,
      `Code: ${event.projectCode}`,
      event.location ? `Location: ${event.location}` : null,
      event.status ? `Status: ${event.status}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    startDate: event.start.toISOString(),
    endDate: event.end.toISOString(),
    color: DEFENSE_COLOR[event.defenseType],
    user: adviser,
  }));
}

export function buildAdviserCalendarUser(
  userId: string,
  name: string,
): IUser {
  return {
    id: userId || 'adviser',
    name: name || 'Adviser',
    picturePath: null,
  };
}
