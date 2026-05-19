'use client';

import React, { useMemo } from 'react';

import { CalendarBody } from '@/features/calendar/calendar-body';
import { CalendarProvider } from '@/features/calendar/contexts/calendar-context';
import { CalendarDndShell } from '@/features/calendar/contexts/dnd-context';
import { CalendarHeader } from '@/features/calendar/header/calendar-header';
import type { IEvent } from '@/features/calendar/interfaces';
import {
  buildAdviserCalendarUser,
  mapDefensesToCalendarEvents,
} from '@/lib/adviser/map-defense-calendar-events';
import type { Defense } from '@/lib/api/defenses';

export interface AdviserFullCalendarProps {
  defenses: Defense[];
  adviserId: string;
  adviserName: string;
}

export default function AdviserFullCalendar({
  defenses,
  adviserId,
  adviserName,
}: AdviserFullCalendarProps) {
  const adviser = useMemo(
    () => buildAdviserCalendarUser(adviserId, adviserName),
    [adviserId, adviserName],
  );

  const events: IEvent[] = useMemo(
    () => mapDefensesToCalendarEvents(defenses, adviser),
    [defenses, adviser],
  );

  const users = useMemo(() => [adviser], [adviser]);

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
