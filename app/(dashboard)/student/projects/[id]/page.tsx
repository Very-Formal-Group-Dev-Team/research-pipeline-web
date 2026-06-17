'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSectionFocusScroll } from '@/lib/hooks/useSectionFocusScroll';
import {
  PROJECT_TEAM_MEMBERS_SECTION_ID,
  PROJECT_TEAM_MEMBERS_SECTION_PARAM,
} from '@/lib/projects/navigation';
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
  updateProjectKeywords,
  updateProjectAbstract,
  updateProjectDetails,
  deleteProject,
  type Project,
  type ProjectMember,
  type RelatedStudiesResult,
} from '@/lib/api/projects';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { getPaperVersions, type PaperVersion } from '@/lib/api/paperVersions';
import { getProjectReviewRequest, type PaperReviewRequest } from '@/lib/api/paperReviews';
import UserSearchModal from '@/components/UserSearchModal';
import ProjectCodeCopyRow from '@/components/projects/ProjectCodeCopyRow';
import ProjectTeamMembersCard from '@/components/projects/ProjectTeamMembersCard';
import PaperVersionTimeline from '@/components/PaperVersionTimeline';
import type { SearchUserResult } from '@/lib/api/users';
import {
  getMyInstitutionCourses,
  getMyInstitutionPrograms,
  type InstitutionCourse,
  type InstitutionProgram,
} from '@/lib/api/institutions';
import { toast } from 'sonner';
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
import { formatProjectStageLabel, isProjectLocked } from '@/lib/utils/projectStage';
import LeaveProjectModal, { type LeaveProjectRole } from '@/components/projects/LeaveProjectModal';
import CrossReferenceStudiesPanel from '@/components/projects/CrossReferenceStudiesPanel';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/shadcn/ui/tooltip';

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
  const [activeReviewRequest, setActiveReviewRequest] = useState<PaperReviewRequest | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [findingRelated, setFindingRelated] = useState(false);
  const [relatedStudiesError, setRelatedStudiesError] = useState<string | null>(null);
  const [relatedStudiesResult, setRelatedStudiesResult] = useState<RelatedStudiesResult | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [editableKeywords, setEditableKeywords] = useState<string[]>([]);
  const [savingKeywords, setSavingKeywords] = useState(false);
  const [keywordsError, setKeywordsError] = useState<string | null>(null);
  const [extractKeywordsModalOpen, setExtractKeywordsModalOpen] = useState(false);
  const [abstractInput, setAbstractInput] = useState('');
  const [savingAbstract, setSavingAbstract] = useState(false);
  const [abstractError, setAbstractError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTitleInput, setDeleteTitleInput] = useState('');
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const [detailsProjectType, setDetailsProjectType] = useState('thesis');
  const [detailsPaperStandard, setDetailsPaperStandard] = useState('IEEE');
  const [detailsProgramId, setDetailsProgramId] = useState('');
  const [detailsCourseId, setDetailsCourseId] = useState('');
  const [institutionCourses, setInstitutionCourses] = useState<InstitutionCourse[]>([]);
  const [institutionPrograms, setInstitutionPrograms] = useState<InstitutionProgram[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [detailsSection, setDetailsSection] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [leaveConfirmModalOpen, setLeaveConfirmModalOpen] = useState(false);

  useSectionFocusScroll(
    PROJECT_TEAM_MEMBERS_SECTION_PARAM,
    PROJECT_TEAM_MEMBERS_SECTION_ID,
    !loading && Boolean(project),
  );

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

  const loadReviewRequest = useCallback(async () => {
    if (!params.id) return;
    const res = await getProjectReviewRequest(params.id as string);
    setActiveReviewRequest(res.data ?? null);
  }, [params.id]);

  const refreshPaperTimeline = useCallback(async () => {
    await Promise.all([loadPaperVersions(), reloadProject(), loadReviewRequest()]);
  }, [loadPaperVersions, reloadProject, loadReviewRequest]);

  const resolveCourseId = useCallback(
    (projectData: Project, courses: InstitutionCourse[]) => {
      if (projectData.course_id) {
        return projectData.course_id;
      }

      const savedCourse = projectData.course?.trim().toLowerCase();
      if (!savedCourse) return '';

      const matched = courses.find((item) => {
        const byName = item.course_name.trim().toLowerCase() === savedCourse;
        const byLabel = `${item.course_name} (${item.code})`.trim().toLowerCase() === savedCourse;
        return byName || byLabel;
      });

      return matched?.id || '';
    },
    [],
  );

  const resolveProgramId = useCallback(
    (projectData: Project, programs: InstitutionProgram[]) => {
      if (projectData.program_id) {
        return projectData.program_id;
      }

      const savedProgram = projectData.program?.trim().toLowerCase();
      if (!savedProgram) return '';

      const matched = programs.find((item) => {
        const byName = item.name.trim().toLowerCase() === savedProgram;
        const byLabel = `${item.name} (${item.code})`.trim().toLowerCase() === savedProgram;
        return byName || byLabel;
      });

      return matched?.id || '';
    },
    [],
  );

  const loadInstitutionCatalog = useCallback(async () => {
    setCoursesLoading(true);
    setProgramsLoading(true);
    const [coursesRes, programsRes] = await Promise.all([
      getMyInstitutionCourses(),
      getMyInstitutionPrograms(),
    ]);
    const courses = coursesRes.data || [];
    const programs = programsRes.data || [];
    setInstitutionCourses(courses);
    setInstitutionPrograms(programs);
    setCoursesLoading(false);
    setProgramsLoading(false);
    return { courses, programs };
  }, []);

  const loadMembers = useCallback(async () => {
    if (!params.id) return;
    const [membersRes, invitesRes] = await Promise.all([
      getProjectMembers(params.id as string),
      getProjectInvitations(params.id as string),
    ]);
    setMembers(membersRes.data || []);
    setPendingInvites(invitesRes.data || []);
  }, [params.id]);

  const refreshTeamAndProject = useCallback(async () => {
    await Promise.all([loadMembers(), reloadProject()]);
  }, [loadMembers, reloadProject]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!params.id) return;
      setLoading(true);
      const [projRes, membersRes, invitesRes, catalog] = await Promise.all([
        getProject(params.id as string),
        getProjectMembers(params.id as string),
        getProjectInvitations(params.id as string),
        loadInstitutionCatalog(),
      ]);
      if (!cancelled) {
        const projectData = projRes.data || null;
        setProject(projectData);
        setMembers(membersRes.data || []);
        setPendingInvites(invitesRes.data || []);
        if (projectData) {
          setDetailsCourseId(resolveCourseId(projectData, catalog.courses));
          setDetailsProgramId(resolveProgramId(projectData, catalog.programs));
        }
        setLoading(false);
      }
    }
    load();
    loadPaperVersions();
    loadReviewRequest();
    const interval = setInterval(loadMembers, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [params.id, loadPaperVersions, loadMembers, loadInstitutionCatalog, resolveCourseId, resolveProgramId, loadReviewRequest]);

  useEffect(() => {
    setEditableKeywords(project?.keywords || []);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    setAbstractInput(project.description || project.abstract || '');
  }, [project]);

  useEffect(() => {
    if (!project) return;
    setDetailsProjectType(project.project_type || 'thesis');
    setDetailsPaperStandard(paperStandardFormValue(project.paper_standard));
    setDetailsProgramId(resolveProgramId(project, institutionPrograms));
    setDetailsCourseId(resolveCourseId(project, institutionCourses));
    setDetailsSection(project.section || '');
  }, [project, institutionCourses, institutionPrograms, resolveCourseId, resolveProgramId]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
      titleInputRef.current.style.height = 'auto';
      titleInputRef.current.style.height = `${titleInputRef.current.scrollHeight}px`;
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isEditingTitle || !titleInputRef.current) return;
    const el = titleInputRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditingTitle, titleInput]);

  const resizeTitleTextarea = () => {
    const el = titleInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const detailsDirty = useMemo(() => {
    if (!project) return false;
    return (
      detailsProjectType !== (project.project_type || 'thesis') ||
      detailsPaperStandard !== paperStandardFormValue(project.paper_standard) ||
      detailsProgramId !==
        (project.program_id || resolveProgramId(project, institutionPrograms)) ||
      detailsCourseId !== (project.course_id || resolveCourseId(project, institutionCourses)) ||
      detailsSection !== (project.section || '')
    );
  }, [
    project,
    detailsProjectType,
    detailsPaperStandard,
    detailsProgramId,
    detailsCourseId,
    detailsSection,
    institutionCourses,
    institutionPrograms,
    resolveCourseId,
    resolveProgramId,
  ]);

  const abstractDirty = useMemo(() => {
    if (!project) return false;
    const savedAbstract = project.description || project.abstract || '';
    return abstractInput !== savedAbstract;
  }, [project, abstractInput]);

  const keywordsDirty = useMemo(() => {
    if (!project) return false;
    const savedKeywords = project.keywords || [];
    if (savedKeywords.length !== editableKeywords.length) return true;
    return savedKeywords.some((keyword, index) => keyword !== editableKeywords[index]);
  }, [project, editableKeywords]);

  const titleDirty = useMemo(() => {
    if (!project || !isEditingTitle) return false;
    return titleInput.trim() !== project.title;
  }, [project, isEditingTitle, titleInput]);

  const hasUnsavedChanges = detailsDirty || abstractDirty || keywordsDirty || titleDirty;

  const navigateToProjects = () => {
    router.push('/student/projects');
  };

  const handleBackToProjects = () => {
    if (hasUnsavedChanges) {
      setLeaveConfirmModalOpen(true);
      return;
    }
    navigateToProjects();
  };

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

  const mergeKeywords = (existing: string[], extracted: string[]) => {
    const seen = new Set(existing.map((item) => item.toLowerCase()));
    const merged = [...existing];
    for (const keyword of extracted) {
      const normalized = keyword.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        merged.push(keyword);
      }
    }
    return merged.slice(0, 30);
  };

  const persistKeywords = async (keywords: string[]) => {
    if (!project) return false;
    setSavingKeywords(true);
    setKeywordsError(null);
    const res = await updateProjectKeywords(project.id, keywords);
    if (res.error || !res.data) {
      setKeywordsError(res.error || 'Failed to save keywords');
      setSavingKeywords(false);
      return false;
    }
    setProject((prev) => (prev ? { ...prev, keywords: res.data?.keywords || [] } : prev));
    setEditableKeywords(res.data.keywords || []);
    setSavingKeywords(false);
    return true;
  };

  const runKeywordExtraction = async (mode: 'fresh' | 'merge' | 'override') => {
    if (!project) return;
    setFindingRelated(true);
    setRelatedStudiesError(null);

    const res = await findRelatedStudies(project.id);
    if (res.error || !res.data) {
      setRelatedStudiesError(res.error || 'Failed to extract keywords');
      setFindingRelated(false);
      return;
    }

    setRelatedStudiesResult(res.data);

    const extractedKeywords = res.data.keywords || [];
    const nextKeywords =
      mode === 'merge'
        ? mergeKeywords(editableKeywords, extractedKeywords)
        : extractedKeywords;

    const saved = await persistKeywords(nextKeywords);
    setFindingRelated(false);
    if (saved) {
      toast.success('Keywords saved');
    }
  };

  const handleExtractKeywordsClick = () => {
    if (!project || findingRelated || savingKeywords) return;
    if (editableKeywords.length > 0) {
      setExtractKeywordsModalOpen(true);
      return;
    }
    void runKeywordExtraction('fresh');
  };

  const handleExtractKeywordsConfirm = (mode: 'merge' | 'override') => {
    setExtractKeywordsModalOpen(false);
    void runKeywordExtraction(mode);
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
    if (!project || !keywordsDirty) return;
    const saved = await persistKeywords(editableKeywords);
    if (saved) {
      toast.success('Changes saved');
    }
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
      programId: detailsProgramId || undefined,
      courseId: detailsCourseId || undefined,
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

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void saveProjectTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  const commitProjectDetails = async () => {
    if (!project || !detailsDirty) return;
    if (!detailsPaperStandard) {
      setDetailsError('Paper standard is required');
      return;
    }

    setSavingDetails(true);
    setDetailsError(null);

    const res = await updateProjectDetails(project.id, {
      title: project.title,
      projectType: detailsProjectType,
      paperStandard: detailsPaperStandard,
      programId: detailsProgramId || undefined,
      courseId: detailsCourseId || undefined,
      section: detailsSection.trim(),
    });

    if (res.error || !res.data) {
      setDetailsError(res.error || 'Failed to save project details');
      setSavingDetails(false);
      return;
    }

    setProject(res.data);
    setSavingDetails(false);
    toast.success('Changes saved');
  };

  const commitAbstract = async () => {
    if (!project || !abstractDirty) return;
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
    toast.success('Changes saved');
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

  const isProjectLeader =
    Boolean(profile?.id) &&
    (project.created_by === profile?.id ||
      members.some(
        (member) =>
          member.user_id === profile?.id && member.role === 'leader' && member.status === 'accepted',
      ));

  const currentMembership = members.find(
    (member) => member.user_id === profile?.id && member.status === 'accepted',
  );
  const acceptedMembers = members.filter((member) => member.status === 'accepted');
  const otherAcceptedMembers = acceptedMembers.filter(
    (member) => member.user_id !== profile?.id,
  );
  const leaderSuccessorCandidates = acceptedMembers.filter(
    (member) => member.user_id !== profile?.id && member.role === 'member',
  );
  const projectIsLocked = isProjectLocked(project.status);
  const isOwnerOnlyMember = isProjectLeader && otherAcceptedMembers.length === 0;
  const hasNoEligibleLeaderSuccessor =
    isProjectLeader && otherAcceptedMembers.length > 0 && leaderSuccessorCandidates.length === 0;
  const leaveRole: LeaveProjectRole | null = currentMembership
    ? currentMembership.role === 'leader'
      ? 'leader'
      : currentMembership.role === 'adviser'
        ? 'adviser'
        : 'member'
    : null;
  const leaveDisabled = projectIsLocked || isOwnerOnlyMember || hasNoEligibleLeaderSuccessor;
  const leaveDisabledTooltip = projectIsLocked
    ? 'Project is locked'
    : isOwnerOnlyMember
      ? "You're the only member. Delete the project instead."
      : hasNoEligibleLeaderSuccessor
        ? 'Leadership can only be transferred to a collaborator. Invite a team member first.'
        : undefined;
  const userDisplayName = profile?.name || user.name || '';
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

  const handleLeaveCompleted = async (result: { action: string; removed?: boolean }) => {
    setLeaveModalOpen(false);
    if (result.removed) {
      toast.success('You have left the project');
      router.push('/student');
      return;
    }
    toast.success('Project ownership transferred successfully');
    await Promise.all([reloadProject(), loadMembers()]);
  };

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="project-detail-forms space-y-6">
        {/* Page header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 w-full flex-1">
              {isEditingTitle ? (
                <div className="min-w-0 w-full max-w-full">
                  <textarea
                    ref={titleInputRef}
                    rows={1}
                    value={titleInput}
                    onChange={(e) => {
                      setTitleInput(e.target.value);
                      resizeTitleTextarea();
                    }}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={() => void saveProjectTitle()}
                    disabled={savingTitle}
                    className={`project-title-inline-input block min-h-0 w-full min-w-0 max-w-full resize-none overflow-hidden break-words bg-neutral-50 outline-none focus:border-primary-400/60 disabled:opacity-60 ${PROJECT_TITLE_CLASS} ${PROJECT_TITLE_INPUT_SHELL_CLASS} ${PROJECT_TITLE_END_BLEED_CLASS}`}
                    aria-label="Project title"
                  />
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

            <div className="flex items-center justify-between gap-2 sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-sm text-primary-700 hover:bg-primary-50"
                leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
                onClick={handleBackToProjects}
              >
                Back to Projects
              </Button>
              <div className="flex items-center gap-2">
                {!isEditingTitle ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={startEditingTitle}
                        className="shrink-0 rounded-md p-1.5 text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                        aria-label="Edit project title"
                      >
                        <FiEdit2 className="h-4 w-4" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit project title</TooltipContent>
                  </Tooltip>
                ) : null}
                <Badge variant={statusBadgeVariant(project.status)} className="shrink-0">
                  {formatProjectStageLabel(project.status)}
                </Badge>
              </div>
            </div>

            <div className="hidden items-center gap-2 self-center sm:flex sm:shrink-0 sm:gap-3">
              {!isEditingTitle ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={startEditingTitle}
                      className="shrink-0 rounded-md p-1.5 text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                      aria-label="Edit project title"
                    >
                      <FiEdit2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Edit project title</TooltipContent>
                </Tooltip>
              ) : null}
              <Badge variant={statusBadgeVariant(project.status)} className="shrink-0 self-center">
                {formatProjectStageLabel(project.status)}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="hidden shrink-0 self-center text-sm text-primary-700 hover:bg-primary-50 sm:inline-flex sm:text-md"
            leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
            onClick={handleBackToProjects}
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
                  disabled={savingDetails || !detailsDirty}
                  loading={savingDetails}
                >
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </CardHeader>
            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              {detailsError ? (
                <div className="mb-3 shrink-0 rounded-lg bg-error-50 px-3 py-1.5 text-sm text-archivumRed">
                  {detailsError}
                </div>
              ) : null}
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <div className="project-detail-inline-fields flex flex-col gap-3 md:gap-3.5">
                <ProjectDetailFieldRow label="Program" htmlFor="project-detail-program">
                  <select
                    id="project-detail-program"
                    value={detailsProgramId}
                    onChange={(e) => setDetailsProgramId(e.target.value)}
                    disabled={programsLoading}
                    className={`${formSelectResponsiveClassName} ${PROJECT_DETAIL_CONTROL_CLASS} !pr-8 bg-[length:0.875rem_0.875rem] bg-[right_0.5rem_center]`}
                  >
                    <option value="">
                      {programsLoading ? 'Loading programs...' : 'Select program'}
                    </option>
                    {institutionPrograms.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </ProjectDetailFieldRow>
                <ProjectDetailFieldRow label="Course" htmlFor="project-detail-course">
                  <select
                    id="project-detail-course"
                    value={detailsCourseId}
                    onChange={(e) => setDetailsCourseId(e.target.value)}
                    disabled={coursesLoading}
                    className={`${formSelectResponsiveClassName} ${PROJECT_DETAIL_CONTROL_CLASS} !pr-8 bg-[length:0.875rem_0.875rem] bg-[right_0.5rem_center]`}
                  >
                    <option value="">
                      {coursesLoading ? 'Loading courses...' : 'Select course'}
                    </option>
                    {institutionCourses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.course_name} ({item.code})
                      </option>
                    ))}
                  </select>
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
                  disabled={savingAbstract || !abstractDirty}
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
            isProjectLeader={isProjectLeader}
            onMembersChange={() => void refreshTeamAndProject()}
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
                  disabled={findingRelated || savingKeywords}
                  onClick={handleExtractKeywordsClick}
                >
                  {findingRelated ? 'Running keyword model...' : 'Extract Keywords'}
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
                  disabled={savingKeywords || !keywordsDirty}
                >
                  {savingKeywords ? 'Saving...' : 'Save'}
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

          <CrossReferenceStudiesPanel projectId={project.id} />
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
            activeReviewRequest={activeReviewRequest}
            canRequestReview={Boolean(currentMembership)}
            reviewRequestsDisabled={projectIsLocked}
            onReviewChange={loadReviewRequest}
          />
        </Card>

        {currentMembership ? (
          <Card className="border-error-200">
            <CardHeader>
              <CardTitle className="text-archivumRed">Danger zone</CardTitle>
              <CardDescription>
                Leave this project or permanently delete it and all related papers, meetings, and
                team data. These actions cannot be undone.
              </CardDescription>
            </CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              {leaveDisabled && leaveDisabledTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-archivumRed text-archivumRed hover:bg-archivumRed/10 hover:text-archivumRed disabled:border-neutral-300 disabled:text-neutral-400"
                      >
                        Leave project
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{leaveDisabledTooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-archivumRed text-archivumRed hover:bg-archivumRed/10 hover:text-archivumRed disabled:border-neutral-300 disabled:text-neutral-400"
                  onClick={() => setLeaveModalOpen(true)}
                >
                  Leave project
                </Button>
              )}
              {isProjectLeader ? (
                <Button variant="error" size="sm" onClick={openDeleteModal}>
                  Delete project
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>

      {leaveRole ? (
        <LeaveProjectModal
          isOpen={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          leaveRole={leaveRole}
          displayName={userDisplayName}
          successorCandidates={leaderSuccessorCandidates}
          onLeft={(result) => void handleLeaveCompleted(result)}
        />
      ) : null}

      <Modal
        isOpen={leaveConfirmModalOpen}
        onClose={() => setLeaveConfirmModalOpen(false)}
        title="Discard changes?"
        size="sm"
      >
        <p className="text-sm text-neutral-600">
          You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLeaveConfirmModalOpen(false)}
          >
            Continue Editing
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setLeaveConfirmModalOpen(false);
              navigateToProjects();
            }}
          >
            Discard Changes
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={extractKeywordsModalOpen}
        onClose={() => setExtractKeywordsModalOpen(false)}
        title="Replace existing keywords?"
        size="sm"
      >
        <p className="text-sm text-neutral-600">
          This project already has keywords. Extracting new ones from your latest paper will update
          the list. Choose how to apply the extracted keywords.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExtractKeywordsModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleExtractKeywordsConfirm('merge')}
          >
            Merge
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleExtractKeywordsConfirm('override')}
          >
            Override
          </Button>
        </div>
      </Modal>

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
