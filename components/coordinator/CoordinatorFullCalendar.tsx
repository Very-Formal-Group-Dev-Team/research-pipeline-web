'use client';

import React, { useMemo } from 'react';

import { CalendarBody } from '@/features/calendar/calendar-body';
import { CalendarProvider } from '@/features/calendar/contexts/calendar-context';
import { CalendarDndShell } from '@/features/calendar/contexts/dnd-context';
import { CalendarHeader } from '@/features/calendar/header/calendar-header';
import type { IEvent } from '@/features/calendar/interfaces';
import type { Defense } from '@/lib/api/coordinator';
import type { InstitutionEvent } from '@/lib/api/events';
import {
  buildCoordinatorCalendarUser,
  mergeCoordinatorCalendarEvents,
} from '@/lib/coordinator/map-schedule-calendar-events';

export interface CoordinatorFullCalendarProps {
  defenses: Defense[];
  institutionEvents: InstitutionEvent[];
  coordinatorId: string;
  coordinatorName: string;
}

export default function CoordinatorFullCalendar({
  defenses,
  institutionEvents,
  coordinatorId,
  coordinatorName,
}: CoordinatorFullCalendarProps) {
  const coordinator = useMemo(
    () => buildCoordinatorCalendarUser(coordinatorId, coordinatorName),
    [coordinatorId, coordinatorName],
  );

  const events: IEvent[] = useMemo(
    () => mergeCoordinatorCalendarEvents(defenses, institutionEvents, coordinator),
    [defenses, institutionEvents, coordinator],
  );

  const users = useMemo(() => [coordinator], [coordinator]);

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
