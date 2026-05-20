'use client';

import React, { useMemo } from 'react';

import { CalendarBody } from '@/features/calendar/calendar-body';
import { CalendarProvider } from '@/features/calendar/contexts/calendar-context';
import { CalendarDndShell } from '@/features/calendar/contexts/dnd-context';
import { CalendarHeader } from '@/features/calendar/header/calendar-header';
import type { IEvent } from '@/features/calendar/interfaces';
import {
  buildScheduleCalendarUser,
  mapMyScheduleToCalendarEvents,
} from '@/lib/calendar/map-schedule-to-events';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';

export interface ScheduleFullCalendarProps {
  defenses?: Defense[];
  meetings?: Defense[];
  institutionEvents?: InstitutionEvent[];
  userId: string;
  userName: string;
  title?: string;
}

export default function ScheduleFullCalendar({
  defenses = [],
  meetings = [],
  institutionEvents = [],
  userId,
  userName,
}: ScheduleFullCalendarProps) {
  const calendarUser = useMemo(
    () => buildScheduleCalendarUser(userId, userName),
    [userId, userName],
  );

  const events: IEvent[] = useMemo(
    () =>
      mapMyScheduleToCalendarEvents(
        defenses,
        meetings,
        institutionEvents,
        calendarUser,
      ),
    [defenses, meetings, institutionEvents, calendarUser],
  );

  const users = useMemo(() => [calendarUser], [calendarUser]);

  return (
    <CalendarProvider
      events={events}
      users={users}
      view="month"
      badge="colored"
      readOnly
    >
      <CalendarDndShell enabled={false}>
        <div className="portal-calendar w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
          <CalendarHeader />
          <div className="min-h-[min(24rem,55vh)] sm:min-h-[28rem] lg:min-h-[32rem] max-h-[min(75vh,calc(100vh-12rem))] overflow-auto">
            <CalendarBody />
          </div>
        </div>
      </CalendarDndShell>
    </CalendarProvider>
  );
}
