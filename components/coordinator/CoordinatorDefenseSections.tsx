'use client';

import React, { useState, useEffect } from 'react';
import CoordinatorScheduleCard from '@/components/coordinator/CoordinatorScheduleCard';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Dropdown from '@/components/ui/Dropdown';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  COORDINATOR_DATE_FIELD_WRAPPER_CLASS,
  COORDINATOR_DATE_TIME_ROW_CLASS,
  COORDINATOR_TIME_FIELD_WRAPPER_CLASS,
  COORDINATOR_SCHEDULE_FORM_CLASS,
  COORDINATOR_SCHEDULE_MODAL_SIZE,
  CoordinatorTimeRangeFields,
} from '@/components/coordinator/CoordinatorTimeRangeFields';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import { coordinatorDefenseUndoToastMessage } from '@/lib/meetings/undoStatusMessages';
import {
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiMove,
  FiMoreVertical,
  FiSave,
} from 'react-icons/fi';
import { formatStatusLabel } from '@/lib/utils/formatStatus';
import {
  getAllDefenses,
  getPendingDefenses,
  verifyDefense,
  rejectDefense,
  cancelCoordinatorDefense,
  completeCoordinatorDefense,
  revertCoordinatorDefense,
  type Defense,
} from '@/lib/api/coordinator';
import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import { isOnlineModality } from '@/lib/meetings/jitsi';

