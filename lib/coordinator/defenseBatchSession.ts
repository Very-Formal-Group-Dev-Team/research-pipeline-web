import type { CourseGroup } from '@/lib/api/coordinator';

export interface DefenseBatchPlannerDraft {
  courseId: string;
  courseName: string;
  defenseType: 'proposal' | 'midterm' | 'final';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  venue: string;
  modality: string;
  rubricId: string;
  panelistIds: string[];
}

import type { BookedDefenseSummary } from '@/lib/api/coordinator';

export type { BookedDefenseSummary };

export interface DefenseBatchSession {
  draft: DefenseBatchPlannerDraft;
  eventGroups: CourseGroup[];
  courseGroups: CourseGroup[];
  mode?: 'create' | 'edit';
  sourceDefenseId?: string;
  defenseIdsByProjectId?: Record<string, string>;
  initialLaneAssignments?: import('@/lib/coordinator/defenseBatchPlanner').BatchLane[];
}

const SESSION_KEY = 'coordinator-defense-batch-session';

export function saveDefenseBatchSession(session: DefenseBatchSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadDefenseBatchSession(): DefenseBatchSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DefenseBatchSession;
  } catch {
    return null;
  }
}

export function clearDefenseBatchSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}
