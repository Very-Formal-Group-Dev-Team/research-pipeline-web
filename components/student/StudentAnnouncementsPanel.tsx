'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  format,
  startOfWeek,
} from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { RiMegaphoneLine } from 'react-icons/ri';

import Card, { CARD_HEADER_SECTION_CLASS, CARD_PADDING_CLASS } from '@/components/ui/Card';
import CardIconHeader from '@/components/ui/CardIconHeader';
import StudentAnnouncementsSkeleton from '@/components/skeletons/StudentAnnouncementsSkeleton';
import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import {
  filterAnnouncementsForMonth,
  filterAnnouncementsForWeek,
  flattenScheduleToAnnouncements,
  getWeekDayColumns,
  groupAnnouncementsByDay,
  KIND_STYLES,
} from '@/lib/student/schedule-announcements';

export interface StudentAnnouncementsPanelProps {
  defenses: Defense[];
  meetings: Defense[];
  events: InstitutionEvent[];
  loading?: boolean;
}

type ViewMode = 'week' | 'month';

function formatTimeRange(start: Date, end: Date) {
  const sameDay =
    format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
  if (sameDay) {
    return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
  }
  return `${format(start, 'MMM d h:mm a')} – ${format(end, 'MMM d h:mm a')}`;
}

export default function StudentAnnouncementsPanel({
  defenses,
  meetings,
  events,
  loading = false,
}: StudentAnnouncementsPanelProps) {
  const [view, setView] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(() => new Date());

  const allItems = useMemo(
    () => flattenScheduleToAnnouncements(defenses, meetings, events),
    [defenses, meetings, events],
  );

  const filtered = useMemo(() => {
    if (view === 'week') {
      return filterAnnouncementsForWeek(allItems, anchor);
    }
    return filterAnnouncementsForMonth(allItems, anchor);
  }, [allItems, view, anchor]);

  const grouped = useMemo(() => groupAnnouncementsByDay(filtered), [filtered]);
  const weekColumns = useMemo(() => getWeekDayColumns(anchor), [anchor]);

  const periodLabel =
    view === 'week'
      ? `Week of ${format(startOfWeek(anchor, { weekStartsOn: 0 }), 'MMM d, yyyy')}`
      : format(anchor, 'MMMM yyyy');

  function shiftPeriod(delta: number) {
    setAnchor((current) =>
      view === 'week'
        ? addDays(current, delta * 7)
        : addMonths(current, delta),
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className={CARD_HEADER_SECTION_CLASS}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardIconHeader
            className="mb-0"
            title="Announcements"
            description="Upcoming events, meetings, and defenses — open Events for full details"
            icon={<RiMegaphoneLine className="h-8 w-8" strokeWidth={0.30} aria-hidden />}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-neutral-200 p-1 bg-neutral-50">
              {(['week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    view === mode
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-primary-700'
                  }`}
                >
                  {mode === 'week' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftPeriod(-1)}
                className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Previous period"
              >
                <FiChevronLeft />
              </button>
              <span className="min-w-[10rem] text-center text-sm font-medium text-neutral-700">
                {periodLabel}
              </span>
              <button
                type="button"
                onClick={() => shiftPeriod(1)}
                className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Next period"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={CARD_PADDING_CLASS}>
        {loading ? (
          <StudentAnnouncementsSkeleton />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center">
            Nothing scheduled for this {view === 'week' ? 'week' : 'month'}.
          </p>
        ) : view === 'week' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekColumns.map((col) => {
              const dayItems = filtered.filter(
                (item) => format(item.start, 'yyyy-MM-dd') === col.dateKey,
              );
              return (
                <div
                  key={col.dateKey}
                  className="min-h-[6rem] rounded-lg border border-neutral-200 bg-neutral-50/80 p-2"
                >
                  <p className="text-xs font-semibold text-primary-700">{col.label}</p>
                  <p className="text-[0.65rem] text-neutral-500 mb-2">{col.sublabel}</p>
                  <ul className="space-y-2">
                    {dayItems.map((item) => (
                      <li key={item.id} className="text-xs">
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${KIND_STYLES[item.kind].dot}`}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-800 line-clamp-2">
                              {item.title}
                            </p>
                            <p className="text-neutral-500">
                              {format(item.start, 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
            {grouped.map((group) => (
              <div key={group.dateKey}>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                  {group.label}
                </p>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-white px-3 py-2"
                    >
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${KIND_STYLES[item.kind].dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800">{item.title}</p>
                        <p className="text-xs text-neutral-500">
                          {formatTimeRange(item.start, item.end)}
                        </p>
                      </div>
                      <span className="text-[0.65rem] font-medium text-neutral-400 uppercase">
                        {KIND_STYLES[item.kind].label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-neutral-100 text-center">
          <Link
            href="/student/events"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all events, meetings &amp; defenses →
          </Link>
        </div>
      </div>
    </Card>
  );
}
