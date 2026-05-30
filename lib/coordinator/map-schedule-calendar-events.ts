import type { Defense } from '@/lib/api/coordinator';
import type { InstitutionEvent } from '@/lib/api/events';
import { buildScheduleCalendarUser } from '@/lib/calendar/map-schedule-to-events';
import type { IEvent, IUser } from '@/features/calendar/interfaces';
import {
  buildMergedScheduleItems,
  mergedScheduleItemsToCalendarEvents,
} from '@/lib/coordinator/merged-schedule';

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
  const items = buildMergedScheduleItems(defenses, institutionEvents);
  return mergedScheduleItemsToCalendarEvents(items, defenses, user);
}

export { buildMergedScheduleItems, type MergedScheduleItem, type MergedScheduleKind } from '@/lib/coordinator/merged-schedule';
