'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCalendar, FiPlus, FiSave, FiSearch, FiShield, FiX } from 'react-icons/fi';
import { toast } from 'sonner';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/Button';
import Card from '@/components/ui/Card';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import CoordinatorScheduleCard from '@/components/coordinator/CoordinatorScheduleCard';
import { formLabelClassName, formTextareaResponsiveClassName } from '@/lib/utils/formControls';
import {
  COORDINATOR_DATE_FIELD_WRAPPER_CLASS,
  COORDINATOR_DATE_TIME_ROW_CLASS,
  COORDINATOR_TIME_FIELD_WRAPPER_CLASS,
  COORDINATOR_SCHEDULE_FORM_CLASS,
  COORDINATOR_SCHEDULE_EVENT_FORM_CLASS,
  COORDINATOR_SCHEDULE_DEFENSE_FORM_CLASS,
  COORDINATOR_SCHEDULE_MODAL_SIZE,
  CoordinatorTimeRangeFields,
} from '@/components/coordinator/CoordinatorTimeRangeFields';
import CoordinatorGroupMultiSelect from '@/components/coordinator/CoordinatorGroupMultiSelect';
import CoordinatorDefenseSections from '@/components/coordinator/CoordinatorDefenseSections';
import { buildDefenseIdsByProjectId } from '@/lib/coordinator/defenseBatchEvent';
import { saveDefenseBatchSession } from '@/lib/coordinator/defenseBatchSession';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  cancelCoordinatorEvent,
  completeCoordinatorEvent,
  createCoordinatorEvent,
  getCoordinatorEvents,
  revertCoordinatorEvent,
  updateCoordinatorEvent,
  type InstitutionEvent,
} from '@/lib/api/events';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import { institutionEventUndoToastMessage } from '@/lib/meetings/undoStatusMessages';
import {
  institutionEventFormToPayload,
  institutionEventToFormState,
  type InstitutionEventFormState,
} from '@/lib/coordinator/institutionEventDisplay';
import {
  bookDefenseSchedule,
  type BookDefenseScheduleResult,
  getCoordinatorRubrics,
  getCourseGroups,
  getCourses,
  getInstitutionPanelists,
  getMyInstitution,
  getPendingDefenses,
  type Course,
  type CourseGroup,
  type Institution,
  type InstitutionAdviser,
  type CoordinatorRubric,
} from '@/lib/api/coordinator';

type PageTab = 'events' | 'pending' | 'approved';
type ScheduleKind = 'event' | 'defense' | null;
type DefenseScheduleMode = 'course' | 'groups';

const EMPTY_EVENT_FORM: InstitutionEventFormState = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  modality: 'Online',
};

const EMPTY_DEFENSE_FORM = {
  courseId: '',
  rubricId: '',
  defenseType: 'proposal' as const,
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  venue: '',
  modality: 'Online',
};

