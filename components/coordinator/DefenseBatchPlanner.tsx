'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiPlus, FiSearch } from 'react-icons/fi';

import Button from '@/components/Button';
import Card, { CARD_PADDING_CLASS, CARD_HEADER_SECTION_CLASS } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { formLabelClassName } from '@/lib/utils/formControls';
import DefenseBatchMetadataForm from '@/components/coordinator/DefenseBatchMetadataForm';
import type { CoordinatorRubric, CourseGroup, InstitutionAdviser } from '@/lib/api/coordinator';
import type { DefenseBatchPlannerDraft } from '@/lib/coordinator/defenseBatchSession';
import {
  buildLaneTemplates,
  collectUnassignedGroupIds,
  createEmptyLanes,
  formatTimeRange,
  getGroupsById,
  getTimeframeMinutes,
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

function clampDivisionValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(value) || min));
}

function DivisionSliderField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const clamped = clampDivisionValue(value, min, max);

  return (
    <div className="space-y-2">
      <label className={formLabelClassName}>{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={clamped}
          onChange={(event) => onChange(clampDivisionValue(Number(event.target.value), min, max))}
          className="h-2 min-w-0 flex-1 cursor-pointer accent-coordinator-rose"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={clamped}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={clamped}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isNaN(next)) return;
            onChange(clampDivisionValue(next, min, max));
          }}
          className="w-[4.5rem] shrink-0 rounded-sm border border-neutral-300 px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-coordinator-rose/40"
          aria-label={`${label} manual input`}
        />
      </div>
    </div>
  );
}

function GroupCard({
  group,
  onDragStart,
  onDragEnd,
  onDropTarget,
  className = '',
}: {
  group: CourseGroup;
  onDragStart: (groupId: string) => void;
  onDragEnd?: () => void;
  onDropTarget?: () => void;
  className?: string;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', group.id);
        onDragStart(group.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDropTarget?.();
      }}
      className={`cursor-grab rounded-md border-[1px] border-solid border-neutral-400 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${className}`.trim()}
    >
      <p className="truncate text-sm font-medium text-coordinator-ink">{group.title}</p>
      <p className="truncate text-xs text-neutral-500">{group.project_code}</p>
    </div>
  );
}

const UNASSIGNED_CARD_CLASS = 'w-full min-w-0';

