'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCalendar } from 'react-icons/fi';

import Button from '@/components/Button';
import CoordinatorScheduleCard from '@/components/coordinator/CoordinatorScheduleCard';
import DefenseScheduleCard from '@/components/defenses/DefenseScheduleCard';
import DefenseSortControls from '@/components/defenses/DefenseSortControls';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/layout/EmptyState';
import ScheduleListSkeleton from '@/components/events/ScheduleListSkeleton';
import MeetingScheduleCard from '@/components/meetings/MeetingScheduleCard';
import Card from '@/components/ui/Card';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  cancelMeeting,
  completeMeeting,
  restoreMeeting,
  type Defense,
} from '@/lib/api/defenses';
import type { InstitutionEvent } from '@/lib/api/events';
import { meetingUndoToastMessage } from '@/lib/meetings/undoStatusMessages';
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
  meetingActionLoading,
  onEditMeeting,
  onCancelMeeting,
  onCompleteMeeting,
}: {
  items: Defense[];
  totalCount: number;
  statusFilter: MeetingStatusFilter;
  meetingActionLoading: boolean;
  onEditMeeting: (meeting: Defense) => void;
  onCancelMeeting: (meetingId: string) => void;
  onCompleteMeeting: (meetingId: string) => void;
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
        <MeetingScheduleCard
          key={item.id}
          meeting={item}
          layout="adviser"
          actions={{
            onEdit: () => onEditMeeting(item),
            onCancel: () => onCancelMeeting(item.id),
            onComplete: () => void onCompleteMeeting(item.id),
            disabled: meetingActionLoading,
          }}
        />
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

export default function AdviserEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, handleLogout } = useDashboardUser('Adviser');
  const initialTab = (searchParams.get('tab') as Tab) || 'events';
  const [tab, setTab] = useState<Tab>(
    ['events', 'meetings', 'defenses'].includes(initialTab) ? initialTab : 'events',
  );
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [events, setEvents] = useState<InstitutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingStatusFilter, setMeetingStatusFilter] =
    useState<MeetingStatusFilter>('scheduled');
  const [cancelMeetingId, setCancelMeetingId] = useState<string | null>(null);
  const [meetingActionLoading, setMeetingActionLoading] = useState(false);
  const [meetingActionError, setMeetingActionError] = useState<string | null>(null);
  const { toast: meetingUndoToast, showUndoToast: showMeetingUndoToast, dismissUndoToast: dismissMeetingUndoToast } =
    useUndoActionToast();

  const filteredMeetings = useMemo(
    () => meetings.filter((meeting) => meetingMatchesStatusFilter(meeting, meetingStatusFilter)),
    [meetings, meetingStatusFilter],
  );

  const loadSchedule = useCallback(async () => {
    const res = await getMySchedule();
    if (res.data) {
      setDefenses(res.data.defenses);
      setMeetings(res.data.meetings);
      setEvents(res.data.events);
    }
    return res;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await loadSchedule();
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [loadSchedule]);

  useEffect(() => {
    const nextTab = searchParams.get('tab') as Tab | null;
    if (nextTab && ['events', 'meetings', 'defenses'].includes(nextTab)) {
      setTab(nextTab);
    }
  }, [searchParams]);

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: 'events', label: `Events (${events.length})` },
      { id: 'meetings', label: `Meetings (${meetings.length})` },
      { id: 'defenses', label: `Defenses (${defenses.length})` },
    ],
    [events.length, meetings.length, defenses.length],
  );

  const handleEditMeeting = (meeting: Defense) => {
    const query = new URLSearchParams({
      project_id: String(meeting.project_id),
      project_code: meeting.project_code || '',
      title: meeting.project_title || '',
      meeting_id: meeting.id,
    });
    router.push(`/defenses?${query.toString()}`);
  };

  const handleRevertMeeting = async (meetingId: string) => {
    const res = await restoreMeeting(meetingId);
    if (res.error) {
      setMeetingActionError(res.error);
      return;
    }
    await loadSchedule();
  };

  const handleCompleteMeeting = async (meetingId: string) => {
    setMeetingActionLoading(true);
    setMeetingActionError(null);
    dismissMeetingUndoToast();
    try {
      const res = await completeMeeting(meetingId);
      if (res.error) {
        setMeetingActionError(res.error);
        return;
      }
      await loadSchedule();
      showMeetingUndoToast({
        message: meetingUndoToastMessage('complete'),
        onUndo: () => handleRevertMeeting(meetingId),
      });
    } catch {
      setMeetingActionError('Failed to mark meeting as complete.');
    } finally {
      setMeetingActionLoading(false);
    }
  };

  const handleConfirmCancelMeeting = async () => {
    if (!cancelMeetingId) return;
    const meetingId = cancelMeetingId;
    setMeetingActionLoading(true);
    setMeetingActionError(null);
    dismissMeetingUndoToast();
    try {
      const res = await cancelMeeting(meetingId);
      if (res.error) {
        setMeetingActionError(res.error);
        return;
      }
      setCancelMeetingId(null);
      await loadSchedule();
      showMeetingUndoToast({
        message: meetingUndoToastMessage('cancel'),
        onUndo: () => handleRevertMeeting(meetingId),
      });
    } catch {
      setMeetingActionError('Failed to cancel meeting.');
    } finally {
      setMeetingActionLoading(false);
    }
  };

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Events</h1>
          <p className="text-neutral-600 mt-1">
            Institution events, adviser meetings, and defense schedules for your advisees
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
            <div className="flex shrink-0 items-center gap-3">
              <Select
                aria-label="Filter meetings by status"
                value={meetingStatusFilter}
                onChange={(e) =>
                  setMeetingStatusFilter(e.target.value as MeetingStatusFilter)
                }
                options={MEETING_STATUS_FILTER_OPTIONS}
                responsiveText
                className={`${MEETINGS_FILTER_CONTROL_CLASS} !px-3 !pr-9 min-w-[9.75rem] text-sm`}
              />
              <Button
                size="sm"
                variant="primary"
                className={`${MEETINGS_FILTER_CONTROL_CLASS} !px-3.5 text-sm`}
                onClick={() => router.push('/defenses')}
              >
                Book a Meeting
              </Button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <ScheduleListSkeleton
            ariaLabel="Loading events"
            showDescription={tab === 'events'}
            showMeetingExtras={tab === 'meetings'}
            showActions={tab === 'meetings'}
            showSortControls={tab === 'defenses'}
            showSecondBadge={tab === 'defenses'}
            showTrailing={tab === 'defenses'}
          />
        ) : tab === 'events' ? (
          <EventsList items={events} />
        ) : tab === 'meetings' ? (
          <>
            <MeetingsList
              items={filteredMeetings}
              totalCount={meetings.length}
              statusFilter={meetingStatusFilter}
              meetingActionLoading={meetingActionLoading}
              onEditMeeting={handleEditMeeting}
              onCancelMeeting={setCancelMeetingId}
              onCompleteMeeting={handleCompleteMeeting}
            />
            {meetingActionError ? (
              <p className="text-center text-sm text-archivumRed">{meetingActionError}</p>
            ) : null}
          </>
        ) : (
          <DefensesList items={defenses} />
        )}
      </div>

      <Modal
        isOpen={Boolean(cancelMeetingId)}
        onClose={() => {
          if (!meetingActionLoading) setCancelMeetingId(null);
        }}
        title="Cancel meeting?"
        size="sm"
      >
        <p className="text-sm text-neutral-700">
          This meeting will be marked as cancelled. Students will still see it in the list with
          a cancelled status.
        </p>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCancelMeetingId(null)}
            disabled={meetingActionLoading}
          >
            Keep meeting
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={() => void handleConfirmCancelMeeting()}
            loading={meetingActionLoading}
            disabled={meetingActionLoading}
          >
            Cancel meeting
          </Button>
        </ModalFooter>
      </Modal>

      <UndoActionToastHost toast={meetingUndoToast} onDismiss={dismissMeetingUndoToast} />
    </DashboardLayout>
  );
}
