'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';

import CoordinatorScheduleCard from '@/components/coordinator/CoordinatorScheduleCard';
import DefenseScheduleCard from '@/components/defenses/DefenseScheduleCard';
import DefenseSortControls from '@/components/defenses/DefenseSortControls';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/layout/EmptyState';
import ScheduleListSkeleton from '@/components/events/ScheduleListSkeleton';
import MeetingScheduleCard from '@/components/meetings/MeetingScheduleCard';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import { getMySchedule } from '@/lib/api/schedule';
import { sortDefenses, type DefenseSortBy, type DefenseSortDirection } from '@/lib/defenses/sort';
import {
  MEETING_STATUS_FILTER_OPTIONS,
  MEETINGS_FILTER_CONTROL_CLASS,
  meetingMatchesStatusFilter,
  meetingStatusFilterEmptyLabel,
  type MeetingStatusFilter,
} from '@/lib/meetings/statusFilter';
type Tab = 'events' | 'meetings' | 'defenses';

function EventsList({ items }: { items: InstitutionEvent[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={<FiCalendar />} title="No institution events" description="" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <CoordinatorScheduleCard
          key={item.id}
          title={item.title}
          description={item.description}
          startTime={item.start_time}
          endTime={item.end_time}
          modality={item.modality}
          location={item.location}
          status={item.status}
        />
      ))}
    </div>
  );
}

function MeetingsList({
  items,
  totalCount,
  statusFilter,
}: {
  items: Defense[];
  totalCount: number;
  statusFilter: MeetingStatusFilter;
}) {
  if (totalCount === 0) {
    return (
      <Card>
        <EmptyState icon={<FiCalendar />} title="No adviser meetings" description="" />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        No {meetingStatusFilterEmptyLabel(statusFilter)} to show.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <MeetingScheduleCard key={item.id} meeting={item} layout="student" />
      ))}
    </div>
  );
}

function DefensesList({ items }: { items: Defense[] }) {
  const [sortBy, setSortBy] = useState<DefenseSortBy>('time');
  const [sortDirection, setSortDirection] = useState<DefenseSortDirection>('asc');
  const sortedItems = useMemo(
    () => sortDefenses(items, sortBy, sortDirection),
    [items, sortBy, sortDirection],
  );

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={<FiCalendar />} title="No defense schedules" description="" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <DefenseSortControls
        sortBy={sortBy}
        direction={sortDirection}
        onSortByChange={setSortBy}
        onDirectionChange={setSortDirection}
        tone="student"
      />
      <div className="space-y-3">
        {sortedItems.map((item) => (
          <DefenseScheduleCard key={item.id} defense={item} />
        ))}
      </div>
    </div>
  );
}

export default function StudentEventsPage() {
  const { user, handleLogout } = useDashboardUser('Student');
  const [tab, setTab] = useState<Tab>('events');
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [events, setEvents] = useState<InstitutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingStatusFilter, setMeetingStatusFilter] =
    useState<MeetingStatusFilter>('scheduled');

  const filteredMeetings = useMemo(
    () => meetings.filter((meeting) => meetingMatchesStatusFilter(meeting, meetingStatusFilter)),
    [meetings, meetingStatusFilter],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await getMySchedule();
      if (!cancelled && res.data) {
        setDefenses(res.data.defenses);
        setMeetings(res.data.meetings);
        setEvents(res.data.events);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: 'events', label: `Events (${events.length})` },
      { id: 'meetings', label: `Meetings (${meetings.length})` },
      { id: 'defenses', label: `Defenses (${defenses.length})` },
    ],
    [events.length, meetings.length, defenses.length],
  );

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Events</h1>
          <p className="text-neutral-600 mt-1">
            Institution events, adviser meetings, and defense schedules for your projects
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-300 pb-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === t.id
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'meetings' ? (
            <Select
              aria-label="Filter meetings by status"
              value={meetingStatusFilter}
              onChange={(e) =>
                setMeetingStatusFilter(e.target.value as MeetingStatusFilter)
              }
              options={MEETING_STATUS_FILTER_OPTIONS}
              responsiveText
              className={`${MEETINGS_FILTER_CONTROL_CLASS} !px-3 !pr-9 min-w-[9.75rem] shrink-0 text-sm`}
            />
          ) : null}
        </div>

        {loading ? (
          <ScheduleListSkeleton
            ariaLabel="Loading events"
            showDescription={tab === 'events'}
            showMeetingExtras={tab === 'meetings'}
            showSortControls={tab === 'defenses'}
            showSecondBadge={tab === 'defenses'}
            showTrailing={tab === 'defenses'}
          />
        ) : tab === 'events' ? (
          <EventsList items={events} />
        ) : tab === 'meetings' ? (
          <MeetingsList
            items={filteredMeetings}
            totalCount={meetings.length}
            statusFilter={meetingStatusFilter}
          />
        ) : (
          <DefensesList items={defenses} />
        )}
      </div>
    </DashboardLayout>
  );
}
