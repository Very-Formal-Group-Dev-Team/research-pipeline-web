'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';

import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/layout/EmptyState';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import { getMySchedule } from '@/lib/api/schedule';
import { formatStatusLabel } from '@/lib/utils/formatStatus';

function formatDateTime(iso?: string | null) {
  if (!iso) return '-';
  const parsed = new Date(iso.replace(/Z$/i, ''));
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

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
        <Card key={item.id}>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-primary-700">{item.title}</h3>
            <Badge variant="primary">{formatStatusLabel(item.status)}</Badge>
          </div>
          {item.description ? (
            <p className="text-sm text-neutral-600 mb-2">{item.description}</p>
          ) : null}
          <p className="text-sm text-neutral-600 inline-flex items-center gap-1">
            <FiClock /> {formatDateTime(item.start_time)} – {formatDateTime(item.end_time)}
          </p>
          <p className="text-sm text-neutral-600 inline-flex items-center gap-1 mt-1">
            <FiMapPin /> {item.location}
            {item.modality ? ` · ${item.modality}` : ''}
          </p>
        </Card>
      ))}
    </div>
  );
}

function defenseTypeVariant(type: string): 'primary' | 'warning' | 'success' | 'default' {
  switch (type) {
    case 'proposal':
      return 'primary';
    case 'midterm':
      return 'warning';
    case 'final':
      return 'success';
    default:
      return 'default';
  }
}

function MeetingsList({ items }: { items: Defense[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={<FiCalendar />} title="No adviser meetings" description="" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-primary-700">{item.project_title}</h3>
            <Badge variant={defenseTypeVariant(item.defense_type)}>
              {formatStatusLabel(item.defense_type)}
            </Badge>
            {item.status ? (
              <Badge variant="warning">
                {formatStatusLabel(item.status_label || item.status)}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-neutral-500 mb-2">{item.project_code}</p>
          <p className="text-sm text-neutral-600 inline-flex items-center gap-1">
            <FiClock /> {formatDateTime(item.start_time || item.scheduled_at)}
            {item.end_time ? ` – ${formatDateTime(item.end_time)}` : ''}
          </p>
          {item.location ? (
            <p className="text-sm text-neutral-600 inline-flex items-center gap-1 mt-1">
              <FiMapPin /> {item.location}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function DefensesList({ items }: { items: Defense[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={<FiCalendar />} title="No defense schedules" description="" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-primary-700">{item.project_title}</h3>
            <Badge variant={defenseTypeVariant(item.defense_type)}>
              {formatStatusLabel(item.defense_type)}
            </Badge>
            {item.status ? (
              <Badge variant="warning">
                {formatStatusLabel(item.status_label || item.status)}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-neutral-500 mb-2">{item.project_code}</p>
          {item.adviser_name ? (
            <p className="text-sm text-neutral-600 mb-2">Adviser: {item.adviser_name}</p>
          ) : null}
          <p className="text-sm text-neutral-600 inline-flex items-center gap-1">
            <FiClock /> {formatDateTime(item.start_time || item.scheduled_at)}
            {item.end_time ? ` – ${formatDateTime(item.end_time)}` : ''}
          </p>
          {(item.location || item.venue) ? (
            <p className="text-sm text-neutral-600 inline-flex items-center gap-1 mt-1">
              <FiMapPin /> {item.venue || item.location}
            </p>
          ) : null}
        </Card>
      ))}
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

        <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
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

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : tab === 'events' ? (
          <EventsList items={events} />
        ) : tab === 'meetings' ? (
          <MeetingsList items={meetings} />
        ) : (
          <DefensesList items={defenses} />
        )}
      </div>
    </DashboardLayout>
  );
}
