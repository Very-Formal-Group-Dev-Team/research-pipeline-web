'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { FiChevronDown, FiChevronRight, FiFolder, FiUser } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProjectsByAdviser,
  getInstitutionProjects,
  type AdviserWithProjects,
  type InstitutionProject,
} from '@/lib/api/coordinator';
import Button from '@/components/Button';

type BadgeVariant = 'success' | 'warning' | 'error' | 'default' | 'primary';

function projectStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case 'completed': return { label: 'Completed', variant: 'success' };
    case 'in_progress': return { label: 'In Progress', variant: 'primary' };
    case 'pending': return { label: 'Pending', variant: 'warning' };
    case 'rejected': return { label: 'Rejected', variant: 'error' };
    default: return { label: status, variant: 'default' };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CoordinatorProjectsPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [tab, setTab] = useState<'by-adviser' | 'all'>('by-adviser');
  const [advisers, setAdvisers] = useState<AdviserWithProjects[]>([]);
  const [allProjects, setAllProjects] = useState<InstitutionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  function toggleExpand(adviserId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(adviserId)) next.delete(adviserId);
      else next.add(adviserId);
      return next;
    });
  }

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">All Projects</h1>
          <p className="text-neutral-600 mt-1">View all projects across your institution</p>
        </div>

        <div className="flex gap-2 border-b border-neutral-200 pb-0">
          <button
            onClick={() => setTab('by-adviser')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'by-adviser'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            By Adviser
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'all'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            All Projects
            {allProjects.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                {allProjects.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : tab === 'by-adviser' ? (
          advisers.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-neutral-500">
                No advisers or projects found in your institution.
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {advisers.map((adviser) => {
                const isOpen = expanded.has(adviser.id);
                return (
                  <Card key={adviser.id} padding="none">
                    <button
                      onClick={() => toggleExpand(adviser.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left"
                    >
                      {isOpen ? <FiChevronDown className="text-neutral-400" /> : <FiChevronRight className="text-neutral-400" />}
                      <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {adviser.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-800 truncate">{adviser.full_name}</p>
                        <p className="text-xs text-neutral-500 truncate">{adviser.email}</p>
                      </div>
                      <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                        {adviser.projects.length} project{adviser.projects.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-neutral-100">
                        {adviser.projects.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-400 italic">No projects assigned</p>
                        ) : (
                          <div className="divide-y divide-neutral-50">
                            {adviser.projects.map((proj) => {
                              const badge = projectStatusBadge(proj.status);
                              return (
                                <div key={proj.id} className="px-4 py-3 pl-14 flex items-center gap-3">
                                  <FiFolder className="text-neutral-300 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-800 truncate">{proj.title}</p>
                                    <p className="text-xs text-neutral-500">{proj.project_code} &middot; {formatDate(proj.created_at)}</p>
                                  </div>
                                  <Badge variant={badge.variant}>{badge.label}</Badge>
                                  {/*Add the booking button here, must match sizes of the card it's in.*/}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )
        ) : allProjects.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              No projects found in your institution.
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card padding="none">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-600">Title</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Code</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Course</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Status</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {allProjects.map((project) => {
                    const badge = projectStatusBadge(project.status);
                    return (
                      <tr key={project.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-800 truncate max-w-xs">{project.title}</td>
                        <td className="px-4 py-3 text-neutral-600">{project.project_code}</td>
                        <td className="px-4 py-3 text-neutral-600">{project.course_name ? `${project.course_name} (${project.course_code})` : '—'}</td>
                        <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                        <td className="px-4 py-3 text-neutral-500">{formatDate(project.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