export default function CoordinatorEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, handleLogout } = useDashboardUser('Coordinator');

  const initialTab = (searchParams.get('tab') as PageTab) || 'events';
  const [activeTab, setActiveTab] = useState<PageTab>(initialTab);
  const [events, setEvents] = useState<InstitutionEvent[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [defenseRefreshKey, setDefenseRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventActionLoading, setEventActionLoading] = useState(false);
  const [eventActionError, setEventActionError] = useState<string | null>(null);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<InstitutionEvent | null>(null);
  const [editForm, setEditForm] = useState<InstitutionEventFormState>(EMPTY_EVENT_FORM);
  const { toast: eventUndoToast, showUndoToast: showEventUndoToast, dismissUndoToast: dismissEventUndoToast } =
    useUndoActionToast();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rubrics, setRubrics] = useState<CoordinatorRubric[]>([]);
  const [panelistPool, setPanelistPool] = useState<InstitutionAdviser[]>([]);

  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);

  const [defenseForm, setDefenseForm] = useState(EMPTY_DEFENSE_FORM);

  const [selectedPanelists, setSelectedPanelists] = useState<InstitutionAdviser[]>([]);
  const [panelistQuery, setPanelistQuery] = useState('');
  const [defenseScheduleMode, setDefenseScheduleMode] = useState<DefenseScheduleMode>('course');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [courseGroupsLoading, setCourseGroupsLoading] = useState(false);
  const loadEvents = useCallback(async () => {
    const [eventsRes, pendingRes] = await Promise.all([
      getCoordinatorEvents(),
      getPendingDefenses(),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (pendingRes.data) setPendingCount(pendingRes.data.length);
  }, []);

  async function loadScheduleOptions() {
    const [instRes, coursesRes, rubricRes, panelistsRes] = await Promise.all([
      getMyInstitution(),
      getCourses(),
      getCoordinatorRubrics(),
      getInstitutionPanelists(),
    ]);
    if (instRes.data) setInstitution(instRes.data);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (rubricRes.data) setRubrics(rubricRes.data);
    if (panelistsRes.data) setPanelistPool(panelistsRes.data);
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

  const panelistSuggestions = useMemo(() => {
    const selectedIds = new Set(selectedPanelists.map((p) => p.id));
    const term = panelistQuery.trim().toLowerCase();
    return panelistPool.filter((member) => {
      if (selectedIds.has(member.id)) return false;
      if (!term) return false;
      const name = member.full_name?.toLowerCase() || '';
      const email = member.email?.toLowerCase() || '';
      return name.includes(term) || email.includes(term);
    });
  }, [panelistPool, panelistQuery, selectedPanelists]);

  function resetPanelistSelection() {
    setSelectedPanelists([]);
    setPanelistQuery('');
  }

  function resetEventForm() {
    setEventForm(EMPTY_EVENT_FORM);
  }

  function resetDefenseForm() {
    setDefenseForm(EMPTY_DEFENSE_FORM);
  }

  function resetDefenseScheduleMode() {
    setDefenseScheduleMode('course');
    setSelectedGroupIds([]);
    setCourseGroups([]);
    setCourseGroupsLoading(false);
  }

  function switchDefenseScheduleMode(mode: DefenseScheduleMode) {
    if (mode === defenseScheduleMode) return;
    setDefenseScheduleMode(mode);
    setSelectedGroupIds([]);
    setDefenseForm((form) => ({ ...form, startTime: '', endTime: '' }));
  }

  function addPanelist(adviser: InstitutionAdviser) {
    setSelectedPanelists((prev) => [...prev, adviser]);
    setPanelistQuery('');
  }

  function removePanelist(userId: string) {
    setSelectedPanelists((prev) => prev.filter((p) => p.id !== userId));
  }

  const editEventFormDirty = useMemo(() => {
    if (!editEvent) return false;
    const baseline = institutionEventToFormState(editEvent);
    return (Object.keys(baseline) as (keyof InstitutionEventFormState)[]).some(
      (key) => editForm[key] !== baseline[key],
    );
  }, [editEvent, editForm]);

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
    setSubmitting(false);
    resetEventForm();
    resetDefenseForm();
    resetPanelistSelection();
    resetDefenseScheduleMode();
  }

  useEffect(() => {
    if (defenseScheduleMode !== 'groups' || !defenseForm.courseId) {
      setCourseGroups([]);
      setCourseGroupsLoading(false);
      return;
    }

    let cancelled = false;
    setCourseGroupsLoading(true);

    void getCourseGroups(defenseForm.courseId).then((res) => {
      if (cancelled) return;
      setCourseGroups(res.data ?? []);
      setCourseGroupsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [defenseScheduleMode, defenseForm.courseId]);

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
    await loadEvents();
  }

  async function handleCreateDefense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (defenseScheduleMode === 'course') {
      setSubmitting(true);

      const groupsRes = await getCourseGroups(defenseForm.courseId);
      if (groupsRes.error) {
        setSubmitting(false);
        setError(groupsRes.error);
        return;
      }

      const groups = groupsRes.data ?? [];
      if (!groups.length) {
        setSubmitting(false);
        setError('No groups found for this course.');
        return;
      }

      const bookRes = await bookDefenseSchedule({
        courseId: defenseForm.courseId,
        rubricId: defenseForm.rubricId || undefined,
        defenseType: defenseForm.defenseType,
        date: defenseForm.date,
        startTime: defenseForm.startTime,
        endTime: defenseForm.endTime,
        location: defenseForm.location.trim(),
        venue: defenseForm.venue.trim() || undefined,
        modality: defenseForm.modality,
        panelistIds: selectedPanelists.length
          ? selectedPanelists.map((panelist) => panelist.id)
          : undefined,
      });

      setSubmitting(false);

      if (bookRes.error) {
        setError(bookRes.error);
        return;
      }

      if (bookRes.data && 'conflict' in bookRes.data && bookRes.data.conflict) {
        const count = bookRes.data.conflicts?.length ?? 0;
        const domains = [...new Set((bookRes.data.conflicts || []).map((c) => c.domain))].join(', ');
        setError(
          count
            ? `Schedule conflict (${count} overlap${count === 1 ? '' : 's'}${domains ? `: ${domains}` : ''}). Use a different time or location.`
            : 'Schedule conflict detected. Use a different time or location.',
        );
        return;
      }

      const bookedDefenses =
        (bookRes.data as BookDefenseScheduleResult | undefined)?.booked_defenses ?? [];
      const course = courses.find((item) => item.id === defenseForm.courseId);

      saveDefenseBatchSession({
        mode: 'create',
        draft: {
          courseId: defenseForm.courseId,
          courseName: course ? `${course.course_name} (${course.code})` : 'Selected course',
          defenseType: defenseForm.defenseType,
          date: defenseForm.date,
          startTime: defenseForm.startTime,
          endTime: defenseForm.endTime,
          location: defenseForm.location,
          venue: defenseForm.venue,
          modality: defenseForm.modality,
          rubricId: defenseForm.rubricId,
          panelistIds: selectedPanelists.map((panelist) => panelist.id),
        },
        eventGroups: groups,
        courseGroups: groups,
        defenseIdsByProjectId: buildDefenseIdsByProjectId(bookedDefenses),
      });
      closeScheduleModal();
      setDefenseRefreshKey((key) => key + 1);
      router.push('/coordinator/events/edit');
      return;
    }

    if (!selectedGroupIds.length) {
      setError('Select at least one group.');
      return;
    }

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
      panelistIds: selectedPanelists.length
        ? selectedPanelists.map((panelist) => panelist.id)
        : undefined,
      projectIds: defenseScheduleMode === 'groups' ? selectedGroupIds : undefined,
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
    setDefenseRefreshKey((key) => key + 1);
    await loadEvents();
    setActiveTab('approved');
  }

  function openEditEvent(event: InstitutionEvent) {
    setEditEvent(event);
    setEditForm(institutionEventToFormState(event));
    setEventActionError(null);
  }

  function closeEditEvent() {
    if (eventActionLoading) return;
    setEditEvent(null);
    setEditForm(EMPTY_EVENT_FORM);
    setEventActionError(null);
  }

  async function handleRevertEvent(eventId: string) {
    const res = await revertCoordinatorEvent(eventId);
    if (res.error) {
      setEventActionError(res.error);
      return;
    }
    await loadEvents();
  }

  async function handleCompleteEvent(eventId: string) {
    setEventActionLoading(true);
    setEventActionError(null);
    dismissEventUndoToast();
    try {
      const res = await completeCoordinatorEvent(eventId);
      if (res.error) {
        setEventActionError(res.error);
        return;
      }
      await loadEvents();
      showEventUndoToast({
        message: institutionEventUndoToastMessage('complete'),
        onUndo: () => handleRevertEvent(eventId),
      });
    } catch {
      setEventActionError('Failed to mark event as complete.');
    } finally {
      setEventActionLoading(false);
    }
  }

  async function handleConfirmCancelEvent() {
    if (!cancelEventId) return;
    const eventId = cancelEventId;
    setEventActionLoading(true);
    setEventActionError(null);
    dismissEventUndoToast();
    try {
      const res = await cancelCoordinatorEvent(eventId);
      if (res.error) {
        setEventActionError(res.error);
        return;
      }
      setCancelEventId(null);
      await loadEvents();
      showEventUndoToast({
        message: institutionEventUndoToastMessage('cancel'),
        onUndo: () => handleRevertEvent(eventId),
      });
    } catch {
      setEventActionError('Failed to cancel event.');
    } finally {
      setEventActionLoading(false);
    }
  }

  async function handleSaveEditEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!editEvent || !editEventFormDirty) return;
    setEventActionError(null);
    setEventActionLoading(true);

    const res = await updateCoordinatorEvent(editEvent.id, institutionEventFormToPayload(editForm));
    setEventActionLoading(false);

    if (res.error) {
      setEventActionError(res.error);
      return;
    }

    closeEditEvent();
    await loadEvents();
    toast.success('Changes saved');
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
                <CoordinatorScheduleCard
                  key={event.id}
                  title={event.title}
                  description={event.description}
                  startTime={event.start_time}
                  endTime={event.end_time}
                  modality={event.modality}
                  location={event.location}
                  status={event.status}
                  actions={{
                    onEdit: () => openEditEvent(event),
                    onCancel: () => setCancelEventId(event.id),
                    onComplete: () => void handleCompleteEvent(event.id),
                    disabled: eventActionLoading,
                  }}
                />
              ))}
              {eventActionError ? (
                <p className="text-center text-sm text-archivumRed">{eventActionError}</p>
              ) : null}
            </div>
          )
        )}

        {activeTab === 'pending' && (
          <CoordinatorDefenseSections
            key={`pending-${defenseRefreshKey}`}
            section="pending"
            onDataChange={loadEvents}
          />
        )}

        {activeTab === 'approved' && (
          <CoordinatorDefenseSections
            key={`approved-${defenseRefreshKey}`}
            section="approved"
            onDataChange={loadEvents}
          />
        )}
      </div>

      <Modal
        isOpen={showScheduleModal}
        onClose={closeScheduleModal}
        title={scheduleKind === null ? 'What would you like to schedule?' : scheduleKind === 'event' ? 'Schedule Institution Event' : 'Schedule Defense'}
        size={scheduleKind === null ? 'lg' : COORDINATOR_SCHEDULE_MODAL_SIZE}
      >
        {scheduleKind === null ? (
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            <button
              type="button"
              onClick={() => setScheduleKind('event')}
              className="flex min-h-[11.5rem] w-full flex-col rounded-xl border-2 border-coordinator-navy/30 p-8 text-left transition-colors hover:border-coordinator-navy hover:bg-coordinator-navy/5 sm:min-h-[12.5rem]"
            >
              <FiCalendar className="mb-3 h-9 w-9 text-coordinator-navy" aria-hidden />
              <h3 className="text-lg font-semibold text-coordinator-ink">Event</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Workshops, deadlines, and institution-wide activities
              </p>
            </button>
            <button
              type="button"
              onClick={() => setScheduleKind('defense')}
              className="flex min-h-[11.5rem] w-full flex-col rounded-xl border-2 border-coordinator-rose/30 p-8 text-left transition-colors hover:border-coordinator-rose hover:bg-coordinator-rose/5 sm:min-h-[12.5rem]"
            >
              <FiShield className="mb-3 h-9 w-9 text-coordinator-rose" aria-hidden />
              <h3 className="text-lg font-semibold text-coordinator-ink">Defense</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Proposal, midterm, or final defense for a course
              </p>
            </button>
          </div>
        ) : scheduleKind === 'event' ? (
          <form onSubmit={handleCreateEvent} className={`space-y-3 ${COORDINATOR_SCHEDULE_EVENT_FORM_CLASS}`}>
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
            <div className={COORDINATOR_DATE_TIME_ROW_CLASS}>
              <div className={COORDINATOR_DATE_FIELD_WRAPPER_CLASS}>
                <Input
                  label="Date"
                  type="date"
                  required
                  value={eventForm.date}
                  onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))}
                  responsiveText
                  fullWidth
                />
              </div>
              <div className={COORDINATOR_TIME_FIELD_WRAPPER_CLASS}>
                <CoordinatorTimeRangeFields
                  required
                  startTime={eventForm.startTime}
                  endTime={eventForm.endTime}
                  onStartChange={(value) => setEventForm((f) => ({ ...f, startTime: value }))}
                  onEndChange={(value) => setEventForm((f) => ({ ...f, endTime: value }))}
                />
              </div>
            </div>
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
                { value: 'In-Person', label: 'Face-to-Face' },
                { value: 'Hybrid', label: 'Hybrid' },
              ]}
            />
            <Input
              label="Location"
              required
              value={eventForm.location}
              onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
              responsiveText
              fullWidth
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setScheduleKind(null)}>Back</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Create Event'}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateDefense} className={`space-y-3 ${COORDINATOR_SCHEDULE_DEFENSE_FORM_CLASS}`}>
            {error ? <p className="text-sm text-error-600 bg-error-50 rounded-lg px-3 py-2">{error}</p> : null}
            <div
              className="inline-flex w-full rounded-lg border border-neutral-200 bg-neutral-50 p-1"
              role="group"
              aria-label="Defense scheduling mode"
            >
              {([
                { value: 'course' as const, label: 'Course' },
                { value: 'groups' as const, label: 'Select Groups' },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => switchDefenseScheduleMode(option.value)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    defenseScheduleMode === option.value
                      ? 'bg-coordinator-rose text-white shadow-sm'
                      : 'text-neutral-600 hover:text-coordinator-ink'
                  }`}
                  aria-pressed={defenseScheduleMode === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Select
              fullWidth
              responsiveText
              label="Course"
              placeholder="Select course"
              value={defenseForm.courseId}
              onChange={(e) => {
                const courseId = e.target.value;
                setDefenseForm((f) => ({ ...f, courseId }));
                setSelectedGroupIds([]);
              }}
              options={courses.map((c) => ({
                value: c.id,
                label: `${c.course_name} (${c.code})`,
              }))}
              required
            />
            {defenseScheduleMode === 'groups' ? (
              <CoordinatorGroupMultiSelect
                groups={courseGroups}
                selectedIds={selectedGroupIds}
                onChange={setSelectedGroupIds}
                disabled={!defenseForm.courseId}
                loading={courseGroupsLoading}
              />
            ) : null}
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
            <div className={COORDINATOR_DATE_TIME_ROW_CLASS}>
              <div className={COORDINATOR_DATE_FIELD_WRAPPER_CLASS}>
                <Input
                  label="Date"
                  type="date"
                  required
                  value={defenseForm.date}
                  onChange={(e) => setDefenseForm((f) => ({ ...f, date: e.target.value }))}
                  responsiveText
                  fullWidth
                />
              </div>
              <div className={COORDINATOR_TIME_FIELD_WRAPPER_CLASS}>
                <CoordinatorTimeRangeFields
                  required
                  startTime={defenseForm.startTime}
                  endTime={defenseForm.endTime}
                  onStartChange={(value) => setDefenseForm((f) => ({ ...f, startTime: value }))}
                  onEndChange={(value) => setDefenseForm((f) => ({ ...f, endTime: value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                fullWidth
                responsiveText
                label="Modality"
                value={defenseForm.modality}
                onChange={(e) =>
                  setDefenseForm((f) => ({ ...f, modality: e.target.value }))
                }
                options={[
                  { value: 'Online', label: 'Online' },
                  { value: 'In-Person', label: 'Face-to-Face' },
                  { value: 'Hybrid', label: 'Hybrid' },
                ]}
              />
              <Input
                label="Location"
                required
                value={defenseForm.location}
                onChange={(e) => setDefenseForm((f) => ({ ...f, location: e.target.value }))}
                responsiveText
                fullWidth
              />
            </div>
            <div>
              <label className={formLabelClassName}>Panelists</label>
              <div className="space-y-3 rounded-lg border border-neutral-200 p-3">
                <div className="relative">
                  <FiSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={panelistQuery}
                    onChange={(e) => setPanelistQuery(e.target.value)}
                    className="coordinator-panelist-search w-full rounded-sm border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-coordinator-rose/40"
                    placeholder="Search advisers or coordinators by name or email..."
                  />
                  {panelistSuggestions.length > 0 ? (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                      {panelistSuggestions.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => addPanelist(user)}
                          className="flex w-full items-center gap-3 border-b border-neutral-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-coordinator-rose/5"
                        >
                          <Avatar
                            src={user.avatar_url ?? undefined}
                            name={user.full_name || 'Unknown'}
                            size="sm"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-coordinator-ink">
                              {user.full_name || 'Unknown'}
                            </p>
                            <p className="truncate text-xs text-neutral-500">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {panelistSuggestions.length === 0 && panelistQuery.trim().length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-lg">
                      <p className="text-sm text-neutral-500">No advisers or coordinators found matching your search.</p>
                    </div>
                  ) : null}
                </div>
                {selectedPanelists.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPanelists.map((panelist) => (
                      <li
                        key={panelist.id}
                        className="flex items-center gap-3 rounded-lg border border-coordinator-rose/20 bg-coordinator-rose/5 px-3 py-2"
                      >
                        <Avatar
                          src={panelist.avatar_url ?? undefined}
                          name={panelist.full_name || 'Unknown'}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-coordinator-ink">
                            {panelist.full_name || 'Unknown'}
                          </p>
                          <p className="truncate text-xs text-neutral-500">{panelist.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePanelist(panelist.id)}
                          className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
                          aria-label={`Remove ${panelist.full_name || 'panelist'}`}
                        >
                          <FiX className="h-4 w-4" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Search and add advisers or coordinators from your institution to serve as panelists.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setScheduleKind(null);
                  resetDefenseScheduleMode();
                }}
              >
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Loading…'
                  : defenseScheduleMode === 'course'
                    ? 'Continue to Batches'
                    : 'Schedule Defense'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editEvent)}
        onClose={closeEditEvent}
        title="Edit institution event"
        description={
          <>
            Update schedule and details for <strong>{editEvent?.title}</strong>.
          </>
        }
        size={COORDINATOR_SCHEDULE_MODAL_SIZE}
      >
        <form onSubmit={handleSaveEditEvent} className={`space-y-4 ${COORDINATOR_SCHEDULE_FORM_CLASS}`}>
          {eventActionError ? (
            <p className="text-sm text-error-600 bg-error-50 rounded-lg px-3 py-2">{eventActionError}</p>
          ) : null}
          <Input
            label="Title"
            required
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Event title"
            responsiveText
            fullWidth
          />
          <div>
            <label className={formLabelClassName}>Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              className={formTextareaResponsiveClassName}
              rows={2}
            />
          </div>
          <div className={COORDINATOR_DATE_TIME_ROW_CLASS}>
            <div className={COORDINATOR_DATE_FIELD_WRAPPER_CLASS}>
              <Input
                label="Date"
                type="date"
                required
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                responsiveText
                fullWidth
              />
            </div>
            <div className={COORDINATOR_TIME_FIELD_WRAPPER_CLASS}>
              <CoordinatorTimeRangeFields
                required
                startTime={editForm.startTime}
                endTime={editForm.endTime}
                onStartChange={(value) => setEditForm((f) => ({ ...f, startTime: value }))}
                onEndChange={(value) => setEditForm((f) => ({ ...f, endTime: value }))}
              />
            </div>
          </div>
          <Select
            fullWidth
            responsiveText
            label="Modality"
            value={editForm.modality}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, modality: e.target.value as typeof f.modality }))
            }
            options={[
              { value: 'Online', label: 'Online' },
              { value: 'In-Person', label: 'Face-to-Face' },
              { value: 'Hybrid', label: 'Hybrid' },
            ]}
          />
          <Input
            label="Location"
            required
            value={editForm.location}
            onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
            responsiveText
            fullWidth
          />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeEditEvent} disabled={eventActionLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={eventActionLoading}
              disabled={eventActionLoading || !editEventFormDirty}
              leftIcon={!eventActionLoading ? <FiSave className="h-4 w-4" aria-hidden /> : undefined}
            >
              Save changes
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(cancelEventId)}
        onClose={() => {
          if (!eventActionLoading) setCancelEventId(null);
        }}
        title="Cancel event?"
        size="sm"
      >
        <p className="text-sm text-neutral-700">
          This event will be marked as cancelled. It will remain visible in the list with a
          cancelled status.
        </p>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCancelEventId(null)}
            disabled={eventActionLoading}
          >
            Keep event
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={() => void handleConfirmCancelEvent()}
            loading={eventActionLoading}
            disabled={eventActionLoading}
          >
            Cancel event
          </Button>
        </ModalFooter>
      </Modal>

      <UndoActionToastHost toast={eventUndoToast} onDismiss={dismissEventUndoToast} />
    </DashboardLayout>
  );
}
