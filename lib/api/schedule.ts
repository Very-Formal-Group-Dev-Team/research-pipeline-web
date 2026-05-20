/**
 * Combined schedule: defenses, meetings, and institution events.
 */

import { get } from './client';
import type { Defense } from './defenses';
import type { InstitutionEvent } from './events';

export type ScheduleDefense = Defense;
export type ScheduleMeeting = Defense;

export interface MySchedule {
  defenses: ScheduleDefense[];
  meetings: ScheduleMeeting[];
  events: InstitutionEvent[];
}

export function getMySchedule() {
  return get<MySchedule>('/schedule/me');
}
