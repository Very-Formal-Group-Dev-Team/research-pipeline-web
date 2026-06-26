'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiEdit2, FiPlus, FiSearch, FiShuffle, FiTrash2 } from 'react-icons/fi';

import Button from '@/components/Button';
import Card, { CARD_PADDING_CLASS, CARD_HEADER_SECTION_CLASS } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { formLabelClassName, formSelectClassName } from '@/lib/utils/formControls';
import { CoordinatorTimeRangeFields } from '@/components/coordinator/CoordinatorTimeRangeFields';
import DefenseBatchMetadataForm from '@/components/coordinator/DefenseBatchMetadataForm';
import type { CoordinatorRubric, CourseGroup, InstitutionAdviser } from '@/lib/api/coordinator';
import type { DefenseBatchPlannerDraft } from '@/lib/coordinator/defenseBatchSession';
import {
  addManualLane,
  addManualLanes,
  autoAssignGroupsToLanes,
  buildLaneTemplates,
  collectUnassignedGroupIds,
  createInitialManualLanes,
  DEFAULT_AUTO_ASSIGN_OPTIONS,
  formatTimeRange,
  getGroupsById,
  getBatchDisplayName,
  getLaneSlotKind,
  getTimeframeMinutes,
  isAssignableLane,
  moveGroupBetweenContainers,
  rebuildLanesPreservingAssignments,
  removeManualLane,
  serializePlannerDirtyState,
  buildPlannerDirtyState,
  summarizeDivision,
  summarizeManualSchedule,
  updateLaneTimes,
  updateLaneLabel,
  updateLaneSlotKind,
  validateLaneSlotAssignments,
  validateManualLanes,
  type AutoAssignOptions,
  type BatchLane,
  type BatchSlotKind,
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
  onDirtyChange?: (dirty: boolean) => void;
}

const DIVISION_OPTIONS: { value: DivisionMethod; label: string }[] = [
  { value: 'by_batches', label: 'By Number of Batches' },
  { value: 'by_duration', label: 'By Duration' },
  { value: 'custom', label: 'Custom' },
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

const BATCH_NAME_CLASS = 'text-sm font-semibold text-coordinator-ink';

function SlotKindToggle({
  slotKind,
  onChange,
}: {
  slotKind: BatchSlotKind;
  onChange: (kind: BatchSlotKind) => void;
}) {
  const isNonDefense = slotKind === 'non_defense';

  return (
    <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-neutral-600">
      <input
        type="checkbox"
        className="accent-coordinator-rose"
        checked={isNonDefense}
        onChange={(event) => onChange(event.target.checked ? 'non_defense' : 'defense')}
        onClick={(event) => event.stopPropagation()}
      />
      <span>Non-defense slot</span>
    </label>
  );
}

function EditableBatchName({
  batchNumber,
  label,
  onLabelChange,
}: {
  batchNumber: number;
  label?: string;
  onLabelChange: (label: string | undefined) => void;
}) {
  const defaultName = `Batch ${batchNumber}`;
  const displayName = label?.trim() || defaultName;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function resizeInput() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    if (!isEditing) {
      setDraft(displayName);
    }
  }, [displayName, isEditing]);

  useEffect(() => {
    if (!isEditing || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.select();
    resizeInput();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing || !inputRef.current) return;
    resizeInput();
  }, [draft, isEditing]);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === defaultName) {
      onLabelChange(undefined);
    } else {
      onLabelChange(trimmed);
    }
    setIsEditing(false);
  }

  function cancel() {
    setDraft(displayName);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        rows={1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
        onBlur={commit}
        onClick={(event) => event.stopPropagation()}
        className={`block min-h-0 w-full min-w-0 max-w-full resize-none overflow-hidden break-words rounded-sm border border-neutral-300 bg-neutral-50 px-1 py-0.5 outline-none focus:border-coordinator-rose/60 focus:ring-1 focus:ring-coordinator-rose/40 ${BATCH_NAME_CLASS}`}
        aria-label={`Batch name for ${defaultName}`}
      />
    );
  }

  return (
    <div className="flex min-w-0 items-start gap-1">
      <span className={`min-w-0 break-words ${BATCH_NAME_CLASS}`}>{displayName}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setDraft(displayName);
          setIsEditing(true);
        }}
        className="mt-0.5 shrink-0 rounded-md p-0.5 text-neutral-400 transition-colors hover:bg-coordinator-rose/10 hover:text-coordinator-rose"
        aria-label={`Rename ${displayName}`}
      >
        <FiEdit2 className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

