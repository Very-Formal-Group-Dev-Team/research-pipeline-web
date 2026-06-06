'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import EmptyState from '@/components/layout/EmptyState';
import StatusIcon from '@/components/StatusIcon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiFolder, FiPlus, FiCheck, FiClock, FiTag, FiUsers, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProjectMembers,
  getMyProjects,
  getMyInvitations,
  respondToInvitation,
  type Project,
  type Invitation,
  type ProjectMember,
} from '@/lib/api/projects';
import { formatProjectCardDate, formatProjectCardMeta } from '@/lib/utils/projectDisplay';

const ABSTRACT_PREVIEW_MAX_CHARS = 92;

function projectAbstract(project: Project): string {
  return project.description?.trim() || project.abstract?.trim() || '';
}

function buildAbstractPreview(text: string): string {
  if (text.length <= ABSTRACT_PREVIEW_MAX_CHARS) return text;
  return `${text.slice(0, ABSTRACT_PREVIEW_MAX_CHARS).trimEnd()}...`;
}

function formatUpdatedDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMemberRole(role?: string): string {
  if (!role) return 'Member';
  const normalized = role.trim().toLowerCase();
  if (!normalized) return 'Member';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function StudentProjectsPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { user, isLoading: profileLoading, handleLogout } = useDashboardUser('Student');
  const [projects, setProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<Project | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<ProjectMember[]>([]);
  const [expandedMembersLoading, setExpandedMembersLoading] = useState(false);
  const [expandedMembersError, setExpandedMembersError] = useState<string | null>(null);
  const expandedMembersRequestRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!expandedProject) return;
    const next = projects.find((project) => project.id === expandedProject.id);
    if (next) {
      setExpandedProject(next);
    }
  }, [projects, expandedProject]);

  const closeExpandedProject = () => {
    expandedMembersRequestRef.current = null;
    setExpandedProject(null);
    setExpandedMembers([]);
    setExpandedMembersLoading(false);
    setExpandedMembersError(null);
  };

  useEffect(() => {
    if (!expandedProject) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeExpandedProject();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [expandedProject]);

  const openExpandedProject = async (project: Project) => {
    expandedMembersRequestRef.current = project.id;
    setExpandedProject(project);
    setExpandedMembers([]);
    setExpandedMembersError(null);
    setExpandedMembersLoading(true);

    const membersRes = await getProjectMembers(project.id);
    if (expandedMembersRequestRef.current !== project.id) {
      return;
    }

    if (membersRes.error) {
      setExpandedMembersError(membersRes.error || 'Failed to load team members.');
      setExpandedMembersLoading(false);
      return;
    }

    setExpandedMembers(membersRes.data || []);
    setExpandedMembersLoading(false);
  };

  const isLoading = profileLoading || loading;

  const modalTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.78 };

  const expandedProjectOverlay = (
    <AnimatePresence>
      {expandedProject && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
          onClick={closeExpandedProject}
        >
          <motion.div
            className="w-full max-w-3xl"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 22, scale: 0.95 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
            transition={modalTransition}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${expandedProject.title} details`}
          >
            <Card
              padding="none"
              shadow="hard"
              hoverShadow={false}
              className="overflow-hidden rounded-md border border-neutral-300"
            >
              <div className="flex items-start justify-between gap-4 border-b border-neutral-300 bg-neutral-50 px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary-600">Project overview</p>
                  <h2 className="mt-1 font-serif text-2xl text-primary-700 break-words">{expandedProject.title}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {expandedProject.member_role && (
                      <Badge
                        variant={expandedProject.member_role === 'adviser' ? 'success' : 'primary'}
                        size="sm"
                        className="capitalize"
                      >
                        {expandedProject.member_role === 'adviser' ? 'adviser' :
                         expandedProject.member_role === 'leader' ? 'leader' : 'contributor'}
                      </Badge>
                    )}
                    <StatusIcon status={expandedProject.status} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeExpandedProject}
                  aria-label="Close details"
                  className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[72vh] space-y-6 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                <section className="rounded-sm border border-neutral-300 bg-neutral-50 p-4 transition-all hover:border-neutral-400 hover:shadow-lg sm:p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary-600">Abstract</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700 sm:text-base">
                    {projectAbstract(expandedProject) || 'No abstract available yet.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                    <FiClock className="h-4 w-4" />
                    Last updated
                  </div>
                  <p className="text-sm text-neutral-700 sm:text-base">{formatUpdatedDate(expandedProject.updated_at)}</p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                    <FiUsers className="h-4 w-4" />
                    Team members
                  </div>
                  {expandedMembersLoading ? (
                    <p className="text-sm text-neutral-600">Loading team members...</p>
                  ) : expandedMembersError ? (
                    <p className="text-sm text-error-600">{expandedMembersError}</p>
                  ) : expandedMembers.length === 0 ? (
                    <p className="text-sm text-neutral-600">No team members found.</p>
                  ) : (
                    <ul className="space-y-2">
                      {expandedMembers.map((member) => {
                        const memberName =
                          member.users?.full_name || member.users?.email || 'Unknown member';
                        return (
                          <li
                            key={member.id}
                            className="flex items-center justify-between gap-3 rounded-sm border border-neutral-300 bg-white px-3 py-2 transition-all hover:border-neutral-400 hover:shadow-lg"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar
                                src={member.users?.avatar_url || ''}
                                name={memberName}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-neutral-800">{memberName}</p>
                                <p className="truncate text-xs text-neutral-500">{member.users?.email || ''}</p>
                              </div>
                            </div>
                            <Badge variant="default" size="sm" className="capitalize">
                              {formatMemberRole(member.role)}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                    <FiTag className="h-4 w-4" />
                    Keywords
                  </div>
                  {expandedProject.keywords?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {expandedProject.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 sm:text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600">No keywords listed yet.</p>
                  )}
                </section>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
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
                  className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg transition-all hover:border-oxfordBlue/40 hover:bg-oxfordBlue/5"
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
                      variant="accept"
                      size="sm"
                      disabled={respondingId === inv.id}
                      onClick={() => handleRespond(inv.id, true)}
                    >
                      <FiCheck className="mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="decline"
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => {
              const abstractText = projectAbstract(project);
              return (
                <div key={project.id} className="h-full">
                <Card
                  hover
                  className="flex h-full flex-col justify-between"
                  onClick={() => router.push(`/student/projects/${project.id}`)}
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between">
                      <FiFolder className="text-2xl text-primary-500" />
                      <div className="flex items-center gap-2">
                        {project.member_role && (
                          <Badge
                            variant={project.member_role === 'adviser' ? 'success' : 'primary'}
                            size="sm"
                            className="capitalize"
                          >
                            {project.member_role === 'adviser' ? 'adviser' :
                             project.member_role === 'leader' ? 'leader' : 'contributor'}
                          </Badge>
                        )}
                        <StatusIcon status={project.status} />
                      </div>
                    </div>
                    <CardTitle className="mt-3">{project.title}</CardTitle>
                    <CardDescription
                      lines={2}
                      uniformHeight
                      className={`italic ${
                        abstractText
                          ? ''
                          : 'text-neutral-500/60'
                      }`}
                    >
                      <>
                        <span>{abstractText ? buildAbstractPreview(abstractText) : 'No abstract available'}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void openExpandedProject(project);
                          }}
                          className="ml-1.5 font-sans not-italic text-primary-700 underline underline-offset-2 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 rounded-sm"
                        >
                          See more
                        </button>
                      </>
                    </CardDescription>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-300 pt-4 text-sm text-neutral-600">
                    <div className="min-w-0 flex-1">
                      <span>{formatProjectCardMeta(project)}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      {formatProjectCardDate(project.created_at)}
                    </div>
                  </div>
                </Card>
              </div>
              );
            })}
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
      {typeof document !== 'undefined' ? createPortal(expandedProjectOverlay, document.body) : null}
    </>
  );
}
