import type { CourseGroup } from '@/lib/api/coordinator';

export type DivisionMethod = 'by_batches' | 'by_duration' | 'custom';

export type BatchSlotKind = 'defense' | 'non_defense';

export interface BatchLane {
  id: string;
  batchNumber: number;
  label?: string;
  slotKind?: BatchSlotKind;
  startTime: string;
  endTime: string;
  groupIds: string[];
}

export interface BatchDivisionSummary {
  batchCount: number;
  durationPerBatchMinutes: number;
  groupsPerBatch: number;
  remainderBatchCount: number;
  remainderGroups: number;
}

export interface DefenseEventSummary {
  courseName: string;
  defenseType: string;
  date: string;
  startTime: string;
  endTime: string;
  totalGroups: number;
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function getTimeframeMinutes(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return Math.max(0, end - start);
}

export function formatDefenseTypeLabel(defenseType: string): string {
  return defenseType.charAt(0).toUpperCase() + defenseType.slice(1);
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

export function getBatchDisplayName(lane: Pick<BatchLane, 'batchNumber' | 'label'>): string {
  const trimmed = lane.label?.trim();
  return trimmed || `Batch ${lane.batchNumber}`;
}

export function getLaneSlotKind(lane: Pick<BatchLane, 'slotKind'>): BatchSlotKind {
  return lane.slotKind ?? 'defense';
}

export function isAssignableLane(lane: Pick<BatchLane, 'slotKind'>): boolean {
  return getLaneSlotKind(lane) !== 'non_defense';
}

function createLaneId(batchNumber: number) {
  return `batch-${batchNumber}`;
}

function getRemainderGroups(groupCount: number, baseBatchCount: number) {
  return baseBatchCount > 0 ? groupCount % baseBatchCount : groupCount;
}

function getEffectiveBatchCount(baseBatchCount: number, remainderGroups: number) {
  return baseBatchCount + (remainderGroups > 0 ? 1 : 0);
}

function buildSequentialSlots(
  startTime: string,
  slotDurationMinutes: number,
  slotCount: number,
): Array<{ startTime: string; endTime: string }> {
  const startMinutes = parseTimeToMinutes(startTime);
  return Array.from({ length: slotCount }, (_, index) => {
    const slotStart = startMinutes + index * slotDurationMinutes;
    const slotEnd = slotStart + slotDurationMinutes;
    return {
      startTime: formatMinutesToTime(slotStart),
      endTime: formatMinutesToTime(slotEnd),
    };
  });
}

export function buildLanesForByBatches({
  startTime,
  endTime,
  batchCount,
}: {
  startTime: string;
  endTime: string;
  batchCount: number;
}): Omit<BatchLane, 'groupIds'>[] {
  const safeBatchCount = Math.max(1, Math.floor(batchCount));
  const totalMinutes = getTimeframeMinutes(startTime, endTime);
  const durationPerBatch = totalMinutes > 0 ? Math.floor(totalMinutes / safeBatchCount) : 0;
  const slots = buildSequentialSlots(startTime, durationPerBatch || 60, safeBatchCount);

  return slots.map((slot, index) => ({
    id: createLaneId(index + 1),
    batchNumber: index + 1,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

export function buildLanesForByDuration({
  startTime,
  endTime,
  durationMinutes,
}: {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}): Omit<BatchLane, 'groupIds'>[] {
  const safeDuration = Math.max(1, Math.floor(durationMinutes));
  const totalMinutes = getTimeframeMinutes(startTime, endTime);
  const fullBatchCount = Math.max(1, Math.floor(totalMinutes / safeDuration));
  const slots = buildSequentialSlots(startTime, safeDuration, fullBatchCount);

  return slots.map((slot, index) => ({
    id: createLaneId(index + 1),
    batchNumber: index + 1,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

export function buildLanesForManual({
  startTime,
  endTime,
  batchCount,
}: {
  startTime: string;
  endTime: string;
  batchCount: number;
}): Omit<BatchLane, 'groupIds'>[] {
  const laneCount = Math.max(1, Math.floor(batchCount));
  const totalMinutes = getTimeframeMinutes(startTime, endTime);
  const durationPerBatch = totalMinutes > 0 ? Math.floor(totalMinutes / laneCount) : 60;
  const slots = buildSequentialSlots(startTime, durationPerBatch || 60, laneCount);

  return slots.map((slot, index) => ({
    id: createLaneId(index + 1),
    batchNumber: index + 1,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

export function createInitialManualLanes(
  startTime: string,
  endTime: string,
  batchCount = 2,
): BatchLane[] {
  return createEmptyLanes(buildLanesForManual({ startTime, endTime, batchCount }));
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

export function addManualLane(
  lanes: BatchLane[],
  eventStartTime: string,
  eventEndTime: string,
): BatchLane[] {
  const eventEnd = parseTimeToMinutes(eventEndTime);
  const defaultDuration = 60;

  let newStart: number;
  let newEnd: number;

  if (lanes.length === 0) {
    newStart = parseTimeToMinutes(eventStartTime);
    newEnd = Math.min(newStart + defaultDuration, eventEnd);
  } else {
    const lastLane = lanes[lanes.length - 1];
    newStart = parseTimeToMinutes(lastLane.endTime);
    newEnd = Math.min(newStart + defaultDuration, eventEnd);
    if (newEnd <= newStart) {
      newStart = parseTimeToMinutes(eventStartTime);
      newEnd = Math.min(newStart + defaultDuration, eventEnd);
    }
  }

  const newBatchNumber = lanes.length + 1;
  return [
    ...lanes,
    {
      id: createLaneId(newBatchNumber),
      batchNumber: newBatchNumber,
      startTime: formatMinutesToTime(newStart),
      endTime: formatMinutesToTime(newEnd),
      groupIds: [],
    },
  ];
}

export function addManualLanes(
  lanes: BatchLane[],
  eventStartTime: string,
  eventEndTime: string,
  count: number,
): BatchLane[] {
  const safeCount = Math.max(0, Math.floor(count));
  let result = lanes;
  for (let i = 0; i < safeCount; i++) {
    result = addManualLane(result, eventStartTime, eventEndTime);
  }
  return result;
}

export function removeManualLane(
  lanes: BatchLane[],
  laneId: string,
): { lanes: BatchLane[]; releasedGroupIds: string[] } {
  const target = lanes.find((lane) => lane.id === laneId);
  if (!target || lanes.length <= 1) {
    return { lanes, releasedGroupIds: [] };
  }

  const releasedGroupIds = [...target.groupIds];
  const renumbered = lanes
    .filter((lane) => lane.id !== laneId)
    .map((lane, index) => ({
      ...lane,
      id: createLaneId(index + 1),
      batchNumber: index + 1,
    }));

  return { lanes: renumbered, releasedGroupIds };
}

export function updateLaneTimes(
  lanes: BatchLane[],
  laneId: string,
  patch: { startTime?: string; endTime?: string },
): BatchLane[] {
  return lanes.map((lane) => (lane.id === laneId ? { ...lane, ...patch } : lane));
}

export function updateLaneLabel(
  lanes: BatchLane[],
  laneId: string,
  label: string | undefined,
): BatchLane[] {
  return lanes.map((lane) => {
    if (lane.id !== laneId) return lane;
    const trimmed = label?.trim();
    const defaultName = `Batch ${lane.batchNumber}`;
    if (!trimmed || trimmed === defaultName) {
      const next = { ...lane };
      delete next.label;
      return next;
    }
    return { ...lane, label: trimmed };
  });
}

export function updateLaneSlotKind(
  lanes: BatchLane[],
  laneId: string,
  slotKind: BatchSlotKind,
): { lanes: BatchLane[]; releasedGroupIds: string[] } {
  let releasedGroupIds: string[] = [];

  const nextLanes = lanes.map((lane) => {
    if (lane.id !== laneId) return lane;

    if (slotKind === 'non_defense') {
      releasedGroupIds = [...lane.groupIds];
      return { ...lane, slotKind, groupIds: [] };
    }

    const next = { ...lane };
    delete next.slotKind;
    return next;
  });

  return { lanes: nextLanes, releasedGroupIds };
}

export function validateLaneSlotAssignments(lanes: BatchLane[]): ManualLaneValidationResult {
  const errors: string[] = [];

  for (const lane of lanes) {
    if (getLaneSlotKind(lane) === 'non_defense' && lane.groupIds.length > 0) {
      errors.push(`${getBatchDisplayName(lane)} is marked non-defense but has assigned groups.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export interface ManualLaneValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateManualLanes(
  lanes: BatchLane[],
  eventStartTime: string,
  eventEndTime: string,
): ManualLaneValidationResult {
  const errors: string[] = [];
  const eventStart = parseTimeToMinutes(eventStartTime);
  const eventEnd = parseTimeToMinutes(eventEndTime);
  const lanesWithGroups = lanes.filter((lane) => lane.groupIds.length > 0);

  for (const lane of lanesWithGroups) {
    const start = parseTimeToMinutes(lane.startTime);
    const end = parseTimeToMinutes(lane.endTime);

    if (start >= end) {
      errors.push(`${getBatchDisplayName(lane)}: start time must be before end time.`);
    }
    if (start < eventStart) {
      errors.push(`${getBatchDisplayName(lane)}: start time is before the event start (${eventStartTime}).`);
    }
    if (end > eventEnd) {
      errors.push(`${getBatchDisplayName(lane)}: end time is after the event end (${eventEndTime}).`);
    }
  }

  for (let i = 0; i < lanes.length; i++) {
    for (let j = i + 1; j < lanes.length; j++) {
      const a = lanes[i];
      const b = lanes[j];
      if (a.groupIds.length === 0 || b.groupIds.length === 0) continue;
      if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
        errors.push(`${getBatchDisplayName(a)} and ${getBatchDisplayName(b)} have overlapping times.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function summarizeManualSchedule(
  lanes: BatchLane[],
  startTime: string,
  endTime: string,
): { batchCount: number; scheduledMinutes: number; breakMinutes: number } {
  const eventMinutes = getTimeframeMinutes(startTime, endTime);
  const scheduledMinutes = lanes.reduce(
    (sum, lane) => sum + getTimeframeMinutes(lane.startTime, lane.endTime),
    0,
  );
  const breakMinutes = Math.max(0, eventMinutes - scheduledMinutes);
  return { batchCount: lanes.length, scheduledMinutes, breakMinutes };
}

export function appendRemainderLane(
  lanes: Omit<BatchLane, 'groupIds'>[],
  durationMinutes: number,
): Omit<BatchLane, 'groupIds'>[] {
  if (!lanes.length) return lanes;

  const lastLane = lanes[lanes.length - 1];
  const remainderStart = parseTimeToMinutes(lastLane.endTime);
  const remainderEnd = remainderStart + durationMinutes;

  return [
    ...lanes,
    {
      id: createLaneId(lanes.length + 1),
      batchNumber: lanes.length + 1,
      startTime: formatMinutesToTime(remainderStart),
      endTime: formatMinutesToTime(remainderEnd),
    },
  ];
}

export function buildLaneTemplates({
  method,
  startTime,
  endTime,
  batchCount,
  durationMinutes,
  groupCount,
}: {
  method: DivisionMethod;
  startTime: string;
  endTime: string;
  batchCount: number;
  durationMinutes: number;
  groupCount: number;
}): Omit<BatchLane, 'groupIds'>[] {
  if (method === 'by_batches') {
    const safeBatchCount = Math.max(1, Math.floor(batchCount));
    const remainderGroups = getRemainderGroups(groupCount, safeBatchCount);
    const effectiveBatchCount = getEffectiveBatchCount(safeBatchCount, remainderGroups);
    return buildLanesForByBatches({ startTime, endTime, batchCount: effectiveBatchCount });
  }

  if (method === 'by_duration') {
    const safeDuration = Math.max(1, Math.floor(durationMinutes));
    const totalMinutes = getTimeframeMinutes(startTime, endTime);
    const baseBatchCount = Math.max(1, Math.floor(totalMinutes / safeDuration));
    const remainderGroups = getRemainderGroups(groupCount, baseBatchCount);
    if (remainderGroups > 0) {
      const effectiveBatchCount = getEffectiveBatchCount(baseBatchCount, remainderGroups);
      return buildLanesForByBatches({ startTime, endTime, batchCount: effectiveBatchCount });
    }
    return buildLanesForByDuration({ startTime, endTime, durationMinutes: safeDuration });
  }

  return buildLanesForManual({ startTime, endTime, batchCount });
}

export function createEmptyLanes(templates: Omit<BatchLane, 'groupIds'>[]): BatchLane[] {
  return templates.map((lane) => ({ ...lane, groupIds: [] }));
}

/** Rebuild lane time slots from templates while keeping group-to-batch assignments. */
export function rebuildLanesPreservingAssignments(
  templates: Omit<BatchLane, 'groupIds'>[],
  currentLanes: BatchLane[],
  eventGroups: CourseGroup[],
): { lanes: BatchLane[]; unassignedIds: string[] } {
  const lanes = createEmptyLanes(templates);

  if (!currentLanes.length) {
    return {
      lanes,
      unassignedIds: eventGroups.map((group) => group.id),
    };
  }

  currentLanes.forEach((oldLane, index) => {
    const targetIndex = Math.min(index, lanes.length - 1);
    const targetLane = lanes[targetIndex];
    if (oldLane.label?.trim()) {
      targetLane.label = oldLane.label.trim();
    }
    if (oldLane.slotKind) {
      targetLane.slotKind = oldLane.slotKind;
    }
    if (isAssignableLane(targetLane)) {
      oldLane.groupIds.forEach((groupId) => {
        if (!targetLane.groupIds.includes(groupId)) {
          targetLane.groupIds.push(groupId);
        }
      });
    }
  });

  return {
    lanes,
    unassignedIds: collectUnassignedGroupIds(eventGroups, lanes),
  };
}

export function summarizeDivision({
  method,
  groupCount,
  startTime,
  endTime,
  batchCount,
  durationMinutes,
  laneCount,
}: {
  method: DivisionMethod;
  groupCount: number;
  startTime: string;
  endTime: string;
  batchCount: number;
  durationMinutes: number;
  laneCount: number;
}): BatchDivisionSummary {
  const totalMinutes = getTimeframeMinutes(startTime, endTime);

  if (method === 'by_batches') {
    const safeBatchCount = Math.max(1, Math.floor(batchCount));
    const remainderGroups = getRemainderGroups(groupCount, safeBatchCount);
    const effectiveBatchCount = getEffectiveBatchCount(safeBatchCount, remainderGroups);
    const durationPerBatch =
      totalMinutes > 0 ? Math.floor(totalMinutes / effectiveBatchCount) : 0;
    const groupsPerBatch = safeBatchCount > 0 ? Math.floor(groupCount / safeBatchCount) : 0;
    return {
      batchCount: effectiveBatchCount,
      durationPerBatchMinutes: durationPerBatch,
      groupsPerBatch,
      remainderBatchCount: remainderGroups > 0 ? 1 : 0,
      remainderGroups,
    };
  }

  if (method === 'by_duration') {
    const safeDuration = Math.max(1, Math.floor(durationMinutes));
    const baseBatchCount = Math.max(1, Math.floor(totalMinutes / safeDuration));
    const remainderGroups = getRemainderGroups(groupCount, baseBatchCount);
    const effectiveBatchCount = getEffectiveBatchCount(baseBatchCount, remainderGroups);
    const durationPerBatch =
      remainderGroups > 0 && totalMinutes > 0
        ? Math.floor(totalMinutes / effectiveBatchCount)
        : safeDuration;
    const groupsPerBatch = baseBatchCount > 0 ? Math.floor(groupCount / baseBatchCount) : 0;
    return {
      batchCount: effectiveBatchCount,
      durationPerBatchMinutes: durationPerBatch,
      groupsPerBatch,
      remainderBatchCount: remainderGroups > 0 ? 1 : 0,
      remainderGroups,
    };
  }

  return {
    batchCount: laneCount,
    durationPerBatchMinutes: laneCount > 0 ? Math.floor(totalMinutes / laneCount) : 0,
    groupsPerBatch: laneCount > 0 ? Math.ceil(groupCount / laneCount) : 0,
    remainderBatchCount: 0,
    remainderGroups: 0,
  };
}

export function getGroupsById(groups: CourseGroup[]): Map<string, CourseGroup> {
  return new Map(groups.map((group) => [group.id, group]));
}

export function collectUnassignedGroupIds(groups: CourseGroup[], lanes: BatchLane[]): string[] {
  const assigned = new Set(lanes.flatMap((lane) => lane.groupIds));
  return groups.filter((group) => !assigned.has(group.id)).map((group) => group.id);
}

export function moveGroupBetweenContainers({
  lanes,
  unassignedIds,
  groupId,
  target,
}: {
  lanes: BatchLane[];
  unassignedIds: string[];
  groupId: string;
  target: { type: 'unassigned' } | { type: 'lane'; laneId: string };
}): { lanes: BatchLane[]; unassignedIds: string[] } {
  const nextLanes = lanes.map((lane) => ({
    ...lane,
    groupIds: lane.groupIds.filter((id) => id !== groupId),
  }));
  let nextUnassigned = unassignedIds.filter((id) => id !== groupId);

  if (target.type === 'unassigned') {
    nextUnassigned = [...nextUnassigned, groupId];
  } else {
    const targetLane = nextLanes.find((lane) => lane.id === target.laneId);
    if (!targetLane || !isAssignableLane(targetLane)) {
      return { lanes, unassignedIds };
    }
    targetLane.groupIds = [...targetLane.groupIds, groupId];
  }

  return { lanes: nextLanes, unassignedIds: nextUnassigned };
}

export interface PlannerDirtyState {
  eventGroupIds: string[];
  lanes: Array<{
    id: string;
    batchNumber: number;
    label?: string;
    slotKind?: BatchSlotKind;
    startTime: string;
    endTime: string;
    groupIds: string[];
  }>;
  divisionMethod: DivisionMethod;
  batchCount: number;
  durationMinutes: number;
}

export function buildPlannerDirtyState(
  eventGroups: CourseGroup[],
  lanes: BatchLane[],
  divisionMethod: DivisionMethod,
  batchCount: number,
  durationMinutes: number,
): PlannerDirtyState {
  return {
    eventGroupIds: eventGroups.map((group) => group.id),
    lanes: lanes.map((lane) => ({
      id: lane.id,
      batchNumber: lane.batchNumber,
      label: lane.label,
      slotKind: lane.slotKind,
      startTime: lane.startTime,
      endTime: lane.endTime,
      groupIds: [...lane.groupIds],
    })),
    divisionMethod,
    batchCount,
    durationMinutes,
  };
}

export function serializePlannerDirtyState(state: PlannerDirtyState): string {
  return JSON.stringify(state);
}

export type AutoAssignSortField = 'title' | 'project_code' | 'random';
export type AutoAssignSortDirection = 'asc' | 'desc';
export type AutoAssignDistribution = 'round_robin' | 'sequential_fill';
export type AutoAssignScope = 'unassigned_only' | 'reassign_all';

export interface AutoAssignOptions {
  sortField: AutoAssignSortField;
  sortDirection: AutoAssignSortDirection;
  distribution: AutoAssignDistribution;
  scope: AutoAssignScope;
}

export const DEFAULT_AUTO_ASSIGN_OPTIONS: AutoAssignOptions = {
  sortField: 'title',
  sortDirection: 'asc',
  distribution: 'round_robin',
  scope: 'unassigned_only',
};

function randomSortKey(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

export function sortGroupsForAutoAssign(
  groups: CourseGroup[],
  options: Pick<AutoAssignOptions, 'sortField' | 'sortDirection'>,
): CourseGroup[] {
  const copy = [...groups];

  if (options.sortField === 'random') {
    copy.sort((a, b) => randomSortKey(a.id) - randomSortKey(b.id));
    return copy;
  }

  copy.sort((a, b) => {
    const cmp = a[options.sortField].localeCompare(b[options.sortField], undefined, {
      sensitivity: 'base',
    });
    return options.sortDirection === 'asc' ? cmp : -cmp;
  });

  return copy;
}

function getAssignableLaneRefs(lanes: BatchLane[]) {
  return lanes
    .map((lane, index) => ({ lane, index }))
    .filter(({ lane }) => isAssignableLane(lane));
}

function distributeRoundRobin(groupIds: string[], assignableLaneRefs: Array<{ index: number }>, lanes: BatchLane[]) {
  groupIds.forEach((groupId, groupIndex) => {
    const laneIndex = assignableLaneRefs[groupIndex % assignableLaneRefs.length].index;
    lanes[laneIndex].groupIds.push(groupId);
  });
}

function distributeSequentialFill(
  groupIds: string[],
  assignableLaneRefs: Array<{ index: number }>,
  lanes: BatchLane[],
) {
  const laneCount = assignableLaneRefs.length;
  const base = Math.floor(groupIds.length / laneCount);
  const remainder = groupIds.length % laneCount;
  let groupIndex = 0;

  for (let laneOffset = 0; laneOffset < laneCount; laneOffset++) {
    const count = base + (laneOffset < remainder ? 1 : 0);
    const laneIndex = assignableLaneRefs[laneOffset].index;
    for (let i = 0; i < count; i++) {
      lanes[laneIndex].groupIds.push(groupIds[groupIndex]);
      groupIndex += 1;
    }
  }
}

function distributeUnassignedSequentialFill(
  groupIds: string[],
  assignableLaneRefs: Array<{ index: number }>,
  lanes: BatchLane[],
) {
  groupIds.forEach((groupId) => {
    const target = assignableLaneRefs.reduce((best, current) => {
      const bestCount = lanes[best.index].groupIds.length;
      const currentCount = lanes[current.index].groupIds.length;
      if (currentCount < bestCount) return current;
      if (currentCount > bestCount) return best;
      return current.index < best.index ? current : best;
    });
    lanes[target.index].groupIds.push(groupId);
  });
}

export function autoAssignGroupsToLanes({
  lanes,
  groups,
  unassignedIds,
  options,
}: {
  lanes: BatchLane[];
  groups: CourseGroup[];
  unassignedIds: string[];
  options: AutoAssignOptions;
}): { lanes: BatchLane[]; unassignedIds: string[] } {
  const assignableLaneRefs = getAssignableLaneRefs(lanes);
  if (!assignableLaneRefs.length) {
    return { lanes, unassignedIds };
  }

  const groupMap = getGroupsById(groups);
  const sourceGroupIds =
    options.scope === 'reassign_all' ? groups.map((group) => group.id) : [...unassignedIds];

  if (!sourceGroupIds.length) {
    return { lanes, unassignedIds };
  }

  const sortedGroups = sortGroupsForAutoAssign(
    sourceGroupIds
      .map((groupId) => groupMap.get(groupId))
      .filter((group): group is CourseGroup => Boolean(group)),
    options,
  );
  const sortedGroupIds = sortedGroups.map((group) => group.id);

  const nextLanes = lanes.map((lane) => {
    if (!isAssignableLane(lane)) {
      return { ...lane, groupIds: [...lane.groupIds] };
    }
    if (options.scope === 'reassign_all') {
      return { ...lane, groupIds: [] };
    }
    return { ...lane, groupIds: [...lane.groupIds] };
  });

  if (options.scope === 'reassign_all') {
    if (options.distribution === 'round_robin') {
      distributeRoundRobin(sortedGroupIds, assignableLaneRefs, nextLanes);
    } else {
      distributeSequentialFill(sortedGroupIds, assignableLaneRefs, nextLanes);
    }
  } else if (options.distribution === 'round_robin') {
    distributeRoundRobin(sortedGroupIds, assignableLaneRefs, nextLanes);
  } else {
    distributeUnassignedSequentialFill(sortedGroupIds, assignableLaneRefs, nextLanes);
  }

  return {
    lanes: nextLanes,
    unassignedIds: collectUnassignedGroupIds(groups, nextLanes),
  };
}