function formatDateTime(iso?: string | null) {
  if (!iso) return '-';
  const localWallClock = new Date(iso.replace(/Z$/i, ''));
  if (Number.isNaN(localWallClock.getTime())) return '-';
  return localWallClock.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatMinutes(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

type DefenseModality = 'Online' | 'In-Person' | 'Hybrid';

const DEFENSE_MODALITY_OPTIONS: { value: DefenseModality; label: string }[] = [
  { value: 'Online', label: 'Online' },
  { value: 'In-Person', label: 'Face-to-Face' },
  { value: 'Hybrid', label: 'Hybrid' },
];

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function defenseScheduleToFormState(defense: Defense) {
  const start = new Date(String(defense.start_time || '').replace(/Z$/i, ''));
  const end = new Date(String(defense.end_time || defense.start_time || '').replace(/Z$/i, ''));

  const modality = (defense.modality || 'Online') as DefenseModality;
  const normalizedModality = DEFENSE_MODALITY_OPTIONS.some((o) => o.value === modality)
    ? modality
    : 'Online';

  return {
    date: Number.isNaN(start.getTime())
      ? ''
      : `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
    startTime: Number.isNaN(start.getTime()) ? '' : `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
    endTime: Number.isNaN(end.getTime()) ? '' : `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
    location: (defense.venue || defense.location || '').trim(),
    modality: normalizedModality,
  };
}

function normalizeDefenseTimes(defense: Defense): Defense {
  const fallbackStart = (defense as Defense & { scheduled_at?: string }).scheduled_at || '';
  return {
    ...defense,
    start_time: defense.start_time || fallbackStart,
    end_time: defense.end_time || null,
  };
}

type DefenseVariant = 'success' | 'warning' | 'error' | 'default' | 'primary';

function statusBadge(status: string): { label: string; variant: DefenseVariant } {
  switch (status) {
    case 'pending': return { label: formatStatusLabel('pending'), variant: 'warning' };
    case 'approved': return { label: formatStatusLabel('approved'), variant: 'success' };
    case 'moved': return { label: formatStatusLabel('moved'), variant: 'primary' };
    case 'rejected': return { label: formatStatusLabel('rejected'), variant: 'error' };
    case 'scheduled': return { label: formatStatusLabel('scheduled'), variant: 'default' };
    case 'completed': return { label: formatStatusLabel('completed'), variant: 'success' };
    case 'cancelled': return { label: formatStatusLabel('cancelled'), variant: 'error' };
    default: return { label: formatStatusLabel(status), variant: 'default' };
  }
}

export interface CoordinatorDefenseSectionsProps {
  section: 'pending' | 'approved';
  onDataChange?: () => void;
}

export default function CoordinatorDefenseSections({ section, onDataChange }: CoordinatorDefenseSectionsProps) {
  const [pendingDefenses, setPendingDefenses] = useState<Defense[]>([]);
  const [allDefenses, setAllDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDefense, setSelectedDefense] = useState<Defense | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'move' | 'edit' | 'reject' | null>(null);
  const [venue, setVenue] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editModality, setEditModality] = useState<DefenseModality>('Online');
  const [moveDate, setMoveDate] = useState('');
  const [moveStartTime, setMoveStartTime] = useState('');
  const [moveEndTime, setMoveEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflictPrompt, setConflictPrompt] = useState<{
    defenseId: string;
    venue?: string;
    location?: string;
    modality?: string;
    verifiedSchedule?: string;
    verifiedEndTime?: string;
    notes?: string;
    max_overlap_minutes?: number;
    candidate_total_minutes?: number;
    effective_minutes?: number;
    conflicts: Array<{ domain: string; defense_id: string; project_id: string; start_time: string; end_time: string | null }>;
  } | null>(null);
  const [conflictAction, setConflictAction] = useState<'hold' | 'confirm' | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'status'>('time');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Defense | null>(null);
  const [defenseActionLoading, setDefenseActionLoading] = useState(false);
  const [defenseActionError, setDefenseActionError] = useState<string | null>(null);
  const { toast: defenseUndoToast, showUndoToast: showDefenseUndoToast, dismissUndoToast: dismissDefenseUndoToast } =
    useUndoActionToast();

  const ACTIVE_DEFENSE_ACTION_STATUSES = new Set(['scheduled', 'moved', 'approved']);

  async function loadDefenses() {
    setLoading(true);
    const [pendingRes, allRes] = await Promise.all([getPendingDefenses(), getAllDefenses()]);
    if (pendingRes.data) setPendingDefenses(pendingRes.data.map(normalizeDefenseTimes));
    if (allRes.data) setAllDefenses(allRes.data.map(normalizeDefenseTimes));
    setLoading(false);
    onDataChange?.();
  }

  useEffect(() => {
    loadDefenses();
  }, []);

  function openModal(defense: Defense, type: 'approve' | 'move' | 'edit' | 'reject') {
    setSelectedDefense(defense);
    setModalType(type);
    setVenue(defense.venue || defense.location || '');
    setNotes('');

    if (type === 'edit') {
      const form = defenseScheduleToFormState(defense);
      setMoveDate(form.date);
      setMoveStartTime(form.startTime);
      setMoveEndTime(form.endTime);
      setEditLocation(form.location);
      setEditModality(form.modality);
      return;
    }

    setEditLocation('');
    setEditModality('Online');
    setMoveDate('');
    setMoveStartTime('');
    setMoveEndTime('');
  }

  function closeModal() {
    setSelectedDefense(null);
    setModalType(null);
    setVenue('');
    setEditLocation('');
    setEditModality('Online');
    setMoveDate('');
    setMoveStartTime('');
    setMoveEndTime('');
    setNotes('');
  }

  async function handleApprove() {
    if (!selectedDefense) return;
    setSubmitting(true);
    const res = await verifyDefense(selectedDefense.id, {
      venue: venue || undefined,
      notes: notes || undefined,
    });
    if (res.data && 'conflict' in res.data && res.data.conflict) {
      setConflictPrompt({
        defenseId: selectedDefense.id,
        venue: venue || undefined,
        notes: notes || undefined,
        max_overlap_minutes: res.data.max_overlap_minutes,
        candidate_total_minutes: res.data.candidate_total_minutes,
        effective_minutes: res.data.effective_minutes,
        conflicts: res.data.conflicts,
      });
    } else if (!res.error) {
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }

  async function handleMove() {
    if (!selectedDefense || !moveDate || !moveStartTime || !moveEndTime) return;
    const verifiedSchedule = `${moveDate}T${moveStartTime}:00`;
    const verifiedEndTime = `${moveDate}T${moveEndTime}:00`;
    setSubmitting(true);
    const res = await verifyDefense(selectedDefense.id, {
      venue: venue || undefined,
      verifiedSchedule,
      verifiedEndTime,
      notes: notes || undefined,
    });
    if (res.data && 'conflict' in res.data && res.data.conflict) {
      setConflictPrompt({
        defenseId: selectedDefense.id,
        venue: venue || undefined,
        verifiedSchedule,
        verifiedEndTime,
        notes: notes || undefined,
        max_overlap_minutes: res.data.max_overlap_minutes,
        candidate_total_minutes: res.data.candidate_total_minutes,
        effective_minutes: res.data.effective_minutes,
        conflicts: res.data.conflicts,
      });
    } else if (!res.error) {
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }

  async function handleEdit() {
    if (!selectedDefense || !moveDate || !moveStartTime || !moveEndTime) return;
    const verifiedSchedule = `${moveDate}T${moveStartTime}:00`;
    const verifiedEndTime = `${moveDate}T${moveEndTime}:00`;
    const location = editLocation.trim();
    setSubmitting(true);
    const res = await verifyDefense(selectedDefense.id, {
      location: location || undefined,
      venue: location || undefined,
      modality: editModality,
      verifiedSchedule,
      verifiedEndTime,
      notes: notes || undefined,
    });
    if (res.data && 'conflict' in res.data && res.data.conflict) {
      setConflictPrompt({
        defenseId: selectedDefense.id,
        location: location || undefined,
        venue: location || undefined,
        modality: editModality,
        verifiedSchedule,
        verifiedEndTime,
        notes: notes || undefined,
        max_overlap_minutes: res.data.max_overlap_minutes,
        candidate_total_minutes: res.data.candidate_total_minutes,
        effective_minutes: res.data.effective_minutes,
        conflicts: res.data.conflicts,
      });
    } else if (!res.error) {
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }

  async function handleConflictResolution(action: 'hold' | 'confirm') {
    if (!conflictPrompt) return;
    setConflictAction(action);
    setSubmitting(true);
    const res = await verifyDefense(conflictPrompt.defenseId, {
      venue: conflictPrompt.venue,
      location: conflictPrompt.location,
      modality: conflictPrompt.modality,
      verifiedSchedule: conflictPrompt.verifiedSchedule,
      verifiedEndTime: conflictPrompt.verifiedEndTime,
      notes: conflictPrompt.notes,
      forceApprove: action === 'confirm',
      holdDefense: action === 'hold',
    });
    if (!res.error) {
      setConflictPrompt(null);
      setConflictAction(null);
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }

  async function handleReject() {
    if (!selectedDefense) return;
    setSubmitting(true);
    const res = await rejectDefense(selectedDefense.id, notes || undefined);
    if (!res.error) {
      closeModal();
      await loadDefenses();
    }
    setSubmitting(false);
  }

  async function handleRevertDefense(defenseId: string, previousStatus: string) {
    const res = await revertCoordinatorDefense(defenseId, previousStatus);
    if (res.error) {
      setDefenseActionError(res.error);
      return;
    }
    await loadDefenses();
  }

  function showDefenseStatusUndo(
    defenseId: string,
    previousStatus: string,
    action: 'complete' | 'cancel',
  ) {
    showDefenseUndoToast({
      message: coordinatorDefenseUndoToastMessage(action),
      onUndo: () => handleRevertDefense(defenseId, previousStatus),
    });
  }

  async function handleConfirmCancelDefense() {
    if (!cancelTarget) return;
    const defenseId = cancelTarget.id;
    const previousStatus = cancelTarget.status;
    setDefenseActionLoading(true);
    setDefenseActionError(null);
    dismissDefenseUndoToast();
    try {
      const res = await cancelCoordinatorDefense(defenseId);
      if (res.error) {
        setDefenseActionError(res.error);
        return;
      }
      setCancelTarget(null);
      await loadDefenses();
      showDefenseStatusUndo(defenseId, previousStatus, 'cancel');
    } catch {
      setDefenseActionError('Failed to cancel defense.');
    } finally {
      setDefenseActionLoading(false);
    }
  }

  async function handleCompleteDefense(defense: Defense) {
    const previousStatus = defense.status;
    setDefenseActionLoading(true);
    setDefenseActionError(null);
    dismissDefenseUndoToast();
    try {
      const res = await completeCoordinatorDefense(defense.id);
      if (res.error) {
        setDefenseActionError(res.error);
        return;
      }
      await loadDefenses();
      showDefenseStatusUndo(defense.id, previousStatus, 'complete');
    } catch {
      setDefenseActionError('Failed to mark defense as complete.');
    } finally {
      setDefenseActionLoading(false);
    }
  }

  const displayedDefenses = (() => {
    const list = section === 'pending'
      ? pendingDefenses
      : allDefenses.filter((d) => d.status !== 'pending');
    const statusOrder: Record<string, number> = {
      pending: 0, moved: 1, approved: 2, rejected: 3, scheduled: 4, completed: 5, cancelled: 6,
    };
    return [...list].sort((a, b) => {
      if (sortBy === 'status') {
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      }
      return new Date((a.start_time || '').replace(/Z$/i, '')).getTime()
        - new Date((b.start_time || '').replace(/Z$/i, '')).getTime();
    });
  })();

  const uniqueConflictSchedules = conflictPrompt
    ? Array.from(new Map(conflictPrompt.conflicts.map((item) => [item.defense_id, item])).values())
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 coordinator-spinner" />
      </div>
    );
  }

  if (displayedDefenses.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-neutral-500">
          {section === 'pending' ? 'No pending defenses.' : 'No approved defenses yet.'}
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">Sort by:</span>
          <button
            type="button"
            onClick={() => setSortBy('time')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'time' ? 'bg-coordinator-navy/10 text-coordinator-ink' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Time
          </button>
          <button
            type="button"
            onClick={() => setSortBy('status')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'status' ? 'bg-coordinator-navy/10 text-coordinator-ink' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Status
          </button>
        </div>

        {displayedDefenses.map((defense) => {
          const badge = statusBadge(defense.status);
          const isExpanded = expandedId === defense.id;
          const pendingMenu =
            defense.status === 'pending' ? (
              <Dropdown
                align="right"
                trigger={
                  <button
                    type="button"
                    className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                    aria-label="Defense options"
                  >
                    <FiMoreVertical className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                  </button>
                }
                items={[
                  {
                    label: 'Approve',
                    value: 'approve',
                    icon: <FiCheck className="h-4 w-4" aria-hidden />,
                    onClick: () => openModal(defense, 'approve'),
                    disabled: submitting,
                  },
                  {
                    label: 'Move',
                    value: 'move',
                    icon: <FiMove className="h-4 w-4" aria-hidden />,
                    onClick: () => openModal(defense, 'move'),
                    disabled: submitting,
                  },
                  {
                    label: 'Reject',
                    value: 'reject',
                    icon: <FiX className="h-4 w-4" aria-hidden />,
                    danger: true,
                    onClick: () => openModal(defense, 'reject'),
                    disabled: submitting,
                  },
                ]}
              />
            ) : null;
          const approvedMenu =
            section === 'approved' && ACTIVE_DEFENSE_ACTION_STATUSES.has(defense.status) ? (
              <Dropdown
                align="right"
                trigger={
                  <button
                    type="button"
                    className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                    aria-label="Defense options"
                  >
                    <FiMoreVertical className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                  </button>
                }
                items={[
                  {
                    label: 'Edit',
                    value: 'edit',
                    icon: <FiEdit2 className="h-4 w-4" aria-hidden />,
                    onClick: () => openModal(defense, 'edit'),
                    disabled: defenseActionLoading,
                  },
                  {
                    label: 'Mark as complete',
                    value: 'complete',
                    icon: <FiCheck className="h-4 w-4" aria-hidden />,
                    onClick: () => void handleCompleteDefense(defense),
                    disabled: defenseActionLoading,
                  },
                  {
                    label: 'Cancel',
                    value: 'cancel',
                    icon: <FiX className="h-4 w-4" aria-hidden />,
                    danger: true,
                    onClick: () => setCancelTarget(defense),
                    disabled: defenseActionLoading,
                  },
                ]}
              />
            ) : null;

          return (
            <CoordinatorScheduleCard
              key={defense.id}
              title={defense.project_title}
              startTime={defense.start_time}
              endTime={defense.end_time}
              modality={defense.modality}
              proposedBy={defense.created_by_name}
              defenseType={defense.defense_type}
              status={defense.status}
              statusLabel={badge.label}
              statusVariant={badge.variant}
              menu={pendingMenu ?? approvedMenu}
              onToggleExpand={() => setExpandedId(isExpanded ? null : defense.id)}
              trailing={
                isExpanded ? (
                  <FiChevronUp className="text-neutral-400" aria-hidden />
                ) : (
                  <FiChevronDown className="text-neutral-400" aria-hidden />
                )
              }
              expanded={isExpanded}
              expandContent={
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div>
                    <span className="font-medium text-neutral-500">Project Code:</span>{' '}
                    {defense.project_code}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-500">Location:</span>{' '}
                    {defense.venue || defense.location || 'Not set'}
                  </div>
                  {defense.adviser_name ? (
                    <div>
                      <span className="font-medium text-neutral-500">Adviser:</span>{' '}
                      {defense.adviser_name}
                    </div>
                  ) : null}
                  {isOnlineModality(defense.modality) ? (
                    <div className="md:col-span-2">
                      <JoinMeetingButton
                        meeting_url={defense.meeting_url}
                        meeting_room={defense.meeting_room}
                        label="Join Defense"
                      />
                    </div>
                  ) : null}
                </div>
              }
            />
          );
        })}
        {defenseActionError ? (
          <p className="text-center text-sm text-archivumRed">{defenseActionError}</p>
        ) : null}
      </div>

      <Modal isOpen={modalType === 'approve' && !!selectedDefense} onClose={closeModal} title="Approve Defense Schedule">
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Approve the defense for <strong>{selectedDefense?.project_title}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Location (optional)</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleApprove} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'move' && !!selectedDefense} onClose={closeModal} title="Move Defense Schedule">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">New Date</label>
              <input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Start</label>
              <input type="time" value={moveStartTime} onChange={(e) => setMoveStartTime(e.target.value)} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">End</label>
              <input type="time" value={moveEndTime} onChange={(e) => setMoveEndTime(e.target.value)} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleMove} disabled={submitting || !moveDate || !moveStartTime || !moveEndTime}>
              {submitting ? 'Confirming...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'edit' && !!selectedDefense}
        onClose={closeModal}
        title="Edit Defense"
        description={
          <>
            Update schedule and details for <strong>{selectedDefense?.project_title}</strong>.
          </>
        }
        size={COORDINATOR_SCHEDULE_MODAL_SIZE}
      >
        <form
          className={`space-y-4 ${COORDINATOR_SCHEDULE_FORM_CLASS}`}
          onSubmit={(e) => {
            e.preventDefault();
            void handleEdit();
          }}
        >
          <div className={COORDINATOR_DATE_TIME_ROW_CLASS}>
            <div className={COORDINATOR_DATE_FIELD_WRAPPER_CLASS}>
              <Input
                label="Date"
                type="date"
                required
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                responsiveText
                fullWidth
              />
            </div>
            <div className={COORDINATOR_TIME_FIELD_WRAPPER_CLASS}>
              <CoordinatorTimeRangeFields
                required
                startTime={moveStartTime}
                endTime={moveEndTime}
                onStartChange={setMoveStartTime}
                onEndChange={setMoveEndTime}
              />
            </div>
          </div>
          <Select
            fullWidth
            responsiveText
            label="Modality"
            value={editModality}
            onChange={(e) => setEditModality(e.target.value as DefenseModality)}
            options={DEFENSE_MODALITY_OPTIONS}
          />
          <Input
            label="Location"
            required
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            responsiveText
            fullWidth
          />
          <ModalFooter className="mt-4">
            <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting || !moveDate || !moveStartTime || !moveEndTime || !editLocation.trim()}
              leftIcon={!submitting ? <FiSave className="h-4 w-4" aria-hidden /> : undefined}
            >
              Save changes
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'reject' && !!selectedDefense} onClose={closeModal} title="Reject Defense Schedule">
        <div className="p-6 space-y-4">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" placeholder="Reason..." />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="error" onClick={handleReject} disabled={submitting}>Reject</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!conflictPrompt} onClose={() => { setConflictPrompt(null); setConflictAction(null); }} title="Schedule Conflict Found">
        <div className="p-6 space-y-4">
          <ul className="space-y-1 text-sm text-neutral-700">
            {uniqueConflictSchedules.map((c) => (
              <li key={c.defense_id}>{formatDateTime(c.start_time)} - {formatDateTime(c.end_time || c.start_time)}</li>
            ))}
          </ul>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConflictPrompt(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleConflictResolution('hold')} disabled={submitting}>Hold</Button>
            <Button variant="error" onClick={() => handleConflictResolution('confirm')} disabled={submitting}>Confirm</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => {
          if (!defenseActionLoading) setCancelTarget(null);
        }}
        title="Cancel defense?"
        size="sm"
      >
        <p className="text-sm text-neutral-700">
          This defense will be marked as cancelled. It will remain visible in the list with a
          cancelled status.
        </p>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCancelTarget(null)}
            disabled={defenseActionLoading}
          >
            Keep defense
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={() => void handleConfirmCancelDefense()}
            loading={defenseActionLoading}
            disabled={defenseActionLoading}
          >
            Cancel defense
          </Button>
        </ModalFooter>
      </Modal>

      <UndoActionToastHost toast={defenseUndoToast} onDismiss={dismissDefenseUndoToast} />
    </>
  );
}