function BatchAccordionItem({
  batchNumber,
  batchLabel,
  onBatchLabelChange,
  timeRange,
  isOpen,
  onToggle,
  children,
  onDropGroup,
  emptyLabel,
  manualMode = false,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onRemove,
  canRemove = false,
  slotKind = 'defense',
  onSlotKindChange,
}: {
  batchNumber: number;
  batchLabel?: string;
  onBatchLabelChange: (label: string | undefined) => void;
  timeRange: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  onDropGroup: () => void;
  emptyLabel: string;
  manualMode?: boolean;
  startTime?: string;
  endTime?: string;
  onStartTimeChange?: (value: string) => void;
  onEndTimeChange?: (value: string) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  slotKind?: BatchSlotKind;
  onSlotKindChange?: (kind: BatchSlotKind) => void;
}) {
  const isEmpty = React.Children.count(children) === 0;
  const isNonDefense = slotKind === 'non_defense';

  const batchDisplayName = getBatchDisplayName({ batchNumber, label: batchLabel });

  return (
    <div
      className={`overflow-hidden rounded-md border bg-white ${
        isNonDefense ? 'border-neutral-300 bg-neutral-50' : 'border-neutral-400'
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <EditableBatchName
            batchNumber={batchNumber}
            label={batchLabel}
            onLabelChange={onBatchLabelChange}
          />
          {!manualMode || !isOpen ? (
            <p className="mt-0.5 text-xs text-neutral-500">{timeRange}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {manualMode && canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-error-50 hover:text-error-600"
              aria-label={`Remove ${batchDisplayName}`}
            >
              <FiTrash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1.5 text-neutral-500"
            aria-label={isOpen ? `Collapse ${batchDisplayName}` : `Expand ${batchDisplayName}`}
          >
            <FiChevronDown
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        </div>
      </div>
      {isOpen ? (
        <div
          className={`min-h-[4.5rem] border-t border-neutral-300 p-3 ${isEmpty ? 'overflow-visible' : 'overflow-y-auto'}`}
          onDragOver={isNonDefense ? undefined : (event) => event.preventDefault()}
          onDragEnter={isNonDefense ? undefined : (event) => event.preventDefault()}
          onDrop={
            isNonDefense
              ? undefined
              : (event) => {
                  event.preventDefault();
                  onDropGroup();
                }
          }
        >
          {manualMode && startTime && endTime && onStartTimeChange && onEndTimeChange ? (
            <div className="mb-3">
              <CoordinatorTimeRangeFields
                startTime={startTime}
                endTime={endTime}
                onStartChange={onStartTimeChange}
                onEndChange={onEndTimeChange}
                compact
              />
              {onSlotKindChange ? (
                <SlotKindToggle slotKind={slotKind} onChange={onSlotKindChange} />
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            {children}
            {isEmpty ? (
              <p className={`text-xs ${isNonDefense ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {emptyLabel}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KanbanColumn({
  batchNumber,
  batchLabel,
  onBatchLabelChange,
  timeRange,
  children,
  onDropGroup,
  emptyLabel,
  manualMode = false,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onRemove,
  canRemove = false,
  slotKind = 'defense',
  onSlotKindChange,
}: {
  batchNumber: number;
  batchLabel?: string;
  onBatchLabelChange: (label: string | undefined) => void;
  timeRange: string;
  children: React.ReactNode;
  onDropGroup: () => void;
  emptyLabel: string;
  manualMode?: boolean;
  startTime?: string;
  endTime?: string;
  onStartTimeChange?: (value: string) => void;
  onEndTimeChange?: (value: string) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  slotKind?: BatchSlotKind;
  onSlotKindChange?: (kind: BatchSlotKind) => void;
}) {
  const isEmpty = React.Children.count(children) === 0;
  const isNonDefense = slotKind === 'non_defense';
  const batchDisplayName = getBatchDisplayName({ batchNumber, label: batchLabel });

  return (
    <div
      className={`flex min-h-[14rem] w-full min-w-0 flex-col overflow-hidden rounded-md border lg:h-[28rem] lg:w-64 lg:shrink-0 ${
        isNonDefense ? 'border-neutral-300 bg-neutral-50' : 'border-neutral-400 bg-white'
      }`}
    >
      <div className="shrink-0 border-b border-neutral-300 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <EditableBatchName
              batchNumber={batchNumber}
              label={batchLabel}
              onLabelChange={onBatchLabelChange}
            />
          </div>
          {manualMode && canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-error-50 hover:text-error-600"
              aria-label={`Remove ${batchDisplayName}`}
            >
              <FiTrash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        {manualMode && startTime && endTime && onStartTimeChange && onEndTimeChange ? (
          <div className="mt-2">
            <CoordinatorTimeRangeFields
              startTime={startTime}
              endTime={endTime}
              onStartChange={onStartTimeChange}
              onEndChange={onEndTimeChange}
              compact
            />
            {onSlotKindChange ? (
              <SlotKindToggle slotKind={slotKind} onChange={onSlotKindChange} />
            ) : null}
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-neutral-500">{timeRange}</p>
        )}
      </div>
      <div
        className={`min-h-0 flex-1 p-3 ${isEmpty ? 'overflow-visible' : 'overflow-y-auto'}`}
        onDragOver={isNonDefense ? undefined : (event) => event.preventDefault()}
        onDragEnter={isNonDefense ? undefined : (event) => event.preventDefault()}
        onDrop={
          isNonDefense
            ? undefined
            : (event) => {
                event.preventDefault();
                onDropGroup();
              }
        }
      >
        <div className="space-y-2">
          {children}
          {isEmpty ? (
            <p className={`text-xs ${isNonDefense ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {emptyLabel}
            </p>
          ) : null}
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
  onDirtyChange,
}: DefenseBatchPlannerProps) {
  const [eventGroups, setEventGroups] = useState<CourseGroup[]>(initialGroups);
  const [divisionMethod, setDivisionMethod] = useState<DivisionMethod>(
    initialLaneAssignments?.length ? 'custom' : 'by_batches',
  );
  const [batchCount, setBatchCount] = useState(
    initialLaneAssignments?.length ? Math.max(1, initialLaneAssignments.length) : 2,
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [lanes, setLanes] = useState<BatchLane[]>([]);
  const [unassignedIds, setUnassignedIds] = useState<string[]>(initialGroups.map((group) => group.id));
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [showAddGroupsModal, setShowAddGroupsModal] = useState(false);
  const [showAddManySlotsModal, setShowAddManySlotsModal] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [autoAssignOptions, setAutoAssignOptions] = useState<AutoAssignOptions>(DEFAULT_AUTO_ASSIGN_OPTIONS);
  const [addManySlotsCount, setAddManySlotsCount] = useState(2);
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedAddGroupIds, setSelectedAddGroupIds] = useState<string[]>([]);
  const [openBatchIds, setOpenBatchIds] = useState<Set<string>>(() => new Set());
  const initialLanesHydratedRef = useRef(false);
  const plannerBaselineRef = useRef<string | null>(null);

  const plannerDirtySnapshot = useMemo(
    () =>
      serializePlannerDirtyState(
        buildPlannerDirtyState(
          eventGroups,
          lanes,
          divisionMethod,
          batchCount,
          durationMinutes,
        ),
      ),
    [eventGroups, lanes, divisionMethod, batchCount, durationMinutes],
  );

  useEffect(() => {
    if (lanes.length === 0) return;

    if (plannerBaselineRef.current === null) {
      plannerBaselineRef.current = plannerDirtySnapshot;
      onDirtyChange?.(false);
      return;
    }

    onDirtyChange?.(plannerDirtySnapshot !== plannerBaselineRef.current);
  }, [lanes.length, plannerDirtySnapshot, onDirtyChange]);

  const groupMap = useMemo(() => getGroupsById(eventGroups), [eventGroups]);
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
    if (initialLaneAssignments?.length && !initialLanesHydratedRef.current) {
      initialLanesHydratedRef.current = true;
      setDivisionMethod('custom');
      setLanes(initialLaneAssignments);
      setUnassignedIds(collectUnassignedGroupIds(eventGroups, initialLaneAssignments));
      setBatchCount(Math.max(1, initialLaneAssignments.length));
      return;
    }

    if (divisionMethod === 'custom') return;

    setLanes((currentLanes) => {
      const rebuilt = rebuildLanesPreservingAssignments(laneTemplates, currentLanes, eventGroups);
      setUnassignedIds(rebuilt.unassignedIds);
      return rebuilt.lanes;
    });
  }, [laneTemplateKey, laneTemplates, initialLaneAssignments, eventGroups, divisionMethod]);

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

  const manualScheduleSummary = useMemo(
    () => summarizeManualSchedule(lanes, draft.startTime, draft.endTime),
    [lanes, draft.startTime, draft.endTime],
  );

  const manualValidation = useMemo(() => {
    if (divisionMethod !== 'custom') return null;
    const timeValidation = validateManualLanes(lanes, draft.startTime, draft.endTime);
    const slotValidation = validateLaneSlotAssignments(lanes);
    if (timeValidation.valid && slotValidation.valid) {
      return { valid: true, errors: [] as string[] };
    }
    return {
      valid: false,
      errors: [...timeValidation.errors, ...slotValidation.errors],
    };
  }, [divisionMethod, lanes, draft.startTime, draft.endTime]);

  const slotValidation = useMemo(() => validateLaneSlotAssignments(lanes), [lanes]);

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
  const hasManualErrors = manualValidation !== null && !manualValidation.valid;
  const hasSlotErrors = !slotValidation.valid;
  const assignableLaneCount = useMemo(
    () => lanes.filter((lane) => isAssignableLane(lane)).length,
    [lanes],
  );

  const autoAssignPreview = useMemo(() => {
    if (!showAutoAssignModal) return null;
    return autoAssignGroupsToLanes({
      lanes,
      groups: eventGroups,
      unassignedIds,
      options: autoAssignOptions,
    });
  }, [showAutoAssignModal, lanes, eventGroups, unassignedIds, autoAssignOptions]);

  const autoAssignGroupCount =
    autoAssignOptions.scope === 'reassign_all' ? eventGroups.length : unassignedIds.length;

  const canApplyAutoAssign =
    assignableLaneCount > 0 && autoAssignGroupCount > 0 && autoAssignPreview !== null;

  function getLaneEmptyLabel(lane: BatchLane) {
    return getLaneSlotKind(lane) === 'non_defense' ? 'Break / non-defense slot' : 'Drag groups here';
  }

  function switchDivisionMethod(method: DivisionMethod) {
    if (method === divisionMethod) return;

    if (method === 'custom' && lanes.length === 0) {
      const initial = createInitialManualLanes(draft.startTime, draft.endTime, batchCount);
      setLanes(initial);
      setUnassignedIds(eventGroups.map((group) => group.id));
    }

    setDivisionMethod(method);
  }

  function handleAddManualBatch() {
    setLanes((current) => addManualLane(current, draft.startTime, draft.endTime));
  }

  function handleAddManyManualBatches() {
    if (addManySlotsCount < 1) return;
    setLanes((current) =>
      addManualLanes(current, draft.startTime, draft.endTime, addManySlotsCount),
    );
    setShowAddManySlotsModal(false);
    setAddManySlotsCount(2);
  }

  function handleRemoveManualBatch(laneId: string) {
    const { lanes: nextLanes, releasedGroupIds } = removeManualLane(lanes, laneId);
    if (releasedGroupIds.length === 0 && nextLanes.length === lanes.length) return;
    setLanes(nextLanes);
    if (releasedGroupIds.length) {
      setUnassignedIds((current) => [...current, ...releasedGroupIds]);
    }
  }

  function handleLaneTimeChange(laneId: string, patch: { startTime?: string; endTime?: string }) {
    setLanes((current) => updateLaneTimes(current, laneId, patch));
  }

  function handleLaneLabelChange(laneId: string, label: string | undefined) {
    setLanes((current) => updateLaneLabel(current, laneId, label));
  }

  function handleLaneSlotKindChange(laneId: string, slotKind: BatchSlotKind) {
    const { lanes: nextLanes, releasedGroupIds } = updateLaneSlotKind(lanes, laneId, slotKind);
    setLanes(nextLanes);
    if (releasedGroupIds.length) {
      setUnassignedIds((current) => [...current, ...releasedGroupIds]);
    }
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
    if (!isAssignableLane(lane)) return null;
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

  function handleApplyAutoAssign() {
    if (!autoAssignPreview) return;
    setLanes(autoAssignPreview.lanes);
    setUnassignedIds(autoAssignPreview.unassignedIds);
    setShowAutoAssignModal(false);
    setAutoAssignOptions(DEFAULT_AUTO_ASSIGN_OPTIONS);
  }

  function closeAutoAssignModal() {
    setShowAutoAssignModal(false);
    setAutoAssignOptions(DEFAULT_AUTO_ASSIGN_OPTIONS);
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

          {divisionMethod === 'custom' ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Set a custom start and end time for each batch. Gaps between batches are allowed. Use
                them for lunch breaks or other pauses.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<FiPlus className="h-4 w-4" aria-hidden />}
                  onClick={handleAddManualBatch}
                >
                  Add Time Slot
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddManySlotsModal(true)}
                >
                  Add Many Time Slots
                </Button>
              </div>
            </div>
          ) : null}

          <p className="coordinator-text-muted text-sm">
            {divisionMethod === 'custom' ? (
              <>
                {manualScheduleSummary.batchCount} batch
                {manualScheduleSummary.batchCount === 1 ? '' : 'es'} ·{' '}
                {manualScheduleSummary.scheduledMinutes} min scheduled
                {manualScheduleSummary.breakMinutes > 0
                  ? ` · ${manualScheduleSummary.breakMinutes} min break/unused within event window`
                  : ''}
              </>
            ) : (
              <>
                {divisionSummary.batchCount} batch{divisionSummary.batchCount === 1 ? '' : 'es'} ·{' '}
                {divisionSummary.durationPerBatchMinutes} min per batch ·{' '}
                {divisionSummary.groupsPerBatch} group
                {divisionSummary.groupsPerBatch === 1 ? '' : 's'} per batch
                {divisionSummary.remainderGroups > 0
                  ? ` · ${divisionSummary.remainderGroups} remainder group${divisionSummary.remainderGroups === 1 ? '' : 's'} in a separate final batch`
                  : ''}
              </>
            )}
          </p>

          {manualValidation?.errors.length ? (
            <ul className="space-y-1 rounded-md bg-error-50 px-3 py-2 text-sm text-error-600">
              {manualValidation.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
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
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                leftIcon={<FiShuffle className="h-4 w-4" aria-hidden />}
                disabled={assignableLaneCount === 0 || eventGroups.length === 0}
                onClick={() => setShowAutoAssignModal(true)}
              >
                Auto-assign Groups
              </Button>
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
              batchLabel={lane.label}
              onBatchLabelChange={(label) => handleLaneLabelChange(lane.id, label)}
              timeRange={formatTimeRange(lane.startTime, lane.endTime)}
              isOpen={openBatchIds.has(lane.id)}
              onToggle={() => toggleBatchAccordion(lane.id)}
              onDropGroup={() => handleDrop({ type: 'lane', laneId: lane.id })}
              emptyLabel={getLaneEmptyLabel(lane)}
              manualMode={divisionMethod === 'custom'}
              startTime={lane.startTime}
              endTime={lane.endTime}
              onStartTimeChange={(value) => handleLaneTimeChange(lane.id, { startTime: value })}
              onEndTimeChange={(value) => handleLaneTimeChange(lane.id, { endTime: value })}
              onRemove={() => handleRemoveManualBatch(lane.id)}
              canRemove={lanes.length > 1}
              slotKind={getLaneSlotKind(lane)}
              onSlotKindChange={(kind) => handleLaneSlotKindChange(lane.id, kind)}
            >
              {renderLaneGroupCards(lane)}
            </BatchAccordionItem>
          ))}
        </div>

        <div className={`hidden gap-4 lg:flex lg:flex-row lg:overflow-x-auto lg:overflow-y-visible ${CARD_PADDING_CLASS}`}>
          {lanes.map((lane) => (
            <KanbanColumn
              key={lane.id}
              batchNumber={lane.batchNumber}
              batchLabel={lane.label}
              onBatchLabelChange={(label) => handleLaneLabelChange(lane.id, label)}
              timeRange={formatTimeRange(lane.startTime, lane.endTime)}
              onDropGroup={() => handleDrop({ type: 'lane', laneId: lane.id })}
              emptyLabel={getLaneEmptyLabel(lane)}
              manualMode={divisionMethod === 'custom'}
              startTime={lane.startTime}
              endTime={lane.endTime}
              onStartTimeChange={(value) => handleLaneTimeChange(lane.id, { startTime: value })}
              onEndTimeChange={(value) => handleLaneTimeChange(lane.id, { endTime: value })}
              onRemove={() => handleRemoveManualBatch(lane.id)}
              canRemove={lanes.length > 1}
              slotKind={getLaneSlotKind(lane)}
              onSlotKindChange={(kind) => handleLaneSlotKindChange(lane.id, kind)}
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
          disabled={submitting || hasUnassigned || lanes.length === 0 || hasManualErrors || hasSlotErrors}
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

      <Modal
        isOpen={showAutoAssignModal}
        onClose={closeAutoAssignModal}
        title="Auto-assign Groups"
        description="Choose how groups are sorted and distributed across defense batches. Non-defense slots are skipped."
        size="md"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="auto-assign-sort" className={formLabelClassName}>
                Sort by
              </label>
              <select
                id="auto-assign-sort"
                value={autoAssignOptions.sortField}
                onChange={(event) =>
                  setAutoAssignOptions((current) => ({
                    ...current,
                    sortField: event.target.value as AutoAssignOptions['sortField'],
                  }))
                }
                className={formSelectClassName}
              >
                <option value="title">Title</option>
                <option value="project_code">Project code</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div>
              <label htmlFor="auto-assign-direction" className={formLabelClassName}>
                Order
              </label>
              <select
                id="auto-assign-direction"
                value={autoAssignOptions.sortDirection}
                disabled={autoAssignOptions.sortField === 'random'}
                onChange={(event) =>
                  setAutoAssignOptions((current) => ({
                    ...current,
                    sortDirection: event.target.value as AutoAssignOptions['sortDirection'],
                  }))
                }
                className={formSelectClassName}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div>
              <label htmlFor="auto-assign-distribution" className={formLabelClassName}>
                Distribution
              </label>
              <select
                id="auto-assign-distribution"
                value={autoAssignOptions.distribution}
                onChange={(event) =>
                  setAutoAssignOptions((current) => ({
                    ...current,
                    distribution: event.target.value as AutoAssignOptions['distribution'],
                  }))
                }
                className={formSelectClassName}
              >
                <option value="round_robin">Round robin</option>
                <option value="sequential_fill">Sequential fill</option>
              </select>
            </div>
            <div>
              <label htmlFor="auto-assign-scope" className={formLabelClassName}>
                Scope
              </label>
              <select
                id="auto-assign-scope"
                value={autoAssignOptions.scope}
                onChange={(event) =>
                  setAutoAssignOptions((current) => ({
                    ...current,
                    scope: event.target.value as AutoAssignOptions['scope'],
                  }))
                }
                className={formSelectClassName}
              >
                <option value="unassigned_only">Unassigned only</option>
                <option value="reassign_all">Reassign all groups</option>
              </select>
            </div>
          </div>

          {autoAssignOptions.scope === 'reassign_all' ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This will clear current batch assignments and redistribute all {eventGroups.length}{' '}
              group{eventGroups.length === 1 ? '' : 's'}.
            </p>
          ) : null}

          <div>
            <p className={formLabelClassName}>Preview</p>
            {assignableLaneCount === 0 ? (
              <p className="text-sm text-neutral-500">Add at least one defense batch before auto-assigning.</p>
            ) : autoAssignGroupCount === 0 ? (
              <p className="text-sm text-neutral-500">
                {autoAssignOptions.scope === 'unassigned_only'
                  ? 'No unassigned groups to place.'
                  : 'No groups available to assign.'}
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-neutral-300 p-2">
                {autoAssignPreview?.lanes
                  .filter((lane) => isAssignableLane(lane))
                  .map((lane) => (
                    <div key={lane.id} className="rounded-md bg-neutral-50 px-2 py-1.5">
                      <p className="text-sm font-medium text-coordinator-ink">
                        {getBatchDisplayName(lane)} · {formatTimeRange(lane.startTime, lane.endTime)}
                      </p>
                      {lane.groupIds.length ? (
                        <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                          {lane.groupIds.map((groupId) => {
                            const group = groupMap.get(groupId);
                            if (!group) return null;
                            return (
                              <li key={groupId} className="truncate">
                                {group.title} ({group.project_code})
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-neutral-400">No groups</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeAutoAssignModal}>
              Cancel
            </Button>
            <Button type="button" disabled={!canApplyAutoAssign} onClick={handleApplyAutoAssign}>
              Apply Assignment
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddManySlotsModal}
        onClose={() => {
          setShowAddManySlotsModal(false);
          setAddManySlotsCount(2);
        }}
        title="Add Time Slots"
        description="Enter how many time slots to add at once. Each new slot starts after the previous one."
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="add-many-slots-count" className={formLabelClassName}>
              Number of time slots
            </label>
            <input
              id="add-many-slots-count"
              type="number"
              min={1}
              max={50}
              step={1}
              value={addManySlotsCount}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) return;
                setAddManySlotsCount(Math.min(50, Math.max(1, Math.floor(next))));
              }}
              className="w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coordinator-rose/40"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddManySlotsModal(false);
                setAddManySlotsCount(2);
              }}
            >
              Cancel
            </Button>
            <Button type="button" disabled={addManySlotsCount < 1} onClick={handleAddManyManualBatches}>
              Add {addManySlotsCount} Time Slot{addManySlotsCount === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
