'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import EmptyState from '@/components/layout/EmptyState';
import StatusIcon from '@/components/StatusIcon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import { FiFolder, FiPlus, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getMyProjects,
  getMyInvitations,
  respondToInvitation,
  type Project,
  type Invitation,
} from '@/lib/api/projects';

export default function StudentProjectsPage() {
  const router = useRouter();
  const { user, isLoading: profileLoading, handleLogout } = useDashboardUser('Student');
  const [projects, setProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = async () => {
    const [projRes, invRes] = await Promise.all([getMyProjects(), getMyInvitations()]);
    setProjects(
      (projRes.data || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
    setInvitations(invRes.data || []);
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setRespondingId(invitationId);
    await respondToInvitation(invitationId, accept);
    await refreshProjects();
    setRespondingId(null);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [projRes, invRes] = await Promise.all([getMyProjects(), getMyInvitations()]);
      if (!cancelled) {
        setProjects(
          (projRes.data || []).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
        setInvitations(invRes.data || []);
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(() => {
      if (!cancelled) refreshProjects();
    }, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const isLoading = profileLoading || loading;

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">My Projects</h1>
            <p className="text-neutral-600 mt-1">Manage your research projects</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<FiPlus />}
            onClick={() => router.push('/student/projects/create')}
          >
            New Project
          </Button>
        </div>

        {/* Pending Invitations */}
        {!isLoading && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                You have {invitations.length} pending project {invitations.length === 1 ? 'invitation' : 'invitations'}
              </CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 p-3 border border-primary-200 bg-primary-50/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 truncate">
                      {inv.project_title}
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Invited by {inv.invited_by_name || inv.invited_by_email} &middot; Role: <span className="capitalize">{inv.role === 'member' ? 'collaborator' : inv.role}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={respondingId === inv.id}
                      onClick={() => handleRespond(inv.id, true)}
                    >
                      <FiCheck className="mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={respondingId === inv.id}
                      onClick={() => handleRespond(inv.id, false)}
                    >
                      <FiX className="mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading projects...</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                hover 
                onClick={() => router.push(`/student/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FiFolder className="text-2xl text-primary-500" />
                    <div className="flex items-center gap-2">
                      {project.member_role && (
                        <Badge
                          variant={project.member_role === 'adviser' ? 'success' : 'primary'}
                          size="sm"
                        >
                          {project.member_role === 'adviser' ? 'adviser' :
                           project.member_role === 'leader' ? 'leader' : 'contributor'}
                        </Badge>
                      )}
                      <StatusIcon status={project.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>
                  {project.description || 'No description'}
                </CardDescription>
                <div className="mt-4 space-y-2 text-sm text-neutral-600">
                  <div>Type: {project.project_type}</div>
                  <div>Standard: {project.paper_standard}</div>
                  <div className="flex items-center gap-1">
                    <FiClock className="text-neutral-500" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiFolder />}
              title="No projects yet"
              description="Get started by creating your first research project or wait for an adviser invitation."
              action={{
                label: 'Create Project',
                onClick: () => router.push('/student/projects/create'),
              }}
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
