'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import { FiCheck, FiClock, FiCopy, FiFileText, FiX } from 'react-icons/fi';
import { LuLink } from 'react-icons/lu';
import EmptyState from '@/components/layout/EmptyState';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProject,
  getProjectMembers,
  getProjectInvitations,
  inviteToProject,
  findRelatedStudies,
  crossReferenceStudies,
  updateProjectKeywords,
  updateProjectAbstract,
  type Project,
  type ProjectMember,
  type RelatedStudiesResult,
  type CrossReferenceResult,
} from '@/lib/api/projects';
import { getPaperVersions, type PaperVersion } from '@/lib/api/paperVersions';
import UserSearchModal from '@/components/UserSearchModal';
import PaperVersionTimeline from '@/components/PaperVersionTimeline';
import type { SearchUserResult } from '@/lib/api/users';
import { formControlResponsiveClassName, formTextareaResponsiveClassName } from '@/lib/utils/formControls';

function formatProjectDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusBadgeVariant(status: string): 'primary' | 'warning' | 'success' | 'default' {
  const s = status.toLowerCase();
  if (s === 'draft') return 'warning';
  if (s === 'active') return 'primary';
  if (s === 'completed' || s === 'archived') return 'success';
  return 'default';
}

const summaryDetailTextClass = 'text-sm md:text-md text-neutral-700';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [codeCopied, setCodeCopied] = useState(false);
  const { user, handleLogout } = useDashboardUser('Student');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [paperVersions, setPaperVersions] = useState<PaperVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [findingRelated, setFindingRelated] = useState(false);
  const [relatedStudiesError, setRelatedStudiesError] = useState<string | null>(null);
  const [relatedStudiesResult, setRelatedStudiesResult] = useState<RelatedStudiesResult | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [editableKeywords, setEditableKeywords] = useState<string[]>([]);
  const [savingKeywords, setSavingKeywords] = useState(false);
  const [keywordsError, setKeywordsError] = useState<string | null>(null);
  const [abstractInput, setAbstractInput] = useState('');
  const [savingAbstract, setSavingAbstract] = useState(false);
  const [abstractError, setAbstractError] = useState<string | null>(null);
  const [crossRefLoading, setCrossRefLoading] = useState(false);
  const [crossRefError, setCrossRefError] = useState<string | null>(null);
  const [crossRefResult, setCrossRefResult] = useState<CrossReferenceResult | null>(null);

  const loadPaperVersions = useCallback(async () => {
    if (!params.id) return;
    setVersionsLoading(true);
    const res = await getPaperVersions(params.id as string);
    setPaperVersions(res.data || []);
    setVersionsLoading(false);
  }, [params.id]);

  const loadMembers = async () => {
    if (!params.id) return;
    const [membersRes, invitesRes] = await Promise.all([
      getProjectMembers(params.id as string),
      getProjectInvitations(params.id as string),
    ]);
    setMembers(membersRes.data || []);
    setPendingInvites(invitesRes.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!params.id) return;
      setLoading(true);
      const [projRes, membersRes, invitesRes] = await Promise.all([
        getProject(params.id as string),
        getProjectMembers(params.id as string),
        getProjectInvitations(params.id as string),
      ]);
      if (!cancelled) {
        setProject(projRes.data || null);
        setMembers(membersRes.data || []);
        setPendingInvites(invitesRes.data || []);
        setLoading(false);
      }
    }
    load();
    loadPaperVersions();
    const interval = setInterval(loadMembers, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [params.id, loadPaperVersions]);

  useEffect(() => {
    setEditableKeywords(project?.keywords || []);
  }, [project?.id, project?.keywords]);

  useEffect(() => {
    if (!project) return;
    setAbstractInput(project.description || project.abstract || '');
  }, [project?.id, project?.description, project?.abstract]);

  const copyProjectCode = () => {
    if (project?.project_code) {
      navigator.clipboard.writeText(project.project_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const existingUserIds = [
    ...members.map((m) => m.user_id),
    ...pendingInvites.map((m) => m.user_id),
  ];

  const handleInviteSelect = async (selectedUser: SearchUserResult) => {
    if (!params.id) return;
    setInviteError(null);
    setInviteSuccess(null);

    const role = selectedUser.role === 'adviser' ? 'adviser' : 'member';
    const res = await inviteToProject(params.id as string, {
      userId: selectedUser.id,
      role,
    });

    if (res.error) {
      setInviteError(res.error);
      setTimeout(() => setInviteError(null), 4000);
    } else {
      setInviteSuccess(`Invitation sent to ${selectedUser.full_name}`);
      setTimeout(() => setInviteSuccess(null), 4000);
      loadMembers();
    }
  };

  const handleFindRelatedStudies = async () => {
    if (!project) return;
    setFindingRelated(true);
    setRelatedStudiesError(null);

    const res = await findRelatedStudies(project.id);
    if (res.error || !res.data) {
      setRelatedStudiesError(res.error || 'Failed to process related studies');
      setFindingRelated(false);
      return;
    }

    setRelatedStudiesResult(res.data);
    setProject((prev) => (prev ? { ...prev, keywords: res.data?.keywords || [] } : prev));
    setEditableKeywords(res.data?.keywords || []);
    setFindingRelated(false);
  };

  const addKeywordFromInput = () => {
    const next = keywordInput.trim();
    if (!next) return;
    if (editableKeywords.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setKeywordInput('');
      return;
    }
    setEditableKeywords((prev) => [...prev, next]);
    setKeywordInput('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    setEditableKeywords((prev) => prev.filter((item) => item !== keywordToRemove));
  };

  const clearKeywords = () => {
    setEditableKeywords([]);
    setKeywordInput('');
  };

  const commitKeywords = async () => {
    if (!project) return;
    setSavingKeywords(true);
    setKeywordsError(null);
    const res = await updateProjectKeywords(project.id, editableKeywords);
    if (res.error || !res.data) {
      setKeywordsError(res.error || 'Failed to save keywords');
      setSavingKeywords(false);
      return;
    }
    setProject((prev) => (prev ? { ...prev, keywords: res.data?.keywords || [] } : prev));
    setEditableKeywords(res.data.keywords || []);
    setSavingKeywords(false);
  };

  const commitAbstract = async () => {
    if (!project) return;
    setSavingAbstract(true);
    setAbstractError(null);
    const res = await updateProjectAbstract(project.id, abstractInput);
    if (res.error || !res.data) {
      setAbstractError(res.error || 'Failed to save abstract');
      setSavingAbstract(false);
      return;
    }
    const updatedAbstract = res.data.abstract;
    // Keep both fields in sync (backend updates both).
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        abstract: updatedAbstract,
        description: updatedAbstract,
      };
    });
    setSavingAbstract(false);
  };

  const handleCrossReference = async () => {
    if (!project) return;
    setCrossRefLoading(true);
    setCrossRefError(null);

    const res = await crossReferenceStudies(project.id);
    if (res.error || !res.data) {
      setCrossRefError(res.error || 'Failed to fetch cross-referenced studies');
      setCrossRefLoading(false);
      return;
    }

    setCrossRefResult(res.data);
    setCrossRefLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout role="student" user={user} onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="student" user={user} onLogout={handleLogout}>
        <EmptyState
          title="Project not found"
          description="This project may have been removed or you no longer have access."
          action={{
            label: 'Back to My Projects',
            onClick: () => router.push('/student/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  const headerSubtitle = project.abstract || project.description || '';

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="project-detail-forms space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-primary-700 break-words sm:text-3xl">
                {project.title}
              </h1>
              <Badge variant={statusBadgeVariant(project.status)} className="capitalize shrink-0">
                {project.status}
              </Badge>
            </div>
            <p className="text-neutral-600 line-clamp-3">
              {headerSubtitle || 'No description provided'}
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 self-start sm:self-auto"
            onClick={() => router.push('/student/projects')}
          >
            Back to Projects
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <LuLink className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Project Code</CardTitle>
              <CardDescription>Share this code to invite team members and advisers</CardDescription>
            </CardHeader>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-lg bg-neutral-100 px-3 py-2 font-mono text-sm text-primary-700">
                {project.project_code}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={copyProjectCode}
                aria-label={codeCopied ? 'Copied to clipboard' : 'Copy project code'}
              >
                {codeCopied ? (
                  <FiCheck className="text-success-600" aria-hidden />
                ) : (
                  <FiCopy aria-hidden />
                )}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <FiFileText className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <div className={`mt-4 space-y-2 ${summaryDetailTextClass}`}>
              <p>
                <span className="font-medium text-neutral-900">Type:</span>{' '}
                <span className="capitalize">{project.project_type}</span>
              </p>
              <p>
                <span className="font-medium text-neutral-900">Paper standard:</span>{' '}
                <span className="uppercase">{project.paper_standard}</span>
              </p>
              {project.program ? (
                <p>
                  <span className="font-medium text-neutral-900">Program:</span> {project.program}
                </p>
              ) : null}
              {project.course ? (
                <p>
                  <span className="font-medium text-neutral-900">Course:</span> {project.course}
                </p>
              ) : null}
              {project.section ? (
                <p>
                  <span className="font-medium text-neutral-900">Section:</span> {project.section}
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <FiClock className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <div className={`mt-4 space-y-2 ${summaryDetailTextClass}`}>
              <p>
                <span className="font-medium text-neutral-900">Created:</span>{' '}
                {formatProjectDate(project.created_at)}
              </p>
              <p>
                <span className="font-medium text-neutral-900">Last updated:</span>{' '}
                {formatProjectDate(project.updated_at)}
              </p>
            </div>
          </Card>
        </div>

        {/* Abstract */}
        <Card>
          <CardHeader>
            <div className="flex w-full flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Abstract</CardTitle>
                <CardDescription>Edit your project summary</CardDescription>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="shrink-0"
                onClick={commitAbstract}
                disabled={savingAbstract}
              >
                {savingAbstract ? 'Saving...' : 'Save Abstract'}
              </Button>
            </div>
          </CardHeader>

          <div>
            <textarea
              className={`${formTextareaResponsiveClassName} focus:ring-2 focus:ring-primary-500 ${
                abstractError ? 'border-error-500' : ''
              }`}
              placeholder="Write a concise abstract of your project"
              rows={6}
              value={abstractInput}
              onChange={(e) => setAbstractInput(e.target.value)}
            />

            {abstractError && (
              <p className="mt-2 text-sm text-archivumRed">{abstractError}</p>
            )}
          </div>
        </Card>

        {/* Keywords */}
        <Card>
          <CardHeader>
            <div className="flex w-full flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Keywords</CardTitle>
                <CardDescription>Extract, edit, and cross-reference related studies</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={findingRelated}
                  onClick={handleFindRelatedStudies}
                >
                  {findingRelated ? 'Running keyword model...' : 'Set Keywords'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearKeywords}
                  disabled={savingKeywords}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={commitKeywords}
                  disabled={savingKeywords}
                >
                  {savingKeywords ? 'Saving...' : 'Commit'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeywordFromInput();
                }
              }}
              placeholder="Type keyword then press Enter"
              className={`${formControlResponsiveClassName} focus:ring-2 focus:ring-primary-400`}
            />
          </div>

          {editableKeywords.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {editableKeywords.map((keyword, idx) => (
                <span
                  key={`${keyword}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-md text-neutral-800"
                >
                  {keyword}
                  <button
                    type="button"
                    className="text-neutral-500 hover:text-neutral-700"
                    onClick={() => removeKeyword(keyword)}
                    aria-label={`Remove ${keyword}`}
                  >
                    <FiX size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No detected keywords yet.</p>
          )}

          {relatedStudiesError && (
            <p className="mt-3 text-sm text-archivumRed">{relatedStudiesError}</p>
          )}

          {keywordsError && (
            <p className="mt-3 text-sm text-archivumRed">{keywordsError}</p>
          )}

          {relatedStudiesResult && (
            <div className="mt-4 space-y-2 text-sm text-neutral-700">
              <p>
                Analyzed file: <span className="font-medium">{relatedStudiesResult.latestVersion.file_name}</span>
              </p>
              {relatedStudiesResult.vectorization?.shape && (
                <p>
                  Vector shape: {relatedStudiesResult.vectorization.shape.join(' x ')} |
                  Non-zero: {relatedStudiesResult.vectorization.non_zero ?? 0}
                </p>
              )}
              {relatedStudiesResult.vectorization?.message && (
                <p>{relatedStudiesResult.vectorization.message}</p>
              )}
            </div>
          )}

          <div className="mt-6 border-t border-neutral-300 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-serif text-lg font-semibold text-eerieBlack">Cross-referencing</h3>
              <Button
                size="sm"
                variant="primary"
                onClick={handleCrossReference}
                disabled={crossRefLoading}
              >
                {crossRefLoading ? 'Searching...' : 'Cross-reference 20 Studies'}
              </Button>
            </div>

            {crossRefError && (
              <p className="mt-2 text-sm text-archivumRed">{crossRefError}</p>
            )}

            {crossRefResult && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-neutral-600">
                  Query: <span className="font-medium">{crossRefResult.query}</span> ·
                  Results: {crossRefResult.total}
                </p>
                {crossRefResult.studies.length > 0 ? (
                  <div
                    className="h-96 overflow-y-auto overscroll-contain rounded-md border border-neutral-200 bg-neutral-50/50 p-2 space-y-2"
                    aria-label="Cross-referenced studies"
                  >
                    {crossRefResult.studies.map((study, index) => {
                      const authorNames = (study.authorships || [])
                        .map((a) => a?.author?.display_name)
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(', ');
                      const doiUrl = study.doi
                        ? (study.doi.startsWith('http') ? study.doi : `https://doi.org/${study.doi.replace(/^https?:\/\/doi.org\//, '')}`)
                        : null;

                      return (
                        <div key={`${study.display_name}-${index}`} className="rounded-lg border border-neutral-300 bg-white p-3">
                          <p className="font-medium text-sm text-neutral-900">{study.display_name}</p>
                          <p className="text-xs text-neutral-600 mt-1">
                            {authorNames || 'Unknown authors'}
                            {study.publication_date ? ` · ${study.publication_date}` : ''}
                            {study.primary_location?.source?.display_name ? ` · ${study.primary_location.source.display_name}` : ''}
                          </p>
                          {doiUrl && (
                            <a
                              href={doiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 underline mt-1 inline-block break-all"
                            >
                              {doiUrl}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No studies found for current keywords.</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Document Reference */}
        {project.document_reference && (
          <Card>
            <CardHeader>
              <CardTitle>Attached Document</CardTitle>
              <CardDescription>Initial document uploaded with this project</CardDescription>
            </CardHeader>
            <a
              href={project.document_reference}
              target="_blank"
              rel="noopener noreferrer"
              className="text-oxfordBlue hover:underline break-all text-sm md:text-md"
            >
              View document
            </a>
          </Card>
        )}

        {/* Team members */}
        <Card>
          <CardHeader>
            <div className="flex w-full flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                  {pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
                </CardDescription>
              </div>
              <Button variant="primary" size="sm" className="shrink-0" onClick={() => setInviteOpen(true)}>
                Invite Members
              </Button>
            </div>
          </CardHeader>

          {(inviteSuccess || inviteError) && (
            <div
              className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                inviteSuccess ? 'bg-success-50 text-success-700' : 'bg-error-50 text-archivumRed'
              }`}
            >
              {inviteSuccess || inviteError}
            </div>
          )}

          {members.length > 0 || pendingInvites.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${
                    member.role === 'leader'
                      ? 'border-primary-300 bg-primary-50/50'
                      : member.role === 'adviser'
                        ? 'border-neutral-200 bg-neutral-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <Avatar
                    src={member.users?.avatar_url}
                    name={member.users?.full_name || member.users?.email || 'Unknown'}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-neutral-900 truncate">
                        {member.users?.full_name || 'Unknown User'}
                      </h4>
                      {member.role === 'leader' ? (
                        <span className="text-xs font-medium text-primary-600 whitespace-nowrap">
                          (Leader)
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-600 break-all">{member.users?.email}</p>
                  </div>
                  <Badge
                    variant={
                      member.role === 'leader'
                        ? 'primary'
                        : member.role === 'adviser'
                          ? 'success'
                          : 'default'
                    }
                    className="capitalize shrink-0"
                  >
                    {member.role === 'adviser'
                      ? 'adviser'
                      : member.role === 'leader'
                        ? 'leader'
                        : 'collaborator'}
                  </Badge>
                </div>
              ))}

              {pendingInvites.length > 0 ? (
                <>
                  <div className="pt-2 pb-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Pending invitations
                    </p>
                  </div>
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:flex-row sm:items-center"
                    >
                      <Avatar
                        src={invite.users?.avatar_url}
                        name={invite.users?.full_name || invite.users?.email || 'Unknown'}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-neutral-800">
                          {invite.users?.full_name || 'Unknown User'}
                        </h4>
                        <p className="mt-0.5 text-sm text-neutral-600 break-all">{invite.users?.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Badge variant="warning">pending</Badge>
                        <Badge variant={invite.role === 'adviser' ? 'success' : 'default'} className="capitalize">
                          {invite.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-neutral-500">
              No team members yet. Use Invite Members to add collaborators or advisers.
            </p>
          )}
        </Card>

        <UserSearchModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onSelect={handleInviteSelect}
          title="Invite Members"
          excludeIds={existingUserIds}
        />

        {/* Paper versions */}
        <Card>
          <PaperVersionTimeline
            projectId={project.id}
            paperStandard={project.paper_standard}
            versions={paperVersions}
            loading={versionsLoading}
            onRefresh={loadPaperVersions}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
