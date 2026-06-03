export type DefenseSortBy = 'time' | 'status';

const DEFENSE_STATUS_SORT_ORDER: Record<string, number> = {
  pending: 0,
  moved: 1,
  approved: 2,
  rejected: 3,
  scheduled: 4,
  completed: 5,
  cancelled: 6,
};

export function sortDefenses<
  T extends { status: string; start_time?: string | null; scheduled_at?: string | null },
>(defenses: T[], sortBy: DefenseSortBy): T[] {
  return [...defenses].sort((a, b) => {
    if (sortBy === 'status') {
      return (DEFENSE_STATUS_SORT_ORDER[a.status] ?? 9) - (DEFENSE_STATUS_SORT_ORDER[b.status] ?? 9);
    }
    const aStart = (a.start_time || a.scheduled_at || '').replace(/Z$/i, '');
    const bStart = (b.start_time || b.scheduled_at || '').replace(/Z$/i, '');
    return new Date(aStart).getTime() - new Date(bStart).getTime();
  });
}