function BatchAccordionItem({
  batchNumber,
  timeRange,
  isOpen,
  onToggle,
  children,
  onDropGroup,
  emptyLabel,
}: {
  batchNumber: number;
  timeRange: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  onDropGroup: () => void;
  emptyLabel: string;
}) {
  const isEmpty = React.Children.count(children) === 0;

  return (
    <div className="overflow-hidden rounded-md border border-neutral-400 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-coordinator-ink">Batch {batchNumber}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{timeRange}</p>
        </div>
        <FiChevronDown
          className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div
          className="min-h-[4.5rem] border-t border-neutral-300 p-3"
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onDropGroup();
          }}
        >
          <div className="space-y-2">
            {children}
            {isEmpty ? <p className="text-xs text-neutral-400">{emptyLabel}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KanbanColumn({
  batchNumber,
  timeRange,
  children,
  onDropGroup,
  emptyLabel,
}: {
  batchNumber: number;
  timeRange: string;
  children: React.ReactNode;
  onDropGroup: () => void;
  emptyLabel: string;
}) {
  const isEmpty = React.Children.count(children) === 0;

  return (
    <div
      className="flex min-h-[14rem] w-full min-w-0 flex-col overflow-hidden rounded-md border border-neutral-400 bg-white lg:h-[24rem] lg:w-56 lg:shrink-0"
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDropGroup();
      }}
    >
      <div className="shrink-0 border-b border-neutral-300 px-3 py-2.5">
        <p className="text-sm font-semibold text-coordinator-ink">Batch {batchNumber}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{timeRange}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <div className="space-y-2">
          {children}
          {isEmpty ? <p className="text-xs text-neutral-400">{emptyLabel}</p> : null}
        </div>
      </div>
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
  const [openBatchIds, setOpenBatchIds] = useState<Set<string>>(() => new Set());
  const initialLanesApplied = useRef(false);
  const lastEventWindowKey = useRef(`${draft.date}|${draft.startTime}|${draft.endTime}`);

  const groupMap = useMemo(() => getGroupsById(eventGroups), [eventGroups]);
  const eventWindowKey = `${draft.date}|${draft.startTime}|${draft.endTime}`;
  const timeframeMinutes = useMemo(
    () => Math.max(1, getTimeframeMinutes(draft.startTime, draft.endTime)),
    [draft.startTime, draft.endTime],
  );
  const maxBatchCount = Math.max(1, eventGroups.length);

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

  useEffect(() => {
    setBatchCount((current) => clampDivisionValue(current, 1, maxBatchCount));
    setDurationMinutes((current) => clampDivisionValue(current, 1, timeframeMinutes));
  }, [maxBatchCount, timeframeMinutes]);

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

  function handleDragEnd() {
    setDraggedGroupId(null);
  }

  function toggleBatchAccordion(laneId: string) {
    setOpenBatchIds((current) => {
      const next = new Set(current);
      if (next.has(laneId)) {
        next.delete(laneId);
      } else {
        next.add(laneId);
      }
      return next;
    });
  }

  function renderLaneGroupCards(lane: BatchLane) {
    return lane.groupIds.map((groupId) => {
      const group = groupMap.get(groupId);
      if (!group) return null;
      return (
        <GroupCard
          key={groupId}
          group={group}
          onDragStart={setDraggedGroupId}
          onDragEnd={handleDragEnd}
          onDropTarget={() => handleDrop({ type: 'lane', laneId: lane.id })}
        />
      );
    });
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

      <DefenseBatchMetadataForm
        draft={draft}
        onDraftChange={onDraftChange}
        rubrics={rubrics}
        panelistPool={panelistPool}
        groupCount={eventGroups.length}
      />

      <Card padding="none" shadow="soft" hoverShadow={false} className="overflow-hidden">
          <div className={CARD_HEADER_SECTION_CLASS}>
            <h2 className="text-lg font-semibold coordinator-heading">Batch Division</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Choose how to split the event timeframe into batch lanes for group assignments.
            </p>
          </div>
          <div className={`${CARD_PADDING_CLASS} space-y-4`}>
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

          {divisionMethod === 'by_batches' ? (
            <DivisionSliderField
              label="Number of Batches"
              value={batchCount}
              min={1}
              max={maxBatchCount}
              onChange={setBatchCount}
            />
          ) : null}
          {divisionMethod === 'by_duration' ? (
            <DivisionSliderField
              label="Minutes per Batch"
              value={durationMinutes}
              min={1}
              max={timeframeMinutes}
              onChange={setDurationMinutes}
            />
          ) : null}

          <p className="coordinator-text-muted text-sm">
            {divisionSummary.batchCount} batch{divisionSummary.batchCount === 1 ? '' : 'es'} ·{' '}
            {divisionSummary.durationPerBatchMinutes} min per batch ·{' '}
            {divisionSummary.groupsPerBatch} group{divisionSummary.groupsPerBatch === 1 ? '' : 's'} per batch
            {divisionSummary.remainderGroups > 0
              ? ` · ${divisionSummary.remainderGroups} remainder group${divisionSummary.remainderGroups === 1 ? '' : 's'} in a separate final batch`
              : ''}
          </p>
          </div>
      </Card>

      <Card padding="none" shadow="soft" hoverShadow={false} className="overflow-hidden">
        <div className={CARD_HEADER_SECTION_CLASS}>
          <h2 className="text-lg font-semibold coordinator-heading">Batch Assignments</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Drag groups from the unassigned pool into batch columns for their scheduled time slots.
          </p>
        </div>

        <div
          className={`${CARD_PADDING_CLASS} border-b border-neutral-300`}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop({ type: 'unassigned' });
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-md font-semibold text-coordinator-ink">Unassigned Groups</h3>
              <p className="mt-0.5 text-sm text-neutral-500">
                {unassignedIds.length} group{unassignedIds.length === 1 ? '' : 's'} waiting to be placed in a batch.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              leftIcon={<FiPlus className="h-4 w-4" aria-hidden />}
              onClick={() => setShowAddGroupsModal(true)}
            >
              Add Groups
            </Button>
          </div>
          <div className="grid min-h-[4.5rem] w-full grid-cols-1 gap-2 lg:grid-cols-3 xl:grid-cols-4">
            {unassignedIds.map((groupId) => {
              const group = groupMap.get(groupId);
              if (!group) return null;
              return (
                <GroupCard
                  key={groupId}
                  group={group}
                  className={UNASSIGNED_CARD_CLASS}
                  onDragStart={setDraggedGroupId}
                  onDragEnd={handleDragEnd}
                  onDropTarget={() => handleDrop({ type: 'unassigned' })}
                />
              );
            })}
            {unassignedIds.length === 0 ? (
              <p className="col-span-full text-xs text-neutral-400">All groups are assigned to batches</p>
            ) : null}
          </div>
        </div>

        <div className={`flex flex-col gap-3 lg:hidden ${CARD_PADDING_CLASS}`}>
          {lanes.map((lane) => (
            <BatchAccordionItem
              key={lane.id}
              batchNumber={lane.batchNumber}
              timeRange={formatTimeRange(lane.startTime, lane.endTime)}
              isOpen={openBatchIds.has(lane.id)}
              onToggle={() => toggleBatchAccordion(lane.id)}
              onDropGroup={() => handleDrop({ type: 'lane', laneId: lane.id })}
              emptyLabel="Drag groups here"
            >
              {renderLaneGroupCards(lane)}
            </BatchAccordionItem>
          ))}
        </div>

        <div className={`hidden gap-4 lg:flex lg:flex-row lg:overflow-x-auto ${CARD_PADDING_CLASS}`}>
          {lanes.map((lane) => (
            <KanbanColumn
              key={lane.id}
              batchNumber={lane.batchNumber}
              timeRange={formatTimeRange(lane.startTime, lane.endTime)}
              onDropGroup={() => handleDrop({ type: 'lane', laneId: lane.id })}
              emptyLabel="Drag groups here"
            >
              {renderLaneGroupCards(lane)}
            </KanbanColumn>
          ))}
        </div>
      </Card>

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
