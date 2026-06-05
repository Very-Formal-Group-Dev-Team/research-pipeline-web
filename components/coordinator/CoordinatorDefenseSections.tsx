'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CoordinatorScheduleCard from '@/components/coordinator/CoordinatorScheduleCard';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Dropdown from '@/components/ui/Dropdown';
import Modal, { ModalFooter } from '@/components/ui/Modal';
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
} from 'react-icons/fi';
import { toast } from 'sonner';
import { sortDefenses, type DefenseSortBy } from '@/lib/defenses/sort';
import { formatStatusLabel } from '@/lib/utils/formatStatus';
import {
  getAllDefenses,
  getPendingDefenses,
  getCourseGroups,
  getCourses,
  verifyDefense,
  rejectDefense,
  cancelCoordinatorDefense,
  completeCoordinatorDefense,
  revertCoordinatorDefense,
  type Defense,
} from '@/lib/api/coordinator';
import {
  buildDefenseBatchSessionFromDefenses,
  findRelatedDefenses,
} from '@/lib/coordinator/defenseBatchEvent';
import { saveDefenseBatchSession } from '@/lib/coordinator/defenseBatchSession';
import DefenseCardExpandContent from '@/components/defenses/DefenseCardExpandContent';
import DefenseSortControls from '@/components/defenses/DefenseSortControls';

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
  const router = useRouter();
  const [pendingDefenses, setPendingDefenses] = useState<Defense[]>([]);
  const [allDefenses, setAllDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDefense, setSelectedDefense] = useState<Defense | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'move' | 'reject' | null>(null);
  const [venue, setVenue] = useState('');
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
  const [sortBy, setSortBy] = useState<DefenseSortBy>('time');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Defense | null>(null);
  const [defenseActionLoading, setDefenseActionLoading] = useState(false);
  const [defenseActionError, setDefenseActionError] = useState<string | null>(null);
  const { toast: defenseUndoToast, showUndoToast: showDefenseUndoToast, dismissUndoToast: dismissDefenseUndoToast } =
    useUndoActionToast();

  const ACTIVE_DEFENSE_ACTION_STATUSES = new Set(['scheduled', 'moved', 'approved']);

  const loadDefenses = useCallback(async (syncParent = false) => {
    setLoading(true);
    const [pendingRes, allRes] = await Promise.all([getPendingDefenses(), getAllDefenses()]);
    if (pendingRes.data) setPendingDefenses(pendingRes.data.map(normalizeDefenseTimes));
    if (allRes.data) setAllDefenses(allRes.data.map(normalizeDefenseTimes));
    setLoading(false);
    if (syncParent) {
      onDataChange?.();
    }
  }, [onDataChange]);

  useEffect(() => {
    void loadDefenses();
  }, [loadDefenses]);

  function openModal(defense: Defense, type: 'approve' | 'move' | 'reject') {
    setSelectedDefense(defense);
    setModalType(type);
    setVenue(defense.venue || defense.location || '');
    setNotes('');
    setMoveDate('');
    setMoveStartTime('');
    setMoveEndTime('');
  }

  function closeModal() {
    setSelectedDefense(null);
    setModalType(null);
    setVenue('');
    setMoveDate('');
    setMoveStartTime('');
    setMoveEndTime('');
    setNotes('');
  }

  async function handleEditDefense(defense: Defense) {
    if (!defense.course_id) {
      toast.error('This defense cannot be edited in the batch planner.');
      return;
    }

    setDefenseActionLoading(true);
    setDefenseActionError(null);

    try {
      const relatedDefenses = findRelatedDefenses(defense, allDefenses);
      const [coursesRes, groupsRes] = await Promise.all([
        getCourses(),
        getCourseGroups(defense.course_id),
      ]);

      if (coursesRes.error) {
        setDefenseActionError(coursesRes.error);
        return;
      }

      if (groupsRes.error) {
        setDefenseActionError(groupsRes.error);
        return;
      }

      const session = buildDefenseBatchSessionFromDefenses({
        anchor: defense,
        relatedDefenses,
        courses: coursesRes.data ?? [],
        courseGroups: groupsRes.data ?? [],
      });

      if (!session) {
        setDefenseActionError('Unable to open batch planner for this defense.');
        return;
      }

      saveDefenseBatchSession(session);
      router.push('/coordinator/events/edit');
    } catch {
      setDefenseActionError('Failed to open batch planner.');
    } finally {
      setDefenseActionLoading(false);
    }
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
      await loadDefenses(true);
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
      await loadDefenses(true);
    }
    setSubmitting(false);
  }

  async function handleConflictResolution(action: 'hold' | 'confirm') {
    if (!conflictPrompt) return;
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
      closeModal();
      await loadDefenses(true);
    }
    setSubmitting(false);
  }

  async function handleReject() {
    if (!selectedDefense) return;
    setSubmitting(true);
    const res = await rejectDefense(selectedDefense.id, notes || undefined);
    if (!res.error) {
      closeModal();
      await loadDefenses(true);
    }
    setSubmitting(false);
  }

  async function handleRevertDefense(defenseId: string, previousStatus: string) {
    const res = await revertCoordinatorDefense(defenseId, previousStatus);
    if (res.error) {
      setDefenseActionError(res.error);
      return;
    }
    await loadDefenses(true);
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
      await loadDefenses(true);
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
      await loadDefenses(true);
      showDefenseStatusUndo(defense.id, previousStatus, 'complete');
    } catch {
      setDefenseActionError('Failed to mark defense as complete.');
    } finally {
      setDefenseActionLoading(false);
    }
  }

  const displayedDefenses = useMemo(() => {
    const list =
      section === 'pending'
        ? pendingDefenses
        : allDefenses.filter((d) => d.status !== 'pending');
    return sortDefenses(list, sortBy);
  }, [section, pendingDefenses, allDefenses, sortBy]);

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
        <DefenseSortControls sortBy={sortBy} onSortByChange={setSortBy} tone="coordinator" />

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
                    onClick: () => void handleEditDefense(defense),
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
              expandContent={<DefenseCardExpandContent defense={defense} />}
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

      <Modal isOpen={modalType === 'reject' && !!selectedDefense} onClose={closeModal} title="Reject Defense Schedule">
        <div className="p-6 space-y-4">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" placeholder="Reason..." />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="error" onClick={handleReject} disabled={submitting}>Reject</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!conflictPrompt} onClose={() => { setConflictPrompt(null); }} title="Schedule Conflict Found">
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
