'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';

import Button from '@/components/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import DefenseBatchMetadataForm from '@/components/coordinator/DefenseBatchMetadataForm';
import type { CoordinatorRubric, CourseGroup, InstitutionAdviser } from '@/lib/api/coordinator';
import type { DefenseBatchPlannerDraft } from '@/lib/coordinator/defenseBatchSession';
import {
  buildLaneTemplates,
  collectUnassignedGroupIds,
  createEmptyLanes,
  formatTimeRange,
  getGroupsById,
  moveGroupBetweenContainers,
  summarizeDivision,
  type BatchLane,
  type DivisionMethod,
} from '@/lib/coordinator/defenseBatchPlanner';

export type { DefenseBatchPlannerDraft } from '@/lib/coordinator/defenseBatchSession';

interface DefenseBatchPlannerProps {
  draft: DefenseBatchPlannerDraft;
  onDraftChange: (draft: DefenseBatchPlannerDraft) => void;
  rubrics: CoordinatorRubric[];
  panelistPool: InstitutionAdviser[];
  initialGroups: CourseGroup[];
  availableGroups: CourseGroup[];
  initialLaneAssignments?: BatchLane[];
  loadingAvailableGroups?: boolean;
  submitting?: boolean;
  error?: string | null;
  onBack: () => void;
  onSave: (lanes: BatchLane[]) => void | Promise<void>;
}

const DIVISION_OPTIONS: { value: DivisionMethod; label: string }[] = [
  { value: 'by_batches', label: 'By Number of Batches' },
  { value: 'by_duration', label: 'By Duration' },
  { value: 'manual', label: 'Manual' },
];

function GroupCard({
  group,
  onDragStart,
}: {
  group: CourseGroup;
  onDragStart: (groupId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(group.id)}
      className="cursor-grab rounded-md border-[1px] border-solid border-neutral-400 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md active:cursor-grabbing"
    >
      <p className="truncate text-sm font-medium text-coordinator-ink">{group.title}</p>
      <p className="truncate text-xs text-neutral-500">{group.project_code}</p>
    </div>
  );
}

