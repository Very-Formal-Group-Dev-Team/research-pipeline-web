'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import { FiArrowLeft, FiClock, FiEdit2, FiFileText, FiX } from 'react-icons/fi';
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
  updateProjectDetails,
  deleteProject,
  type Project,
  type ProjectMember,
  type RelatedStudiesResult,
  type CrossReferenceResult,
} from '@/lib/api/projects';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { getPaperVersions, type PaperVersion } from '@/lib/api/paperVersions';
import UserSearchModal from '@/components/UserSearchModal';
import ProjectCodeCopyRow from '@/components/projects/ProjectCodeCopyRow';
import ProjectTeamMembersCard from '@/components/projects/ProjectTeamMembersCard';
import PaperVersionTimeline from '@/components/PaperVersionTimeline';
import type { SearchUserResult } from '@/lib/api/users';
import {
  formControlResponsiveClassName,
  formSelectResponsiveClassName,
  formTextareaResponsiveClassName,
  projectDetailFieldRowClassName,
  projectDetailLabelClassName,
  projectDetailMetadataTextClassName,
  projectDetailValueWrapClassName,
  projectSummaryDetailTextClassName,
} from '@/lib/utils/formControls';
import {
  PAPER_STANDARD_FORM_OPTIONS,
  PROJECT_TYPE_FORM_OPTIONS,
  paperStandardFormValue,
  statusBadgeVariant,
} from '@/lib/utils/projectDisplay';

function formatProjectDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatProjectDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const projectSummaryBodyTextClass = `${projectSummaryDetailTextClassName} text-neutral-700`;

/** Shared display styles for the page title (view + inline edit). */
const PROJECT_TITLE_CLASS =
  'font-serif text-2xl font-bold leading-tight text-primary-700 sm:text-3xl';

const PROJECT_TITLE_INPUT_SHELL_CLASS =
  'rounded-md border border-neutral-300/70 px-2 py-0.5';

/** Serif ink extends past the layout box; padding avoids clipping the last glyph. */
const PROJECT_TITLE_END_BLEED_CLASS = 'pe-[0.75ch] sm:pe-[1ch]';

const PROJECT_DETAIL_CONTROL_CLASS = [
  projectDetailMetadataTextClassName,
  'h-9 !min-h-0 w-full !py-1.5 !px-3 !text-sm !leading-snug md:h-10 md:!py-2 md:!text-md md:!leading-normal',
].join(' ');

function ProjectDetailFieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={projectDetailFieldRowClassName}>
      <label htmlFor={htmlFor} className={projectDetailLabelClassName}>
        {label}
      </label>
      <div className={projectDetailValueWrapClassName}>{children}</div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, handleLogout } = useDashboardUser('Student');

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTitleInput, setDeleteTitleInput] = useState('');
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [detailsProjectType, setDetailsProjectType] = useState('thesis');
  const [detailsPaperStandard, setDetailsPaperStandard] = useState('IEEE');
  const [detailsProgram, setDetailsProgram] = useState('');
  const [detailsCourse, setDetailsCourse] = useState('');
  const [detailsSection, setDetailsSection] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);

  const loadPaperVersions = useCallback(async () => {
    if (!params.id) return;
    setVersionsLoading(true);
    const res = await getPaperVersions(params.id as string);
    setPaperVersions(res.data || []);
    setVersionsLoading(false);
  }, [params.id]);

  const reloadProject = useCallback(async () => {
    if (!params.id) return;
    const res = await getProject(params.id as string);
    if (res.data) setProject(res.data);
  }, [params.id]);

  const refreshPaperTimeline = useCallback(async () => {
    await Promise.all([loadPaperVersions(), reloadProject()]);
  }, [loadPaperVersions, reloadProject]);

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

  useEffect(() => {
    if (!project) return;
    setDetailsProjectType(project.project_type || 'thesis');
    setDetailsPaperStandard(paperStandardFormValue(project.paper_standard));
    setDetailsProgram(project.program || '');
    setDetailsCourse(project.course || '');
    setDetailsSection(project.section || '');
  }, [
    project?.id,
    project?.project_type,
    project?.paper_standard,
    project?.program,
    project?.course,
    project?.section,
  ]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const existingUserIds = [
    ...members.map((m) => m.user_id),
    ...pendingInvites.map((m) => m.user_id),
  ];

  const handleInviteSelect = async (selectedUser: SearchUserResult) => {
    if (!params.id) return;
    setInviteError(null);
    setInviteSuccess(null);

    const role =
      selectedUser.role === 'adviser' || selectedUser.role === 'teacher' ? 'adviser' : 'member';
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

  const startEditingTitle = () => {
    if (!project || savingTitle) return;
    setTitleInput(project.title);
    setTitleError(null);
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setTitleInput(project?.title || '');
    setTitleError(null);
  };

  const saveProjectTitle = async () => {
    if (!project || savingTitle) return;
    const trimmed = titleInput.trim();
    if (!trimmed) {
      setTitleError('Project title is required');
      return;
    }
    if (trimmed === project.title) {
      setIsEditingTitle(false);
      setTitleError(null);
      return;
    }

    setSavingTitle(true);
    setTitleError(null);

    const res = await updateProjectDetails(project.id, {
      title: trimmed,
      projectType: detailsProjectType,
      paperStandard: detailsPaperStandard,
      program: detailsProgram.trim(),
      course: detailsCourse.trim(),
      section: detailsSection.trim(),
    });

    if (res.error || !res.data) {
      setTitleError(res.error || 'Failed to save title');
      setSavingTitle(false);
      return;
    }

    setProject(res.data);
    setIsEditingTitle(false);
    setSavingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveProjectTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  const commitProjectDetails = async () => {
    if (!project) return;
    if (!detailsPaperStandard) {
      setDetailsError('Paper standard is required');
      return;
    }

    setSavingDetails(true);
    setDetailsError(null);
    setDetailsSuccess(null);

    const res = await updateProjectDetails(project.id, {
      title: project.title,
      projectType: detailsProjectType,
      paperStandard: detailsPaperStandard,
      program: detailsProgram.trim(),
      course: detailsCourse.trim(),
      section: detailsSection.trim(),
    });

    if (res.error || !res.data) {
      setDetailsError(res.error || 'Failed to save project details');
      setSavingDetails(false);
      return;
    }

    setProject(res.data);
    setDetailsSuccess('Project details saved');
    setTimeout(() => setDetailsSuccess(null), 3000);
    setSavingDetails(false);
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
  const isProjectLeader =
    Boolean(profile?.id) &&
    (project.created_by === profile?.id ||
      members.some(
        (member) =>
          member.user_id === profile?.id && member.role === 'leader' && member.status === 'accepted',
      ));
  const deleteTitleMatches = deleteTitleInput === project.title;

  const openDeleteModal = () => {
    setDeleteTitleInput('');
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deletingProject) return;
    setDeleteModalOpen(false);
    setDeleteTitleInput('');
    setDeleteError(null);
  };

  const handleDeleteProject = async () => {
    if (!deleteTitleMatches || deletingProject) return;
    setDeletingProject(true);
    setDeleteError(null);

    const res = await deleteProject(project.id, deleteTitleInput);
    if (res.error || !res.data?.success) {
      setDeleteError(res.error || 'Failed to delete project');
      setDeletingProject(false);
      return;
    }

    router.push('/student/projects');
  };

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="project-detail-forms space-y-6">
        {/* Page header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <div className="min-w-0 max-w-full">
                  <div className="inline-grid w-max max-w-full min-w-0 [&>*]:col-start-1 [&>*]:row-start-1">
                    <span
                      className={`invisible whitespace-pre pointer-events-none ${PROJECT_TITLE_CLASS} ${PROJECT_TITLE_INPUT_SHELL_CLASS} ${PROJECT_TITLE_END_BLEED_CLASS}`}
                      aria-hidden
                    >
                      {titleInput || '\u00A0'}
                    </span>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onKeyDown={handleTitleKeyDown}
                      onBlur={() => void saveProjectTitle()}
                      disabled={savingTitle}
                      size={1}
                      className={`project-title-inline-input min-w-0 w-full max-w-full bg-neutral-50 outline-none focus:border-primary-400/60 disabled:opacity-60 ${PROJECT_TITLE_CLASS} ${PROJECT_TITLE_INPUT_SHELL_CLASS} ${PROJECT_TITLE_END_BLEED_CLASS}`}
                      aria-label="Project title"
                    />
                  </div>
                  {titleError ? (
                    <p className="mt-1 text-sm text-archivumRed">{titleError}</p>
                  ) : null}
                </div>
              ) : (
                <h1
                  className={`min-w-0 break-words ${PROJECT_TITLE_CLASS} ${PROJECT_TITLE_END_BLEED_CLASS}`}
                >
                  {project.title}
                </h1>
              )}
            </div>
            {!isEditingTitle ? (
              <button
                type="button"
                onClick={startEditingTitle}
                className="shrink-0 self-center rounded-md p-1.5 text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                aria-label="Edit project title"
              >
                <FiEdit2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </button>
            ) : null}
            <Badge
              variant={statusBadgeVariant(project.status)}
              className="shrink-0 self-center capitalize"
            >
              {project.status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 self-center text-sm text-primary-700 hover:bg-primary-50 sm:text-md"
            leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
            onClick={() => router.push('/student/projects')}
          >
            Back to Projects
          </Button>
        </header>

        {/* Summary cards — left: code + timeline; right: details (full height) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2 md:items-stretch">
          <Card className="md:col-start-1 md:row-start-1">
            <CardHeader>
              <LuLink className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Project Code</CardTitle>
              <CardDescription>Share this code to invite team members and advisers</CardDescription>
            </CardHeader>
            <ProjectCodeCopyRow projectCode={project.project_code} />
          </Card>

          <Card className="md:col-start-1 md:row-start-2">
            <CardHeader>
              <FiClock className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <div className="mt-4 space-y-2">
              <p className={projectSummaryBodyTextClass}>
                <span className="font-medium text-neutral-900">Created:</span>{' '}
                {formatProjectDateTime(project.created_at)}
              </p>
              <p className={projectSummaryBodyTextClass}>
                <span className="font-medium text-neutral-900">Last updated:</span>{' '}
                {formatProjectDateTime(project.updated_at)}
              </p>
            </div>
          </Card>

          <Card className="flex h-full min-h-0 flex-col md:col-start-2 md:row-span-2 md:row-start-1">
            <CardHeader className="!mb-0 shrink-0">
              <div className="flex w-full flex-wrap items-start justify-between gap-2">
                <div>
                  <FiFileText className="mb-2 text-2xl text-primary-500" aria-hidden />
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>Edit type, paper standard, and class information</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="shrink-0"
                  onClick={commitProjectDetails}
                  disabled={savingDetails}
                  loading={savingDetails}
                >
                  {savingDetails ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardHeader>
            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              {(detailsSuccess || detailsError) && (
                <div
                  className={`mb-3 shrink-0 rounded-lg px-3 py-1.5 text-sm ${
                    detailsSuccess ? 'bg-success-50 text-success-700' : 'bg-error-50 text-archivumRed'
                  }`}
                >
                  {detailsSuccess || detailsError}
                </div>
              )}
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <div className="project-detail-inline-fields flex flex-col gap-3 md:gap-3.5">
                <ProjectDetailFieldRow label="Program" htmlFor="project-detail-program">
                  <Input
                    id="project-detail-program"
                    value={detailsProgram}
                    onChange={(e) => setDetailsProgram(e.target.value)}
                    placeholder="Program name"
                    className={PROJECT_DETAIL_CONTROL_CLASS}
                  />
                </ProjectDetailFieldRow>
                <ProjectDetailFieldRow label="Course" htmlFor="project-detail-course">
                  <Input
                    id="project-detail-course"
                    value={detailsCourse}
                    onChange={(e) => setDetailsCourse(e.target.value)}
                    placeholder="Course name"
                    className={PROJECT_DETAIL_CONTROL_CLASS}
                  />
                </ProjectDetailFieldRow>
                <ProjectDetailFieldRow label="Section" htmlFor="project-detail-section">
                  <Input
                    id="project-detail-section"
                    value={detailsSection}
                    onChange={(e) => setDetailsSection(e.target.value)}
                    placeholder="Section"
                    className={PROJECT_DETAIL_CONTROL_CLASS}
                  />
                </ProjectDetailFieldRow>
                <ProjectDetailFieldRow label="Project Type" htmlFor="project-detail-type">
                  <select
                    id="project-detail-type"
                    value={detailsProjectType}
                    onChange={(e) => setDetailsProjectType(e.target.value)}
                    required
                    className={`${formSelectResponsiveClassName} ${PROJECT_DETAIL_CONTROL_CLASS} !pr-8 bg-[length:0.875rem_0.875rem] bg-[right_0.5rem_center]`}
                  >
                    {PROJECT_TYPE_FORM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </ProjectDetailFieldRow>
                <ProjectDetailFieldRow label="Paper Standard" htmlFor="project-detail-paper-standard">
                  <select
                    id="project-detail-paper-standard"
                    value={detailsPaperStandard}
                    onChange={(e) => setDetailsPaperStandard(e.target.value)}
                    required
                    className={`${formSelectResponsiveClassName} ${PROJECT_DETAIL_CONTROL_CLASS} !pr-8 bg-[length:0.875rem_0.875rem] bg-[right_0.5rem_center]`}
                  >
                    {PAPER_STANDARD_FORM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </ProjectDetailFieldRow>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Abstract */}
          <Card className="flex h-full min-h-0 flex-col">
            <CardHeader className="shrink-0">
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

            <div className="flex min-h-0 flex-1 flex-col">
              <textarea
                placeholder="Write a concise abstract of your project"
                value={abstractInput}
                className={`${formTextareaResponsiveClassName} min-h-[12rem] w-full flex-1 resize-none focus:ring-2 focus:ring-primary-500 lg:min-h-0 lg:h-0 ${
                  abstractError ? 'border-error-500' : ''
                }`}
                onChange={(e) => setAbstractInput(e.target.value)}
              />

              {abstractError && (
                <p className="mt-2 shrink-0 text-sm text-archivumRed">{abstractError}</p>
              )}
            </div>
          </Card>

          <ProjectTeamMembersCard
            projectId={project.id}
            members={members}
            pendingInvites={pendingInvites}
            currentUserId={profile?.id}
            onMembersChange={loadMembers}
            onInviteClick={() => setInviteOpen(true)}
            inviteSuccess={inviteSuccess}
            inviteError={inviteError}
          />
        </div>

        <UserSearchModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onSelect={handleInviteSelect}
          title="Invite Members"
          excludeIds={existingUserIds}
        />

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

        {/* Paper versions */}
        <Card>
          <PaperVersionTimeline
            projectId={project.id}
            paperStandard={project.paper_standard}
            versions={paperVersions}
            loading={versionsLoading}
            onRefresh={refreshPaperTimeline}
          />
        </Card>

        {isProjectLeader ? (
          <Card className="border-error-200">
            <CardHeader>
              <CardTitle className="text-archivumRed">Danger zone</CardTitle>
              <CardDescription>
                Permanently delete this project and all related papers, meetings, and team data.
                This cannot be undone.
              </CardDescription>
            </CardHeader>
            <Button variant="error" size="sm" onClick={openDeleteModal}>
              Delete project
            </Button>
          </Card>
        ) : null}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete this project?"
        size="md"
        closeOnOverlayClick={!deletingProject}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            This will permanently remove{' '}
            <span className="font-semibold text-neutral-900">{project.title}</span>, including team
            members, paper versions, and schedules. This action cannot be undone.
          </p>
          <p className="text-sm text-neutral-700">
            To confirm, type the project title exactly as shown below (case sensitive):
          </p>
          <p className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-900 break-all">
            {project.title}
          </p>
          <Input
            label="Project title"
            value={deleteTitleInput}
            onChange={(e) => setDeleteTitleInput(e.target.value)}
            placeholder={project.title}
            autoComplete="off"
            disabled={deletingProject}
            responsiveText
          />
          {deleteError ? <p className="text-sm text-archivumRed">{deleteError}</p> : null}
        </div>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={closeDeleteModal} disabled={deletingProject}>
            Cancel
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={handleDeleteProject}
            disabled={!deleteTitleMatches || deletingProject}
            loading={deletingProject}
          >
            Delete this project
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
