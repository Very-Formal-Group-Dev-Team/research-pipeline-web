'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';
import EmptyState from '@/components/layout/EmptyState';
import StatusIcon from '@/components/StatusIcon';
import { FiFolder } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { getAdvisedProjects, type Project } from '@/lib/api/projects';
import { formatProjectCardDate, formatProjectCardMeta } from '@/lib/utils/projectDisplay';

export default function AdviserAdviseesPage() {
  const router = useRouter();
  const { user, handleLogout } = useDashboardUser('Adviser');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getAdvisedProjects();
        if (res.data) {
          setProjects([...res.data].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ));
        }
      } catch (err) {
        console.error('Failed to fetch advised projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">My Advisees</h1>
            <p className="text-neutral-600 mt-1">Projects you are advising</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading projects...</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const abstractText =
                project.description?.trim() || project.abstract?.trim() || '';

              return (
                <Card
                  key={project.id}
                  hover
                  onClick={() => router.push(`/adviser/advisees/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <FiFolder className="text-2xl text-primary-500" />
                    <StatusIcon status={project.status} />
                  </div>
                  <CardTitle className="mt-4 line-clamp-3">{project.title}</CardTitle>
                  <CardDescription
                    lines={2}
                    uniformHeight
                    className={`italic ${abstractText ? '' : 'text-neutral-500/60'}`}
                  >
                    {abstractText || 'No abstract available'}
                  </CardDescription>
                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-300 pt-4 text-sm text-neutral-600">
                    <div className="min-w-0 flex-1">
                      <span>{formatProjectCardMeta(project)}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      {formatProjectCardDate(project.created_at)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FiFolder className="text-6xl" />}
            title="No Projects Yet"
            description="You haven't joined any projects as an adviser yet. Use a project code to join a project."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
