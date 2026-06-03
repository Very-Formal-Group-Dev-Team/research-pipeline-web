'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import { FiArrowLeft, FiCheck, FiClock, FiCopy, FiFileText } from 'react-icons/fi';
import { LuLink } from 'react-icons/lu';
import { useRouter, useParams } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProject,
  getProjectMembers,
  getProjectInvitations,
  inviteToProject,
  type Project,
  type ProjectMember,
} from '@/lib/api/projects';
import UserSearchModal from '@/components/UserSearchModal';
import ProjectTeamMembersCard from '@/components/projects/ProjectTeamMembersCard';
import type { SearchUserResult } from '@/lib/api/users';
import PaperVersionTimeline from '@/components/PaperVersionTimeline';
import { getPaperVersions, type PaperVersion } from '@/lib/api/paperVersions';
import {
  cancelMeeting,
  completeMeeting,
  getProjectMeetings,
  getMyDefenses,
  normalizeDefenseSchedule,
  type Defense,
} from '@/lib/api/defenses';
import MeetingScheduleCard from '@/components/meetings/MeetingScheduleCard';
import { PROJECT_MEETINGS_SECTION_ID } from '@/lib/meetings/navigation';
import {
  MEETING_STATUS_FILTER_OPTIONS,
  MEETINGS_FILTER_CONTROL_CLASS,
  meetingMatchesStatusFilter,
  meetingStatusFilterEmptyLabel,
  type MeetingStatusFilter,
} from '@/lib/meetings/statusFilter';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/layout/EmptyState';
import {
  formatPaperStandard,
  formatProjectType,
  statusBadgeVariant,
} from '@/lib/utils/projectDisplay';
import {
  projectDetailFieldRowClassName,
  projectDetailLabelLgClassName,
  projectDetailMetadataBodyTextClassName,
  projectDetailValueWrapClassName,
  projectSummaryDetailTextClassName,
} from '@/lib/utils/formControls';

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

/** Shared height for Meetings card toolbar filter + primary action */
const MEETINGS_TOOLBAR_CONTROL_CLASS = MEETINGS_FILTER_CONTROL_CLASS;

const PROJECT_TITLE_CLASS =
  'font-serif text-2xl font-bold leading-tight text-primary-700 sm:text-3xl';

const PROJECT_TITLE_END_BLEED_CLASS = 'pe-[0.75ch] sm:pe-[1ch]';

function ProjectDetailReadOnlyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={projectDetailFieldRowClassName}>
      <span className={projectDetailLabelLgClassName}>{label}</span>
      <div className={`${projectDetailValueWrapClassName} ${projectDetailMetadataBodyTextClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default function AdviserProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile, handleLogout } = useDashboardUser('Adviser');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [paperVersions, setPaperVersions] = useState<PaperVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [cancelMeetingId, setCancelMeetingId] = useState<string | null>(null);
  const [meetingActionLoading, setMeetingActionLoading] = useState(false);
  const [meetingActionError, setMeetingActionError] = useState<string | null>(null);
  const [meetingStatusFilter, setMeetingStatusFilter] =
    useState<MeetingStatusFilter>('scheduled');

  const filteredMeetings = useMemo(
    () => meetings.filter((meeting) => meetingMatchesStatusFilter(meeting, meetingStatusFilter)),
    [meetings, meetingStatusFilter],
  );

  const loadMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    try {
      const normalizedProjectId = projectId.trim().toLowerCase();
      const [meetingsRes, mineRes] = await Promise.all([
        getProjectMeetings(projectId),
        getMyDefenses(),
      ]);

      const byId = new Map<string, Defense>();
      for (const row of meetingsRes.data || []) {
        if (row?.id) byId.set(row.id, normalizeDefenseSchedule(row));
      }
      for (const row of mineRes.data || []) {
        if (
          row?.id &&
          String(row.project_id).trim().toLowerCase() === normalizedProjectId
        ) {
          byId.set(row.id, normalizeDefenseSchedule(row));
        }
      }

      const rows = Array.from(byId.values()).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );

      if (!rows.length && meetingsRes.error) {
        setMeetingsError(meetingsRes.error);
      } else {
        setMeetings(rows);
      }
    } catch (err) {
      console.error('Failed to fetch project meetings:', err);
      setMeetingsError('Failed to load meetings');
    } finally {
      setMeetingsLoading(false);
    }
  }, [projectId]);

  const loadMembers = async () => {
    const [membersRes, invitesRes] = await Promise.all([
      getProjectMembers(projectId),
      getProjectInvitations(projectId),
    ]);
    setMembers(membersRes.data || []);
    setPendingInvites(invitesRes.data || []);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [projectRes, membersRes, invitesRes] = await Promise.all([
          getProject(projectId),
          getProjectMembers(projectId),
          getProjectInvitations(projectId),
        ]);
        if (!cancelled) {
          if (projectRes.data) setProject(projectRes.data);
          setMembers(membersRes.data || []);
          setPendingInvites(invitesRes.data || []);
        }
        await loadMeetings();
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        setMeetingsLoading(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(loadMembers, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [projectId, loadMeetings]);

  useEffect(() => {
    const refreshMeetings = () => {
      void loadMeetings();
    };
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshMeetings();
      }
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    window.addEventListener('focus', refreshMeetings);
    window.addEventListener('pageshow', refreshMeetings);
    return () => {
      document.removeEventListener('visibilitychange', refreshOnVisible);
      window.removeEventListener('focus', refreshMeetings);
      window.removeEventListener('pageshow', refreshMeetings);
    };
  }, [loadMeetings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== `#${PROJECT_MEETINGS_SECTION_ID}`) return;

    const scrollToMeetings = () => {
      document
        .getElementById(PROJECT_MEETINGS_SECTION_ID)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const timer = window.setTimeout(scrollToMeetings, 100);
    return () => window.clearTimeout(timer);
  }, [meetingsLoading]);

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
    setInviteError(null);
    setInviteSuccess(null);

    const role =
      selectedUser.role === 'adviser' || selectedUser.role === 'teacher' ? 'adviser' : 'member';
    const res = await inviteToProject(projectId, {
      userId: selectedUser.id,
      role,
    });

    if (res.error) {
      setInviteError(res.error);
      setTimeout(() => setInviteError(null), 4000);
    } else {
      setInviteSuccess(`Invitation sent to ${selectedUser.full_name}`);
      setTimeout(() => setInviteSuccess(null), 4000);
      void loadMembers();
    }
  };

  const loadPaperVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const res = await getPaperVersions(projectId);
      if (res.data) {
        setPaperVersions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch paper versions:', err);
    } finally {
      setVersionsLoading(false);
    }
  }, [projectId]);

  const reloadProject = useCallback(async () => {
    const res = await getProject(projectId);
    if (res.data) setProject(res.data);
  }, [projectId]);

  const refreshPaperTimeline = useCallback(async () => {
    await Promise.all([loadPaperVersions(), reloadProject()]);
  }, [loadPaperVersions, reloadProject]);

  useEffect(() => {
    if (projectId) {
      void loadPaperVersions();
    }
  }, [projectId, loadPaperVersions]);

  const handleBookMeeting = () => {
    if (!project) return;
    localStorage.setItem('projectMembers', JSON.stringify(members));

    const query = new URLSearchParams({
      project_id: String(project.id),
      project_code: project.project_code || '',
      title: project.title || '',
    });

    router.push(`/defenses?${query.toString()}`);
  };

  const handleEditMeeting = (meeting: Defense) => {
    if (!project) return;
    const query = new URLSearchParams({
      project_id: String(project.id),
      project_code: project.project_code || '',
      title: project.title || '',
      meeting_id: meeting.id,
    });
    router.push(`/defenses?${query.toString()}`);
  };

  const handleCompleteMeeting = async (meetingId: string) => {
    setMeetingActionLoading(true);
    setMeetingActionError(null);
    try {
      const res = await completeMeeting(meetingId);
      if (res.error) {
        setMeetingActionError(res.error);
        return;
      }
      await loadMeetings();
    } catch {
      setMeetingActionError('Failed to mark meeting as complete.');
    } finally {
      setMeetingActionLoading(false);
    }
  };

  const handleConfirmCancelMeeting = async () => {
    if (!cancelMeetingId) return;
    setMeetingActionLoading(true);
    setMeetingActionError(null);
    try {
      const res = await cancelMeeting(cancelMeetingId);
      if (res.error) {
        setMeetingActionError(res.error);
        return;
      }
      setCancelMeetingId(null);
      await loadMeetings();
    } catch {
      setMeetingActionError('Failed to cancel meeting.');
    } finally {
      setMeetingActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
        <EmptyState
          title="Project not found"
          description="This project may have been removed or you no longer have access."
          action={{
            label: 'Back to My Advisees',
            onClick: () => router.push('/adviser/advisees'),
          }}
        />
      </DashboardLayout>
    );
  }

  const abstractText = project.abstract || project.description || '';

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="project-detail-forms space-y-6">
        {/* Page header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1
              className={`min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${PROJECT_TITLE_CLASS} ${PROJECT_TITLE_END_BLEED_CLASS}`}
            >
              {project.title}
            </h1>
            <Badge variant={statusBadgeVariant(project.status)} className="capitalize shrink-0">
              {project.status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm sm:text-md shrink-0 text-primary-700 hover:bg-primary-50"
            leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
            onClick={() => router.push('/adviser/advisees')}
          >
            Back to Advisees
          </Button>
        </header>

        {/* Summary cards — left: code + timeline; right: details (full height) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2 md:items-stretch">
          <Card className="md:col-start-1 md:row-start-1">
            <CardHeader>
              <LuLink className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Project Code</CardTitle>
              <CardDescription>Reference for this research group</CardDescription>
            </CardHeader>
            <div className="mt-4 flex min-w-0 items-center gap-2">
              <code
                className={`flex-1 min-w-0 break-all rounded-lg bg-neutral-100 px-3 py-2 font-mono text-primary-700 ${projectSummaryDetailTextClassName}`}
              >
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
              <FiFileText className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Project type, paper standard, and class information</CardDescription>
            </CardHeader>
            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <div className="project-detail-inline-fields flex flex-col gap-3 md:gap-3.5">
                  <ProjectDetailReadOnlyRow label="Program">
                    {project.program?.trim() || '—'}
                  </ProjectDetailReadOnlyRow>
                  <ProjectDetailReadOnlyRow label="Course">
                    {project.course?.trim() || '—'}
                  </ProjectDetailReadOnlyRow>
                  <ProjectDetailReadOnlyRow label="Section">
                    {project.section?.trim() || '—'}
                  </ProjectDetailReadOnlyRow>
                  <ProjectDetailReadOnlyRow label="Project Type">
                    {formatProjectType(project.project_type) || '—'}
                  </ProjectDetailReadOnlyRow>
                  <ProjectDetailReadOnlyRow label="Paper Standard">
                    {formatPaperStandard(project.paper_standard) || '—'}
                  </ProjectDetailReadOnlyRow>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Abstract */}
          <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <CardHeader className="shrink-0">
              <CardTitle>Abstract</CardTitle>
              <CardDescription>Project summary from the student team</CardDescription>
            </CardHeader>
            <p
              className={`project-detail-abstract-text min-h-[12rem] flex-1 whitespace-pre-wrap text-neutral-700 lg:min-h-0 ${projectSummaryBodyTextClass}`}
            >
              {abstractText || 'No abstract provided'}
            </p>
          </Card>

          <ProjectTeamMembersCard
            projectId={projectId}
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

        {/* Meetings */}
        <Card id={PROJECT_MEETINGS_SECTION_ID} className="scroll-mt-24">
          <CardHeader>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Meetings</CardTitle>
                <CardDescription>Scheduled sessions for this project</CardDescription>
              </div>
              {!meetingsLoading ? (
                <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-3">
                  <Select
                    aria-label="Filter meetings by status"
                    value={meetingStatusFilter}
                    onChange={(e) =>
                      setMeetingStatusFilter(e.target.value as MeetingStatusFilter)
                    }
                    options={MEETING_STATUS_FILTER_OPTIONS}
                    responsiveText
                    className={`${MEETINGS_TOOLBAR_CONTROL_CLASS} !px-3 !pr-9 min-w-[9.75rem] text-sm`}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    className={`${MEETINGS_TOOLBAR_CONTROL_CLASS} !px-3.5 text-sm`}
                    onClick={handleBookMeeting}
                  >
                    Book a Meeting
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          {meetingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
            </div>
          ) : meetingsError ? (
            <div className="space-y-3">
              <p className="text-sm text-archivumRed py-4 text-center">{meetingsError}</p>
            </div>
          ) : meetings.length > 0 ? (
            filteredMeetings.length > 0 ? (
            <div className="space-y-3">
              {filteredMeetings.map((meeting) => (
                <MeetingScheduleCard
                  key={meeting.id}
                  meeting={meeting}
                  actions={{
                    onEdit: () => handleEditMeeting(meeting),
                    onCancel: () => setCancelMeetingId(meeting.id),
                    onComplete: () => void handleCompleteMeeting(meeting.id),
                    disabled: meetingActionLoading,
                  }}
                />
              ))}
            </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-500">
                No{' '}
                {meetingStatusFilterEmptyLabel(meetingStatusFilter)} to show.
              </p>
            )
          ) : (
            <EmptyState
              title="No meetings scheduled"
              description="Book a meeting to see it listed here for this project."
            />
          )}
          {meetingActionError ? (
            <p className="mt-3 text-center text-sm text-archivumRed">{meetingActionError}</p>
          ) : null}
        </Card>

        <Modal
          isOpen={Boolean(cancelMeetingId)}
          onClose={() => {
            if (!meetingActionLoading) setCancelMeetingId(null);
          }}
          title="Cancel meeting?"
          size="sm"
        >
          <p className="text-sm text-neutral-700">
            This meeting will be marked as cancelled. Students will still see it in the list with
            a cancelled status.
          </p>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelMeetingId(null)}
              disabled={meetingActionLoading}
            >
              Keep meeting
            </Button>
            <Button
              type="button"
              variant="error"
              onClick={() => void handleConfirmCancelMeeting()}
              loading={meetingActionLoading}
              disabled={meetingActionLoading}
            >
              Cancel meeting
            </Button>
          </ModalFooter>
        </Modal>

        {/* Paper versions — timeline includes its own section header */}
        <Card>
          <PaperVersionTimeline
            projectId={project.id}
            paperStandard={project.paper_standard}
            versions={paperVersions}
            loading={versionsLoading}
            onRefresh={refreshPaperTimeline}
            allowUpload={false}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
