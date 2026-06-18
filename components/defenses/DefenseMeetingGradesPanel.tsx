'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiLoader, FiSearch } from 'react-icons/fi';

import {
  getDefenseMeetingGrades,
  type DefenseMeetingGradeProject,
  type DefenseMeetingGradesResponse,
} from '@/lib/api/defenses';

interface DefenseMeetingGradesPanelProps {
  scheduleId: string;
  className?: string;
  expanded?: boolean;
}

function formatScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}%`;
}

function ProjectGradeCard({ project }: { project: DefenseMeetingGradeProject }) {
  return (
    <article className="rounded-md border border-neutral-300 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-primary-700">{project.project_title}</h3>
          <p className="mt-0.5 text-sm text-neutral-600">{project.project_code}</p>
        </div>
        <div className="rounded-lg bg-primary-50 px-3 py-2 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-700">Overall grade</p>
          <p className="text-xl font-bold text-primary-800">{formatScore(project.overall_score)}</p>
        </div>
      </div>

      {project.criterion_summaries.length ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Criterion averages
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {project.criterion_summaries.map((criterion) => (
              <div
                key={criterion.criterion_id}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
              >
                <p className="text-sm font-medium text-neutral-800">{criterion.criterion_name}</p>
                <p className="text-xs text-neutral-500">
                  Avg {criterion.average_score != null ? criterion.average_score.toFixed(2) : '—'} /{' '}
                  {criterion.max_score}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {project.panelists.length ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Panel feedback</p>
          {project.panelists.map((panelist) => (
            <div
              key={panelist.panelist_id}
              className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-neutral-800">{panelist.panelist_name}</p>
                <p className="text-xs text-neutral-500">Total {formatScore(panelist.total_score)}</p>
              </div>

              {panelist.scores.length ? (
                <div className="space-y-2">
                  {panelist.scores.map((score) => (
                    <div key={`${panelist.panelist_id}-${score.criterion_id}`}>
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium">{score.criterion_name}:</span> {score.score} /{' '}
                        {score.max_score}
                      </p>
                      {score.comments ? (
                        <p className="mt-0.5 text-xs text-neutral-500">{score.comments}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No rubric scores recorded yet.</p>
              )}

              {panelist.notes ? (
                <div className="mt-2 border-t border-neutral-200 pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{panelist.notes}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No panel evaluations have been saved for this project yet.</p>
      )}
    </article>
  );
}

export default function DefenseMeetingGradesPanel({
  scheduleId,
  className = '',
  expanded = false,
}: DefenseMeetingGradesPanelProps) {
  const [grades, setGrades] = useState<DefenseMeetingGradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadGrades() {
      setLoading(true);
      setError(null);
      const res = await getDefenseMeetingGrades(scheduleId);
      if (cancelled) return;

      if (res.error || !res.data) {
        setError(res.error || 'Failed to load defense grades');
        setGrades(null);
      } else {
        setGrades(res.data);
      }
      setLoading(false);
    }

    void loadGrades();
    return () => {
      cancelled = true;
    };
  }, [scheduleId]);

  const filteredProjects = useMemo(() => {
    const projects = grades?.projects || [];
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter(
      (project) =>
        project.project_title.toLowerCase().includes(query)
        || project.project_code.toLowerCase().includes(query),
    );
  }, [grades?.projects, search]);

  const containerClass = expanded
    ? `py-3 ${className}`
    : `min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 ${className}`;

  if (loading) {
    return (
      <div className={`flex items-center gap-2 py-8 text-sm text-neutral-500 ${className}`}>
        <FiLoader className="animate-spin" aria-hidden />
        Loading defense grades...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 ${className}`}>
        {error}
      </div>
    );
  }

  if (!grades?.projects.length) {
    return (
      <div className={`py-8 text-center text-sm text-neutral-500 ${className}`}>
        No defense grades have been published for this meeting yet.
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700">
          Search projects
          <div className="relative mt-1">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project title or code"
              className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 outline-none focus:border-primary-400"
            />
          </div>
        </label>
        <p className="mt-2 text-xs text-neutral-500">
          {grades.rubric?.name
            ? `Rubric: ${grades.rubric.name}. Grades for all projects in this defense meeting are listed below.`
            : 'Grades for all projects in this defense meeting are listed below.'}
        </p>
      </div>

      {filteredProjects.length ? (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectGradeCard key={project.defense_id} project={project} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-neutral-500">
          No projects match your search.
        </p>
      )}
    </div>
  );
}
