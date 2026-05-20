import { defensesToCalendarEvents } from '@/lib/adviser/defense-calendar';
import type { IEvent, IUser } from '@/features/calendar/interfaces';
import type { TEventColor } from '@/features/calendar/types';
import type { InstitutionEvent } from '@/lib/api/events';
import type { Defense } from '@/lib/api/defenses';
import { formatStatusLabel } from '@/lib/utils/formatStatus';
import { calendarEventId } from '@/lib/calendar/event-id';

const DEFENSE_COLOR: Record<string, TEventColor> = {
  proposal: 'blue',
  midterm: 'yellow',
  final: 'green',
};

function mapDefenseLikeRows(
  rows: Defense[],
  source: 'defense' | 'meeting',
  user: IUser,
  defaultColor?: TEventColor,
): IEvent[] {
  return defensesToCalendarEvents(rows).map((event) => {
    const color =
      defaultColor ||
      DEFENSE_COLOR[event.defenseType as keyof typeof DEFENSE_COLOR] ||
      (source === 'meeting' ? 'orange' : 'blue');

    const prefix = source === 'meeting' ? 'Meeting' : 'Defense';

    return {
      id: calendarEventId(source, event.id),
      title: `${event.projectTitle} (${event.defenseType})`,
      description: [
        `${prefix} · ${event.defenseType}`,
        `Code: ${event.projectCode}`,
        event.location ? `Location: ${event.location}` : null,
        event.status ? `Status: ${formatStatusLabel(event.status)}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      startDate: event.start.toISOString(),
      endDate: event.end.toISOString(),
      color,
      user,
    };
  });
}

function mapInstitutionEvents(events: InstitutionEvent[], user: IUser): IEvent[] {
  return events
    .filter((e) => e.status !== 'cancelled')
    .map((event) => ({
      id: calendarEventId('event', event.id),
      title: event.title,
      description: [
        'Institution event',
        event.description,
        event.location ? `Location: ${event.location}` : null,
        event.modality ? `Modality: ${event.modality}` : null,
        `Status: ${formatStatusLabel(event.status)}`,
      ]
        .filter(Boolean)
        .join('\n'),
      startDate: new Date(event.start_time.replace(/Z$/i, '')).toISOString(),
      endDate: new Date(event.end_time.replace(/Z$/i, '')).toISOString(),
      color: 'purple' as TEventColor,
      user,
    }));
}

export function buildScheduleCalendarUser(userId: string, name: string): IUser {
  return {
    id: userId || 'user',
    name: name || 'User',
    picturePath: null,
  };
}

export function mapMyScheduleToCalendarEvents(
  defenses: Defense[],
  meetings: Defense[],
  institutionEvents: InstitutionEvent[],
  user: IUser,
): IEvent[] {
  return [
    ...mapDefenseLikeRows(defenses, 'defense', user),
    ...mapDefenseLikeRows(meetings, 'meeting', user, 'orange'),
    ...mapInstitutionEvents(institutionEvents, user),
  ];
}
