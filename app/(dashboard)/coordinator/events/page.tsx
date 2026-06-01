'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiCalendar, FiMapPin, FiPlus, FiX, FiShield } from 'react-icons/fi';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { formLabelClassName, formTextareaResponsiveClassName } from '@/lib/utils/formControls';
import CoordinatorDefenseSections from '@/components/coordinator/CoordinatorDefenseSections';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  cancelCoordinatorEvent,
  createCoordinatorEvent,
  getCoordinatorEvents,
  type InstitutionEvent,
} from '@/lib/api/events';
import {
  bookDefenseSchedule,
  getCoordinatorRubrics,
  getCourses,
  getMyInstitution,
  getPendingDefenses,
  type Course,
  type Institution,
  type CoordinatorRubric,
} from '@/lib/api/coordinator';
import { formatStatusLabel } from '@/lib/utils/formatStatus';

type PageTab = 'events' | 'pending' | 'approved';
type ScheduleKind = 'event' | 'defense' | null;

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

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'scheduled': return 'default';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'warning';
  }
}

export default function CoordinatorEventsPage() {
  const searchParams = useSearchParams();
  const { user, handleLogout } = useDashboardUser('Coordinator');

  const initialTab = (searchParams.get('tab') as PageTab) || 'events';
  const [activeTab, setActiveTab] = useState<PageTab>(initialTab);
  const [events, setEvents] = useState<InstitutionEvent[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rubrics, setRubrics] = useState<CoordinatorRubric[]>([]);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    modality: 'Online' as 'Online' | 'In-Person' | 'Hybrid',
  });

  const [defenseForm, setDefenseForm] = useState({
    courseId: '',
    rubricId: '',
    defenseType: 'proposal' as 'proposal' | 'midterm' | 'final',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    venue: '',
    modality: 'Online',
  });

  async function loadEvents() {
    const [eventsRes, pendingRes] = await Promise.all([
      getCoordinatorEvents(),
      getPendingDefenses(),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (pendingRes.data) setPendingCount(pendingRes.data.length);
  }

  async function loadScheduleOptions() {
    const [instRes, coursesRes, rubricRes] = await Promise.all([
      getMyInstitution(),
      getCourses(),
      getCoordinatorRubrics(),
    ]);
    if (instRes.data) setInstitution(instRes.data);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (rubricRes.data) setRubrics(rubricRes.data);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await loadEvents();
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab') as PageTab | null;
    if (tab && ['events', 'pending', 'approved'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const filteredRubrics = useMemo(
    () => rubrics.filter((r) => r.defense_type === defenseForm.defenseType),
    [rubrics, defenseForm.defenseType],
  );

  function openScheduleModal() {
    setShowScheduleModal(true);
    setScheduleKind(null);
    setError(null);
    loadScheduleOptions();
  }

  function closeScheduleModal() {
    setShowScheduleModal(false);
    setScheduleKind(null);
    setError(null);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await createCoordinatorEvent({
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || undefined,
      start_time: `${eventForm.date}T${eventForm.startTime}:00`,
      end_time: `${eventForm.date}T${eventForm.endTime}:00`,
      location: eventForm.location.trim(),
      modality: eventForm.modality,
    });

    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }

    closeScheduleModal();
    setEventForm({
      title: '', description: '', date: '', startTime: '', endTime: '', location: '', modality: 'Online',
    });
    await loadEvents();
  }

  async function handleCreateDefense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await bookDefenseSchedule({
      courseId: defenseForm.courseId,
      rubricId: defenseForm.rubricId || undefined,
      defenseType: defenseForm.defenseType,
      date: defenseForm.date,
      startTime: defenseForm.startTime,
      endTime: defenseForm.endTime,
      location: defenseForm.location.trim(),
      venue: defenseForm.venue.trim() || undefined,
      modality: defenseForm.modality,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.data && 'conflict' in res.data && res.data.conflict) {
      const count = res.data.conflicts?.length ?? 0;
      const domains = [...new Set((res.data.conflicts || []).map((c) => c.domain))].join(', ');
      setError(
        count
          ? `Schedule conflict (${count} overlap${count === 1 ? '' : 's'}${domains ? `: ${domains}` : ''}). Use a different time or location.`
          : 'Schedule conflict detected. Use a different time or location.',
      );
      return;
    }

    closeScheduleModal();
    setDefenseForm({
      courseId: '', rubricId: '', defenseType: 'proposal',
      date: '', startTime: '', endTime: '', location: '', venue: '', modality: 'Online',
    });
    await loadEvents();
    setActiveTab('approved');
  }

  async function handleCancel(eventId: string) {
    const res = await cancelCoordinatorEvent(eventId);
    if (!res.error) await loadEvents();
  }

  const tabClass = (tab: PageTab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
      activeTab === tab
        ? 'coordinator-tab-active border-coordinator-rose text-coordinator-ink'
        : 'border-transparent text-neutral-500 hover:text-coordinator-ink'
    }`;

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold coordinator-heading">Events & Defenses</h1>
            <p className="coordinator-text-muted mt-1">
              Institution events, pending defense requests, and approved schedules
            </p>
          </div>
          <Button onClick={openScheduleModal}>
            <FiPlus className="mr-1" /> Schedule
          </Button>
        </div>

        <div className="flex gap-2 border-b border-neutral-200 pb-0">
          <button type="button" onClick={() => setActiveTab('events')} className={tabClass('events')}>
            Institution Events
          </button>
          <button type="button" onClick={() => setActiveTab('pending')} className={tabClass('pending')}>
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-coordinator-rose/15 text-coordinator-rose rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setActiveTab('approved')} className={tabClass('approved')}>
            Approved
          </button>
        </div>

        {activeTab === 'events' && (
          loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 coordinator-spinner" />
            </div>
          ) : events.length === 0 ? (
            <Card><p className="text-sm text-neutral-600">No events scheduled yet.</p></Card>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg coordinator-heading">{event.title}</h3>
                        <Badge variant={statusVariant(event.status)}>
                          {formatStatusLabel(event.status)}
                        </Badge>
                      </div>
                      {event.description ? (
                        <p className="text-sm text-neutral-600 mb-2">{event.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar /> {formatDateTime(event.start_time)} – {formatDateTime(event.end_time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin /> {event.location}
                        </span>
                        <span>{event.modality}</span>
                      </div>
                    </div>
                    {event.status === 'scheduled' ? (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(event.id)}>
                        <FiX className="mr-1" /> Cancel
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {activeTab === 'pending' && (
          <CoordinatorDefenseSections section="pending" onDataChange={loadEvents} />
        )}

        {activeTab === 'approved' && (
          <CoordinatorDefenseSections section="approved" onDataChange={loadEvents} />
        )}
      </div>

      <Modal
        isOpen={showScheduleModal}
        onClose={closeScheduleModal}
        title={scheduleKind === null ? 'What would you like to schedule?' : scheduleKind === 'event' ? 'Schedule Institution Event' : 'Schedule Defense'}
        size="md"
      >
        {scheduleKind === null ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setScheduleKind('event')}
              className="rounded-xl border-2 border-coordinator-navy/30 p-6 text-left hover:border-coordinator-navy hover:bg-coordinator-navy/5 transition-colors"
            >
              <FiCalendar className="text-2xl text-coordinator-navy mb-2" />
              <h3 className="font-semibold text-coordinator-ink">Event</h3>
              <p className="text-sm text-neutral-600 mt-1">Workshops, deadlines, and institution-wide activities</p>
            </button>
            <button
              type="button"
              onClick={() => setScheduleKind('defense')}
              className="rounded-xl border-2 border-coordinator-rose/30 p-6 text-left hover:border-coordinator-rose hover:bg-coordinator-rose/5 transition-colors"
            >
              <FiShield className="text-2xl text-coordinator-rose mb-2" />
              <h3 className="font-semibold text-coordinator-ink">Defense</h3>
              <p className="text-sm text-neutral-600 mt-1">Proposal, midterm, or final defense for a course</p>
            </button>
          </div>
        ) : scheduleKind === 'event' ? (
          <form onSubmit={handleCreateEvent} className="space-y-4 p-1">
            {error ? <p className="text-sm text-error-600 bg-error-50 rounded-lg px-3 py-2">{error}</p> : null}
            <Input
              label="Title"
              required
              value={eventForm.title}
              onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Event title"
              responsiveText
              fullWidth
            />
            <Input
              label="Institution (optional)"
              readOnly
              value={institution?.name || ''}
              placeholder="Uses your institution by default"
              className="bg-neutral-50 text-neutral-600"
              responsiveText
              fullWidth
            />
            <div>
              <label className={formLabelClassName}>Description</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                className={formTextareaResponsiveClassName}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Date"
                type="date"
                required
                value={eventForm.date}
                onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))}
                responsiveText
                fullWidth
              />
              <Input
                label="Start"
                type="time"
                required
                value={eventForm.startTime}
                onChange={(e) => setEventForm((f) => ({ ...f, startTime: e.target.value }))}
                responsiveText
                fullWidth
              />
              <Input
                label="End"
                type="time"
                required
                value={eventForm.endTime}
                onChange={(e) => setEventForm((f) => ({ ...f, endTime: e.target.value }))}
                responsiveText
                fullWidth
              />
            </div>
            <Input
              label="Location"
              required
              value={eventForm.location}
              onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
              responsiveText
              fullWidth
            />
            <Select
              fullWidth
              responsiveText
              label="Modality"
              value={eventForm.modality}
              onChange={(e) =>
                setEventForm((f) => ({ ...f, modality: e.target.value as typeof f.modality }))
              }
              options={[
                { value: 'Online', label: 'Online' },
                { value: 'In-Person', label: 'In-Person' },
                { value: 'Hybrid', label: 'Hybrid' },
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setScheduleKind(null)}>Back</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Create Event'}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateDefense} className="space-y-4 p-1">
            {error ? <p className="text-sm text-error-600 bg-error-50 rounded-lg px-3 py-2">{error}</p> : null}
            <Select
              fullWidth
              responsiveText
              label="Course"
              placeholder="Select course"
              value={defenseForm.courseId}
              onChange={(e) => setDefenseForm((f) => ({ ...f, courseId: e.target.value }))}
              options={courses.map((c) => ({
                value: c.id,
                label: `${c.course_name} (${c.code})`,
              }))}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                fullWidth
                responsiveText
                label="Defense Type"
                value={defenseForm.defenseType}
                onChange={(e) =>
                  setDefenseForm((f) => ({
                    ...f,
                    defenseType: e.target.value as typeof f.defenseType,
                    rubricId: '',
                  }))
                }
                options={[
                  { value: 'proposal', label: 'Proposal' },
                  { value: 'midterm', label: 'Midterm' },
                  { value: 'final', label: 'Final' },
                ]}
              />
              <Select
                fullWidth
                responsiveText
                label="Rubric"
                placeholder="Optional"
                value={defenseForm.rubricId}
                onChange={(e) => setDefenseForm((f) => ({ ...f, rubricId: e.target.value }))}
                options={filteredRubrics.map((r) => ({ value: r.id, label: r.name }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Date"
                type="date"
                required
                value={defenseForm.date}
                onChange={(e) => setDefenseForm((f) => ({ ...f, date: e.target.value }))}
                responsiveText
                fullWidth
              />
              <Input
                label="Start"
                type="time"
                required
                value={defenseForm.startTime}
                onChange={(e) => setDefenseForm((f) => ({ ...f, startTime: e.target.value }))}
                responsiveText
                fullWidth
              />
              <Input
                label="End"
                type="time"
                required
                value={defenseForm.endTime}
                onChange={(e) => setDefenseForm((f) => ({ ...f, endTime: e.target.value }))}
                responsiveText
                fullWidth
              />
            </div>
            <Input
              label="Location"
              required
              value={defenseForm.location}
              onChange={(e) => setDefenseForm((f) => ({ ...f, location: e.target.value }))}
              responsiveText
              fullWidth
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setScheduleKind(null)}>Back</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Schedule Defense'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
