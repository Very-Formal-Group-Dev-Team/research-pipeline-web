import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import type { IEvent, IUser } from '@/features/calendar/interfaces';
import {
  buildScheduleCalendarUser,
  mapMyScheduleToCalendarEvents,
} from '@/lib/calendar/map-schedule-to-events';

export function mapDefensesToCalendarEvents(
  defenses: Defense[],
  adviser: IUser,
  meetings: Defense[] = [],
  institutionEvents: InstitutionEvent[] = [],
): IEvent[] {
  return mapMyScheduleToCalendarEvents(
    defenses,
    meetings,
    institutionEvents,
    adviser,
  );
}

export function buildAdviserCalendarUser(
  userId: string,
  name: string,
): IUser {
  return buildScheduleCalendarUser(userId, name);
}
