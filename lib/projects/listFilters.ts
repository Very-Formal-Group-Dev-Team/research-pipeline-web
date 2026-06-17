import {
  getProjectStageStepIndex,
  normalizeProjectStage,
  PROJECT_STAGE_STEPPER_ORDER,
} from '@/lib/utils/projectStage';

export interface ProjectListFilterable {
  title: string;
  status: string;
  created_at: string;
  course_code?: string | null;
  program?: string | null;
}

export type ProjectSortBy = 'date' | 'title' | 'stage' | 'adviser';
export type ProjectSortDirection = 'asc' | 'desc';

export interface ProjectListFilterState {
  searchQuery: string;
  course: string;
  program: string;
  sortBy: ProjectSortBy;
  sortDirection: ProjectSortDirection;
}

export const DEFAULT_PROJECT_LIST_FILTERS: ProjectListFilterState = {
  searchQuery: '',
  course: '',
  program: '',
  sortBy: 'date',
  sortDirection: 'desc',
};

function applyDirection(value: number, direction: ProjectSortDirection): number {
  return direction === 'asc' ? value : -value;
}

function stageSortIndex(status?: string | null): number {
  const normalized = normalizeProjectStage(status);
  if (normalized === 'rejected') {
    return PROJECT_STAGE_STEPPER_ORDER.length;
  }
  const index = getProjectStageStepIndex(status || '');
  return index < 0 ? PROJECT_STAGE_STEPPER_ORDER.length + 1 : index;
}

function uniqueSortedLabels(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function getProjectCourseOptions(projects: ProjectListFilterable[]): string[] {
  return uniqueSortedLabels(projects.map((project) => project.course_code));
}

export function getProjectProgramOptions(projects: ProjectListFilterable[]): string[] {
  return uniqueSortedLabels(projects.map((project) => project.program));
}

export interface FilterAndSortProjectsOptions<T extends ProjectListFilterable> {
  getAdviserName?: (project: T) => string;
}

export function filterAndSortProjects<T extends ProjectListFilterable>(
  projects: T[],
  filters: ProjectListFilterState,
  options?: FilterAndSortProjectsOptions<T>,
): T[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = projects.filter((project) => {
    if (query && !project.title.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.course && (project.course_code?.trim() || '') !== filters.course) {
      return false;
    }
    if (filters.program && (project.program?.trim() || '') !== filters.program) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sortBy === 'title') {
      return applyDirection(
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
        filters.sortDirection,
      );
    }
    if (filters.sortBy === 'stage') {
      const stageDiff = stageSortIndex(a.status) - stageSortIndex(b.status);
      if (stageDiff !== 0) {
        return applyDirection(stageDiff, filters.sortDirection);
      }
      return applyDirection(
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
        filters.sortDirection,
      );
    }
    if (filters.sortBy === 'adviser') {
      const getAdviserName = options?.getAdviserName ?? (() => '');
      const adviserDiff = getAdviserName(a).localeCompare(getAdviserName(b), undefined, {
        sensitivity: 'base',
      });
      if (adviserDiff !== 0) {
        return applyDirection(adviserDiff, filters.sortDirection);
      }
      return applyDirection(
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
        filters.sortDirection,
      );
    }
    return applyDirection(
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      filters.sortDirection,
    );
  });
}

export function hasActiveProjectListFilters(filters: ProjectListFilterState): boolean {
  return Boolean(filters.searchQuery.trim() || filters.course || filters.program);
}

export function isProjectListFiltersDirty(filters: ProjectListFilterState): boolean {
  return (
    filters.searchQuery.trim() !== DEFAULT_PROJECT_LIST_FILTERS.searchQuery ||
    filters.course !== DEFAULT_PROJECT_LIST_FILTERS.course ||
    filters.program !== DEFAULT_PROJECT_LIST_FILTERS.program ||
    filters.sortBy !== DEFAULT_PROJECT_LIST_FILTERS.sortBy ||
    filters.sortDirection !== DEFAULT_PROJECT_LIST_FILTERS.sortDirection
  );
}
