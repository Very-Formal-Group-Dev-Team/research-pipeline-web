import type { CourseGroup } from '@/lib/api/coordinator';

export type DivisionMethod = 'by_batches' | 'by_duration' | 'manual';

export interface BatchLane {
  id: string;
  batchNumber: number;
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

function createLaneId(batchNumber: number) {
  return `batch-${batchNumber}`;
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
  groupCount,
}: {
  startTime: string;
  endTime: string;
  groupCount: number;
}): Omit<BatchLane, 'groupIds'>[] {
  const laneCount = Math.max(1, groupCount);
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
    let lanes = buildLanesForByBatches({ startTime, endTime, batchCount: safeBatchCount });
    const remainderGroups = safeBatchCount > 0 ? groupCount % safeBatchCount : groupCount;
    if (remainderGroups > 0 && lanes.length > 0) {
      const slotDuration = getTimeframeMinutes(lanes[0].startTime, lanes[0].endTime) || 60;
      lanes = appendRemainderLane(lanes, slotDuration);
    }
    return lanes;
  }

  if (method === 'by_duration') {
    const safeDuration = Math.max(1, Math.floor(durationMinutes));
    let lanes = buildLanesForByDuration({ startTime, endTime, durationMinutes: safeDuration });
    const fullBatchCount = lanes.length;
    const remainderGroups = fullBatchCount > 0 ? groupCount % fullBatchCount : groupCount;
    if (remainderGroups > 0) {
      lanes = appendRemainderLane(lanes, safeDuration);
    }
    return lanes;
  }

  return buildLanesForManual({ startTime, endTime, groupCount });
}

export function createEmptyLanes(templates: Omit<BatchLane, 'groupIds'>[]): BatchLane[] {
  return templates.map((lane) => ({ ...lane, groupIds: [] }));
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
    const durationPerBatch = totalMinutes > 0 ? Math.floor(totalMinutes / safeBatchCount) : 0;
    const groupsPerBatch = safeBatchCount > 0 ? Math.floor(groupCount / safeBatchCount) : 0;
    const remainderGroups = safeBatchCount > 0 ? groupCount % safeBatchCount : groupCount;
    return {
      batchCount: safeBatchCount + (remainderGroups > 0 ? 1 : 0),
      durationPerBatchMinutes: durationPerBatch,
      groupsPerBatch,
      remainderBatchCount: remainderGroups > 0 ? 1 : 0,
      remainderGroups,
    };
  }

  if (method === 'by_duration') {
    const safeDuration = Math.max(1, Math.floor(durationMinutes));
    const fullBatchCount = Math.max(1, Math.floor(totalMinutes / safeDuration));
    const groupsPerBatch = fullBatchCount > 0 ? Math.floor(groupCount / fullBatchCount) : 0;
    const remainderGroups = fullBatchCount > 0 ? groupCount % fullBatchCount : groupCount;
    return {
      batchCount: fullBatchCount + (remainderGroups > 0 ? 1 : 0),
      durationPerBatchMinutes: safeDuration,
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
    nextLanes.forEach((lane) => {
      if (lane.id === target.laneId) {
        lane.groupIds = [...lane.groupIds, groupId];
      }
    });
  }

  return { lanes: nextLanes, unassignedIds: nextUnassigned };
}