function DropZone({
  title,
  subtitle,
  children,
  onDropGroup,
  emptyLabel,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onDropGroup: () => void;
  emptyLabel: string;
}) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDropGroup();
      }}
    >
      <Card padding="sm" shadow="soft" hoverShadow className="bg-white">
        <div className="mb-3">
          <p className="text-base font-semibold text-coordinator-ink">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p> : null}
        </div>
        <div className="min-h-[4.5rem] space-y-2">
          {children}
          {React.Children.count(children) === 0 ? (
            <p className="text-xs text-neutral-400">{emptyLabel}</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default function DefenseBatchPlanner({
  draft,
  onDraftChange,
  rubrics,
  panelistPool,
  initialGroups,
  availableGroups,
  initialLaneAssignments,
  loadingAvailableGroups = false,
  submitting = false,
  error = null,
  onBack,
  onSave,
}: DefenseBatchPlannerProps) {
  const [eventGroups, setEventGroups] = useState<CourseGroup[]>(initialGroups);
  const [divisionMethod, setDivisionMethod] = useState<DivisionMethod>('by_batches');
  const [batchCount, setBatchCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [lanes, setLanes] = useState<BatchLane[]>([]);
  const [unassignedIds, setUnassignedIds] = useState<string[]>(initialGroups.map((group) => group.id));
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [showAddGroupsModal, setShowAddGroupsModal] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedAddGroupIds, setSelectedAddGroupIds] = useState<string[]>([]);
  const initialLanesApplied = useRef(false);
  const lastEventWindowKey = useRef(`${draft.date}|${draft.startTime}|${draft.endTime}`);

  const groupMap = useMemo(() => getGroupsById(eventGroups), [eventGroups]);
  const eventWindowKey = `${draft.date}|${draft.startTime}|${draft.endTime}`;

  const laneTemplates = useMemo(
    () =>
      buildLaneTemplates({
        method: divisionMethod,
        startTime: draft.startTime,
        endTime: draft.endTime,
        batchCount,
        durationMinutes,
        groupCount: eventGroups.length,
      }),
    [divisionMethod, draft.startTime, draft.endTime, batchCount, durationMinutes, eventGroups.length],
  );

  const laneTemplateKey = useMemo(
    () => laneTemplates.map((lane) => `${lane.id}:${lane.startTime}:${lane.endTime}`).join('|'),
    [laneTemplates],
  );

  useEffect(() => {
    if (lastEventWindowKey.current !== eventWindowKey) {
      lastEventWindowKey.current = eventWindowKey;
      initialLanesApplied.current = false;
    }

    if (initialLaneAssignments?.length && !initialLanesApplied.current) {
      initialLanesApplied.current = true;
      setLanes(initialLaneAssignments);
      setUnassignedIds(collectUnassignedGroupIds(eventGroups, initialLaneAssignments));
      setBatchCount(Math.max(1, initialLaneAssignments.length));
      return;
    }

    setLanes(createEmptyLanes(laneTemplates));
    setUnassignedIds(eventGroups.map((group) => group.id));
    // Reset only when lane structure changes (division method/inputs), not when groups are added.
  }, [laneTemplateKey, laneTemplates, initialLaneAssignments, eventWindowKey, eventGroups]);

  const divisionSummary = useMemo(
    () =>
      summarizeDivision({
        method: divisionMethod,
        groupCount: eventGroups.length,
        startTime: draft.startTime,
        endTime: draft.endTime,
        batchCount,
        durationMinutes,
        laneCount: lanes.length,
      }),
    [
      divisionMethod,
      eventGroups.length,
      draft.startTime,
      draft.endTime,
      batchCount,
      durationMinutes,
      lanes.length,
    ],
  );

  const addableGroups = useMemo(() => {
    const inEvent = new Set(eventGroups.map((group) => group.id));
    const term = groupSearch.trim().toLowerCase();
    return availableGroups.filter((group) => {
      if (inEvent.has(group.id)) return false;
      if (!term) return true;
      return (
        group.title.toLowerCase().includes(term) ||
        group.project_code.toLowerCase().includes(term)
      );
    });
  }, [availableGroups, eventGroups, groupSearch]);

  const hasUnassigned = unassignedIds.length > 0;

  function switchDivisionMethod(method: DivisionMethod) {
    if (method === divisionMethod) return;
    setDivisionMethod(method);
  }

  function handleDrop(target: { type: 'unassigned' } | { type: 'lane'; laneId: string }) {
    if (!draggedGroupId) return;
    const next = moveGroupBetweenContainers({
      lanes,
      unassignedIds,
      groupId: draggedGroupId,
      target,
    });
    setLanes(next.lanes);
    setUnassignedIds(next.unassignedIds);
    setDraggedGroupId(null);
  }

  function handleAddSelectedGroups() {
    if (!selectedAddGroupIds.length) return;
    const selectedGroups = availableGroups.filter((group) => selectedAddGroupIds.includes(group.id));
    setEventGroups((prev) => [...prev, ...selectedGroups]);
    setUnassignedIds((prev) => [...prev, ...selectedAddGroupIds]);
    setSelectedAddGroupIds([]);
    setGroupSearch('');
    setShowAddGroupsModal(false);
  }

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-50 px-3 py-2 text-sm text-error-600">{error}</p> : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <DefenseBatchMetadataForm
          draft={draft}
          onDraftChange={onDraftChange}
          rubrics={rubrics}
          panelistPool={panelistPool}
          groupCount={eventGroups.length}
        />

        <Card padding="md" shadow="soft" hoverShadow={false} className="h-full space-y-4">
          <h2 className="text-lg font-semibold coordinator-heading">Batch Division</h2>
          <div
            className="inline-flex w-full rounded-md border-[1px] border-solid border-neutral-400 bg-neutral-50 p-1"
            role="group"
            aria-label="Division method"
          >
            {DIVISION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => switchDivisionMethod(option.value)}
                className={`flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                  divisionMethod === option.value
                    ? 'bg-coordinator-rose text-white shadow-sm'
                    : 'text-neutral-600 hover:text-coordinator-ink'
                }`}
                aria-pressed={divisionMethod === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {divisionMethod === 'by_batches' ? (
              <Input
                label="Number of Batches"
                type="number"
                min={1}
                value={String(batchCount)}
                onChange={(e) => setBatchCount(Math.max(1, Number(e.target.value) || 1))}
                responsiveText
                fullWidth
              />
            ) : null}
            {divisionMethod === 'by_duration' ? (
              <Input
                label="Minutes per Batch"
                type="number"
                min={1}
                value={String(durationMinutes)}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value) || 1))}
                responsiveText
                fullWidth
              />
            ) : null}
          </div>

          <p className="coordinator-text-muted text-sm">
            {divisionSummary.batchCount} batch{divisionSummary.batchCount === 1 ? '' : 'es'} ·{' '}
            {divisionSummary.durationPerBatchMinutes} min per batch ·{' '}
            {divisionSummary.groupsPerBatch} group{divisionSummary.groupsPerBatch === 1 ? '' : 's'} per batch
            {divisionSummary.remainderGroups > 0
              ? ` · ${divisionSummary.remainderGroups} remainder group${divisionSummary.remainderGroups === 1 ? '' : 's'} in a separate final batch`
              : ''}
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold coordinator-heading">Batch Assignments</h2>
        {lanes.map((lane) => (
          <DropZone
            key={lane.id}
            title={`Batch ${lane.batchNumber}`}
            subtitle={formatTimeRange(lane.startTime, lane.endTime)}
            onDropGroup={() => handleDrop({ type: 'lane', laneId: lane.id })}
            emptyLabel="Drag groups here"
          >
            {lane.groupIds.map((groupId) => {
              const group = groupMap.get(groupId);
              if (!group) return null;
              return <GroupCard key={groupId} group={group} onDragStart={setDraggedGroupId} />;
            })}
          </DropZone>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold coordinator-heading">Unassigned Groups</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<FiPlus className="h-4 w-4" aria-hidden />}
            onClick={() => setShowAddGroupsModal(true)}
          >
            Add Groups
          </Button>
        </div>
        <DropZone
          title="Assignment Pool"
          subtitle={`${unassignedIds.length} group${unassignedIds.length === 1 ? '' : 's'} waiting for assignment`}
          onDropGroup={() => handleDrop({ type: 'unassigned' })}
          emptyLabel="All groups are assigned to batches"
        >
          {unassignedIds.map((groupId) => {
            const group = groupMap.get(groupId);
            if (!group) return null;
            return <GroupCard key={groupId} group={group} onDragStart={setDraggedGroupId} />;
          })}
        </DropZone>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button
          type="button"
          disabled={submitting || hasUnassigned || lanes.length === 0}
          onClick={() => void onSave(lanes)}
        >
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <Modal
        isOpen={showAddGroupsModal}
        onClose={() => {
          setShowAddGroupsModal(false);
          setSelectedAddGroupIds([]);
          setGroupSearch('');
        }}
        title="Add Groups"
        description="Search and add groups from this course to the unassigned pool."
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="text"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              className="w-full rounded-md border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-coordinator-rose/40"
              placeholder="Search by title or project code..."
            />
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border-[1px] border-solid border-neutral-400 p-2">
            {loadingAvailableGroups ? (
              <p className="px-2 py-1.5 text-sm text-neutral-500">Loading groups...</p>
            ) : null}
            {!loadingAvailableGroups && addableGroups.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-neutral-500">No additional groups found for this course.</p>
            ) : null}
            {addableGroups.map((group) => {
              const checked = selectedAddGroupIds.includes(group.id);
              return (
                <label
                  key={group.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-coordinator-rose/5"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-coordinator-rose"
                    checked={checked}
                    onChange={() => {
                      setSelectedAddGroupIds((prev) =>
                        checked ? prev.filter((id) => id !== group.id) : [...prev, group.id],
                      );
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-coordinator-ink">{group.title}</span>
                    <span className="block truncate text-xs text-neutral-500">{group.project_code}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddGroupsModal(false);
                setSelectedAddGroupIds([]);
                setGroupSearch('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedAddGroupIds.length}
              onClick={handleAddSelectedGroups}
            >
              Add Selected
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
