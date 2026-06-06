export type DefenseSortBy = 'time' | 'stage' | 'status';
export type DefenseSortDirection = 'asc' | 'desc';

export interface DefenseSortState {
  sortBy: DefenseSortBy;
  direction: DefenseSortDirection;
}

const DEFENSE_STATUS_SORT_ORDER: Record<string, number> = {
  pending: 0,
  moved: 1,
  scheduled: 2,
  approved: 3,
  completed: 4,
  rejected: 5,
  cancelled: 6,
};

const DEFENSE_TYPE_SORT_ORDER: Record<string, number> = {
  proposal: 0,
  midterm: 1,
  final: 2,
};

const INSTITUTION_EVENT_STATUS_SORT_ORDER: Record<string, number> = {
  scheduled: 0,
  completed: 1,
  cancelled: 2,
};

function applyDirection(value: number, direction: DefenseSortDirection): number {
  return direction === 'asc' ? value : -value;
}

function compareStartTime(
  a: { start_time?: string | null; scheduled_at?: string | null },
  b: { start_time?: string | null; scheduled_at?: string | null },
) {
  const aStart = (a.start_time || a.scheduled_at || '').replace(/Z$/i, '');
  const bStart = (b.start_time || b.scheduled_at || '').replace(/Z$/i, '');
  return new Date(aStart).getTime() - new Date(bStart).getTime();
}

export function sortDefenses<
  T extends {
    status: string;
    defense_type?: string | null;
    start_time?: string | null;
    scheduled_at?: string | null;
  },
>(defenses: T[], sortBy: DefenseSortBy, direction: DefenseSortDirection = 'asc'): T[] {
  return [...defenses].sort((a, b) => {
    if (sortBy === 'status') {
      return applyDirection(
        (DEFENSE_STATUS_SORT_ORDER[a.status] ?? 9) - (DEFENSE_STATUS_SORT_ORDER[b.status] ?? 9),
        direction,
      );
    }
    if (sortBy === 'stage') {
      const aType = (a.defense_type || '').toLowerCase();
      const bType = (b.defense_type || '').toLowerCase();
      const stageDiff =
        (DEFENSE_TYPE_SORT_ORDER[aType] ?? 9) - (DEFENSE_TYPE_SORT_ORDER[bType] ?? 9);
      if (stageDiff !== 0) return applyDirection(stageDiff, direction);
      return applyDirection(compareStartTime(a, b), direction);
    }
    return applyDirection(compareStartTime(a, b), direction);
  });
}

export function sortInstitutionEvents<
  T extends { status: string; start_time?: string | null },
>(
  events: T[],
  sortBy: Extract<DefenseSortBy, 'time' | 'status'>,
  direction: DefenseSortDirection = 'asc',
): T[] {
  return [...events].sort((a, b) => {
    if (sortBy === 'status') {
      return applyDirection(
        (INSTITUTION_EVENT_STATUS_SORT_ORDER[a.status] ?? 9) -
          (INSTITUTION_EVENT_STATUS_SORT_ORDER[b.status] ?? 9),
        direction,
      );
    }
    return applyDirection(compareStartTime(a, b), direction);
  });
}
