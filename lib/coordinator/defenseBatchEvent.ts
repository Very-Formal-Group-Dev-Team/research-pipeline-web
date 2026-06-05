import type { Course, CourseGroup, Defense } from '@/lib/api/coordinator';
import type { BatchLane } from '@/lib/coordinator/defenseBatchPlanner';
import { formatMinutesToTime, parseTimeToMinutes } from '@/lib/coordinator/defenseBatchPlanner';
import type { BookedDefenseSummary } from '@/lib/api/coordinator';
import type { DefenseBatchSession } from '@/lib/coordinator/defenseBatchSession';

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function parseDefenseDateTime(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(String(iso).replace(/Z$/i, ''));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function defenseToScheduleFields(defense: Defense) {
  const start = parseDefenseDateTime(defense.start_time);
  const end = parseDefenseDateTime(defense.end_time || defense.start_time);
  return {
    date: start ? `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}` : '',
    startTime: start ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : '',
    endTime: end ? `${pad2(end.getHours())}:${pad2(end.getMinutes())}` : '',
  };
}

export function buildDefenseIdsByProjectId(
  booked: BookedDefenseSummary[],
): Record<string, string> {
  return Object.fromEntries(booked.map((item) => [item.project_id, item.id]));
}

export function findRelatedDefenses(anchor: Defense, defenses: Defense[]): Defense[] {
  const anchorSchedule = defenseToScheduleFields(anchor);
  const anchorLocation = (anchor.venue || anchor.location || '').trim();
  const anchorCourseId = anchor.course_id || null;

  return defenses.filter((defense) => {
    if (defense.id === anchor.id) return true;
    if (defense.defense_type !== anchor.defense_type) return false;
    if (defense.status !== anchor.status) return false;
    if ((defense.modality || 'Online') !== (anchor.modality || 'Online')) return false;
    if ((defense.venue || defense.location || '').trim() !== anchorLocation) return false;

    const schedule = defenseToScheduleFields(defense);
    if (schedule.date !== anchorSchedule.date) return false;

    if (anchorCourseId) {
      return (defense.course_id || null) === anchorCourseId;
    }

    return true;
  });
}

export function inferEventTimeframe(defenses: Defense[]) {
  const starts = defenses
    .map((defense) => parseDefenseDateTime(defense.start_time))
    .filter((value): value is Date => value !== null);
  const ends = defenses
    .map((defense) => parseDefenseDateTime(defense.end_time || defense.start_time))
    .filter((value): value is Date => value !== null);

  if (!starts.length || !ends.length) {
    const fallback = defenseToScheduleFields(defenses[0]);
    return {
      date: fallback.date,
      startTime: fallback.startTime,
      endTime: fallback.endTime,
    };
  }

  const minStart = new Date(Math.min(...starts.map((date) => date.getTime())));
  const maxEnd = new Date(Math.max(...ends.map((date) => date.getTime())));

  return {
    date: `${minStart.getFullYear()}-${pad2(minStart.getMonth() + 1)}-${pad2(minStart.getDate())}`,
    startTime: `${pad2(minStart.getHours())}:${pad2(minStart.getMinutes())}`,
    endTime: `${pad2(maxEnd.getHours())}:${pad2(maxEnd.getMinutes())}`,
  };
}

export function inferInitialLanesFromDefenses(defenses: Defense[]): BatchLane[] {
  const slotMap = new Map<string, BatchLane>();

  defenses.forEach((defense) => {
    const schedule = defenseToScheduleFields(defense);
    const slotKey = `${schedule.startTime}-${schedule.endTime}`;
    const existing = slotMap.get(slotKey);

    if (existing) {
      existing.groupIds.push(defense.project_id);
      return;
    }

    slotMap.set(slotKey, {
      id: `batch-${slotMap.size + 1}`,
      batchNumber: slotMap.size + 1,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      groupIds: [defense.project_id],
    });
  });

  return Array.from(slotMap.values()).map((lane, index) => ({
    ...lane,
    batchNumber: index + 1,
    id: `batch-${index + 1}`,
  }));
}

export function buildDefenseBatchSessionFromDefenses({
  anchor,
  relatedDefenses,
  courses,
  courseGroups,
}: {
  anchor: Defense;
  relatedDefenses: Defense[];
  courses: Course[];
  courseGroups: CourseGroup[];
}): DefenseBatchSession | null {
  const courseId = anchor.course_id || courseGroups[0]?.id;
  if (!courseId) return null;

  const course = courses.find((item) => item.id === courseId);
  const timeframe = inferEventTimeframe(relatedDefenses);
  const eventGroups: CourseGroup[] = relatedDefenses.map((defense) => ({
    id: defense.project_id,
    title: defense.project_title,
    project_code: defense.project_code,
  }));

  return {
    mode: 'edit',
    sourceDefenseId: anchor.id,
    draft: {
      courseId,
      courseName: anchor.course_name || (course ? `${course.course_name} (${course.code})` : 'Selected course'),
      defenseType: anchor.defense_type as DefenseBatchSession['draft']['defenseType'],
      date: timeframe.date,
      startTime: timeframe.startTime,
      endTime: timeframe.endTime,
      location: (anchor.venue || anchor.location || '').trim(),
      venue: anchor.venue || '',
      modality: anchor.modality || 'Online',
      rubricId: anchor.rubric_id || '',
      panelistIds: (anchor.panelist_ids || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    },
    eventGroups,
    courseGroups: courseGroups.length ? courseGroups : eventGroups,
    defenseIdsByProjectId: Object.fromEntries(relatedDefenses.map((defense) => [defense.project_id, defense.id])),
    initialLaneAssignments: inferInitialLanesFromDefenses(relatedDefenses),
  };
}

export function slotKeyFromLane(lane: Pick<BatchLane, 'startTime' | 'endTime'>) {
  return `${lane.startTime}-${lane.endTime}`;
}

export function hasDistinctBatchSlots(lanes: BatchLane[]) {
  const keys = new Set(lanes.map(slotKeyFromLane));
  return keys.size > 1 || lanes.some((lane) => lane.groupIds.length > 0);
}

export function minutesBetweenTimes(startTime: string, endTime: string) {
  return Math.max(0, parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime));
}

export function addMinutesToTimeValue(time: string, minutes: number) {
  return formatMinutesToTime(parseTimeToMinutes(time) + minutes);
}
