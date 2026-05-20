'use client';

import ScheduleFullCalendar from '@/components/calendar/ScheduleFullCalendar';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';

export interface AdviserFullCalendarProps {
  defenses?: Defense[];
  meetings?: Defense[];
  institutionEvents?: InstitutionEvent[];
  adviserId: string;
  adviserName: string;
}

export default function AdviserFullCalendar({
  defenses = [],
  meetings = [],
  institutionEvents = [],
  adviserId,
  adviserName,
}: AdviserFullCalendarProps) {
  return (
    <ScheduleFullCalendar
      defenses={defenses}
      meetings={meetings}
      institutionEvents={institutionEvents}
      userId={adviserId}
      userName={adviserName}
    />
  );
}
