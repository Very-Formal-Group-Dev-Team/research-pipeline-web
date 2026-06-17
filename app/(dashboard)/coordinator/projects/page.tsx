'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/layout/EmptyState';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProjectListToolbar from '@/components/projects/ProjectListToolbar';
import CoordinatorProjectsListSkeleton from '@/components/skeletons/CoordinatorProjectsListSkeleton';
import { FiFolder } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProjectsByAdviser,
  getInstitutionProjects,
  type AdviserWithProjects,
  type InstitutionProject,
} from '@/lib/api/coordinator';
import {
  DEFAULT_PROJECT_LIST_FILTERS,
  filterAndSortProjects,
  getProjectCourseOptions,
  getProjectProgramOptions,
  isProjectListFiltersDirty,
  type ProjectListFilterState,
  type ProjectSortBy,
} from '@/lib/projects/listFilters';
import {
  formatProjectStageLabel,
  projectStageBadgeVariant,
} from '@/lib/utils/projectStage';
import type { BadgeVariant } from '@/components/ui/Badge';

const COORDINATOR_SORT_OPTIONS: { value: ProjectSortBy; label: string; shortLabel: string }[] = [
  { value: 'date', label: 'Date', shortLabel: 'Date' },
  { value: 'title', label: 'Alphabetical', shortLabel: 'A–Z' },
  { value: 'stage', label: 'Research stage', shortLabel: 'Stage' },
  { value: 'adviser', label: 'Adviser', shortLabel: 'Adviser' },
];

function projectStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  return {
    label: formatProjectStageLabel(status),
    variant: projectStageBadgeVariant(status),
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatProjectCourse(project: InstitutionProject): string {
  const entered = project.course_label?.trim();
  if (entered) return entered;
  if (project.course_name) {
    return project.course_code
      ? `${project.course_name} (${project.course_code})`
      : project.course_name;
  }
  return '—';
}

export default function CoordinatorProjectsPage() {
  const router = useRouter();
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [advisers, setAdvisers] = useState<AdviserWithProjects[]>([]);
  const [allProjects, setAllProjects] = useState<InstitutionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilters, setListFilters] = useState<ProjectListFilterState>(DEFAULT_PROJECT_LIST_FILTERS);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [advRes, projRes] = await Promise.all([
        getProjectsByAdviser(),
        getInstitutionProjects(),
      ]);
      if (!cancelled) {
        if (advRes.data) setAdvisers(advRes.data);
        if (projRes.data) setAllProjects(projRes.data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const adviserNameByProjectId = useMemo(() => {
    const map = new Map<string, string>();
    for (const adviser of advisers) {
      const name = adviser.full_name?.trim() || adviser.email?.trim() || '';
      for (const project of adviser.projects) {
        map.set(project.id, name);
      }
    }
    return map;
  }, [advisers]);

  const courseOptions = useMemo(() => getProjectCourseOptions(allProjects), [allProjects]);
  const programOptions = useMemo(() => getProjectProgramOptions(allProjects), [allProjects]);
  const filteredProjects = useMemo(
    () =>
      filterAndSortProjects(allProjects, listFilters, {
        getAdviserName: (project) => adviserNameByProjectId.get(project.id) || '',
      }),
    [allProjects, listFilters, adviserNameByProjectId],
  );
  const filtersActive = isProjectListFiltersDirty(listFilters);
  const hasNoMatches = allProjects.length > 0 && filteredProjects.length === 0;

  const noMatchingProjectsState = (
    <Card>
      <EmptyState
        icon={<FiFolder />}
        title="No matching projects"
        description={
          filtersActive
            ? 'Try adjusting your search, course, or program filters.'
            : 'No projects match the current sort and filter settings.'
        }
        action={
          filtersActive
            ? {
                label: 'Reset filters',
                onClick: () => setListFilters(DEFAULT_PROJECT_LIST_FILTERS),
              }
            : undefined
        }
      />
    </Card>
  );

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">All Projects</h1>
            <p className="text-neutral-600 mt-1">
              Projects in your institution
            </p>
          </div>

          {!loading && allProjects.length > 0 && (
            <ProjectListToolbar
              filters={listFilters}
              courseOptions={courseOptions}
              programOptions={programOptions}
              onFiltersChange={setListFilters}
              sortOptions={COORDINATOR_SORT_OPTIONS}
            />
          )}
        </div>

        {loading ? (
          <CoordinatorProjectsListSkeleton />
        ) : allProjects.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              No projects found under your assigned advisers.
            </div>
          </Card>
        ) : hasNoMatches ? (
          noMatchingProjectsState
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-full w-max text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr className="bg-neutral-50">
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6 font-medium text-neutral-600">
                      Title
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6 font-medium text-neutral-600">
                      Code
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6 font-medium text-neutral-600">
                      Adviser
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6 font-medium text-neutral-600">
                      Course
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6 font-medium text-neutral-600">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6 font-medium text-neutral-600">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {filteredProjects.map((project) => {
                    const badge = projectStatusBadge(project.status);
                    const adviserName = adviserNameByProjectId.get(project.id);
                    return (
                      <tr
                        key={project.id}
                        className="bg-white hover:bg-neutral-50 cursor-pointer"
                        onClick={() => router.push(`/coordinator/projects/${project.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            router.push(`/coordinator/projects/${project.id}`);
                          }
                        }}
                        tabIndex={0}
                        role="link"
                        aria-label={`View project ${project.title}`}
                      >
                        <td className="min-w-[10rem] max-w-xs px-4 py-3 sm:px-6 font-medium text-neutral-800">
                          <span className="line-clamp-2">{project.title}</span>
                        </td>
                        <td
                          className="max-w-[11rem] truncate px-4 py-3 font-mono text-xs text-neutral-600 sm:px-6 sm:text-sm sm:font-sans"
                          title={project.project_code}
                        >
                          {project.project_code}
                        </td>
                        <td className="max-w-[12rem] truncate px-4 py-3 sm:px-6 text-neutral-600" title={adviserName}>
                          {adviserName || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-neutral-600">
                          {formatProjectCourse(project)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-neutral-500">
                          {formatDate(project.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
