'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Modal from '@/components/ui/Modal';
import {
  FiCheck,
  FiX,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiMonitor,
  FiMove,
  FiTrash2,
} from 'react-icons/fi';
import { formatStatusLabel } from '@/lib/utils/formatStatus';
import {
  getAllDefenses,
  getPendingDefenses,
  verifyDefense,
  rejectDefense,
  deleteDefense,
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
  const [deleteTarget, setDeleteTarget] = useState<Defense | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function openModal(defense: Defense, type: 'approve' | 'move' | 'reject') {
    setSelectedDefense(defense);
    setModalType(type);
    setVenue(defense.venue || defense.location || '');
    setMoveDate('');
    setMoveStartTime('');
    setMoveEndTime('');
    setNotes('');
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

  async function handleConflictResolution(action: 'hold' | 'confirm') {
    if (!conflictPrompt) return;
    setConflictAction(action);
    setSubmitting(true);
    const res = await verifyDefense(conflictPrompt.defenseId, {
      venue: conflictPrompt.venue,
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteDefense(deleteTarget.id);
    if (!res.error) {
      setDeleteTarget(null);
      await loadDefenses();
    }
    setDeleting(false);
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
          return (
            <Card key={defense.id} padding="md">
              <div
                className="flex flex-col lg:flex-row lg:items-center gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : defense.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-coordinator-ink truncate">{defense.project_title}</h3>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <Badge variant="default">{defense.defense_type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                    <span className="flex items-center gap-1">
                      <FiClock className="text-neutral-400" />
                      {`${formatDateTime(defense.start_time)}${defense.end_time ? ` - ${formatDateTime(defense.end_time)}` : ''}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMonitor className="text-neutral-400" />
                      {defense.modality || 'Online'}
                    </span>
                    {defense.created_by_name && (
                      <span className="text-neutral-500">Proposed by {defense.created_by_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {defense.status === 'pending' && (
                    <>
                      <Button variant="primary" onClick={() => openModal(defense, 'approve')}>
                        <FiCheck className="mr-1" /> Approve
                      </Button>
                      <Button variant="outline" onClick={() => openModal(defense, 'move')}>
                        <FiMove className="mr-1" /> Move
                      </Button>
                      <Button variant="error" onClick={() => openModal(defense, 'reject')}>
                        <FiX className="mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {defense.status !== 'pending' && section === 'approved' && (
                    <>
                      <Button variant="outline" onClick={() => openModal(defense, 'move')}>
                        <FiMove className="mr-1" /> Reschedule
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(defense)}
                        className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg"
                        title="Delete defense"
                      >
                        <FiTrash2 />
                      </button>
                    </>
                  )}
                  {isExpanded ? <FiChevronUp className="text-neutral-400" /> : <FiChevronDown className="text-neutral-400" />}
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium text-neutral-500">Project Code:</span> {defense.project_code}</div>
                  <div><span className="font-medium text-neutral-500">Location:</span> {defense.venue || defense.location || 'Not set'}</div>
                  {defense.adviser_name && (
                    <div><span className="font-medium text-neutral-500">Adviser:</span> {defense.adviser_name}</div>
                  )}
                  {isOnlineModality(defense.modality) && (
                    <div className="md:col-span-2">
                      <JoinMeetingButton
                        meeting_url={defense.meeting_url}
                        meeting_room={defense.meeting_room}
                        label="Join Defense"
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
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

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Defense">
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">Delete defense for <strong>{deleteTarget?.project_title}</strong>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="error" onClick={handleDelete} disabled={deleting}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
