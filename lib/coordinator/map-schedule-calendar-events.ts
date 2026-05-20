import type { Defense } from '@/lib/api/coordinator';
import type { InstitutionEvent } from '@/lib/api/events';
import {
  buildScheduleCalendarUser,
  mapMyScheduleToCalendarEvents,
} from '@/lib/calendar/map-schedule-to-events';
import type { IEvent, IUser } from '@/features/calendar/interfaces';

export function buildCoordinatorCalendarUser(
  userId: string,
  name: string,
): IUser {
  return buildScheduleCalendarUser(userId, name);
}

export function mergeCoordinatorCalendarEvents(
  defenses: Defense[],
  institutionEvents: InstitutionEvent[],
  user: IUser,
): IEvent[] {
  return mapMyScheduleToCalendarEvents(
    defenses as unknown as Parameters<typeof mapMyScheduleToCalendarEvents>[0],
    [],
    institutionEvents,
    user,
  );
}
