'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import { FiArrowLeft, FiClock, FiFileText } from 'react-icons/fi';
import { LuLink } from 'react-icons/lu';
import { useRouter, useParams } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProject,
  getProjectMembers,
  getProjectInvitations,
  type Project,
  type ProjectMember,
} from '@/lib/api/projects';
import ProjectTeamMembersCard from '@/components/projects/ProjectTeamMembersCard';
import PaperVersionTimeline from '@/components/PaperVersionTimeline';
import { getPaperVersions, type PaperVersion } from '@/lib/api/paperVersions';
import { getProjectReviewRequest, type PaperReviewRequest } from '@/lib/api/paperReviews';
import {
  getProjectMeetings,
  normalizeDefenseSchedule,
  type Defense,
} from '@/lib/api/defenses';
import MeetingScheduleCard from '@/components/meetings/MeetingScheduleCard';
import ProjectCodeCopyRow from '@/components/projects/ProjectCodeCopyRow';
import { PROJECT_MEETINGS_SECTION_ID } from '@/lib/meetings/navigation';
import { PROJECT_PAPER_VERSIONS_SECTION_ID } from '@/lib/projects/navigation';
import {
  MEETING_STATUS_FILTER_OPTIONS,
  MEETINGS_FILTER_CONTROL_CLASS,
  meetingMatchesStatusFilter,
  meetingStatusFilterEmptyLabel,
  type MeetingStatusFilter,
} from '@/lib/meetings/statusFilter';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/layout/EmptyState';
import {
  formatPaperStandard,
  formatProjectType,
  statusBadgeVariant,
} from '@/lib/utils/projectDisplay';
import { formatProjectStageLabel } from '@/lib/utils/projectStage';
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

export default function CoordinatorProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, handleLogout } = useDashboardUser('Coordinator');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [paperVersions, setPaperVersions] = useState<PaperVersion[]>([]);
  const [activeReviewRequest, setActiveReviewRequest] = useState<PaperReviewRequest | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [meetingStatusFilter, setMeetingStatusFilter] =
    useState<MeetingStatusFilter>('scheduled');

  const filteredMeetings = useMemo(
    () => meetings.filter((meeting) => meetingMatchesStatusFilter(meeting, meetingStatusFilter)),
    [meetings, meetingStatusFilter],
  );

  const loadMembers = useCallback(async () => {
    const [membersRes, invitesRes] = await Promise.all([
      getProjectMembers(projectId),
      getProjectInvitations(projectId),
    ]);
    setMembers(membersRes.data || []);
    setPendingInvites(invitesRes.data || []);
  }, [projectId]);

  const loadMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    try {
      const meetingsRes = await getProjectMeetings(projectId);
      const rows = (meetingsRes.data || [])
        .filter((row) => row?.id)
        .map((row) => normalizeDefenseSchedule(row))
        .sort(
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
    return () => {
      cancelled = true;
    };
  }, [projectId, loadMeetings]);

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

  const loadReviewRequest = useCallback(async () => {
    const res = await getProjectReviewRequest(projectId);
    setActiveReviewRequest(res.data ?? null);
  }, [projectId]);

  const refreshPaperTimeline = useCallback(async () => {
    await Promise.all([loadPaperVersions(), reloadProject(), loadReviewRequest()]);
  }, [loadPaperVersions, reloadProject, loadReviewRequest]);

  useEffect(() => {
    if (projectId) {
      void loadPaperVersions();
      void loadReviewRequest();
    }
  }, [projectId, loadPaperVersions, loadReviewRequest]);

  if (loading) {
    return (
      <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
        <EmptyState
          title="Project not found"
          description="This project may have been removed or is not in your institution."
          action={{
            label: 'Back to All Projects',
            onClick: () => router.push('/coordinator/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  const abstractText = project.abstract || project.description || '';

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="project-detail-forms space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h1
              className={`min-w-0 w-full flex-1 break-words ${PROJECT_TITLE_CLASS} ${PROJECT_TITLE_END_BLEED_CLASS}`}
            >
              {project.title}
            </h1>

            <div className="flex items-center justify-between gap-2 sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-sm text-primary-700 hover:bg-primary-50"
                leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
                onClick={() => router.push('/coordinator/projects')}
              >
                Back to Projects
              </Button>
              <Badge variant={statusBadgeVariant(project.status)} className="shrink-0">
                {formatProjectStageLabel(project.status)}
              </Badge>
            </div>

            <Badge
              variant={statusBadgeVariant(project.status)}
              className="hidden shrink-0 sm:inline-flex"
            >
              {formatProjectStageLabel(project.status)}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="hidden shrink-0 self-center text-sm text-primary-700 hover:bg-primary-50 sm:inline-flex sm:text-md"
            leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
            onClick={() => router.push('/coordinator/projects')}
          >
            Back to Projects
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2 md:items-stretch">
          <Card className="md:col-start-1 md:row-start-1">
            <CardHeader>
              <LuLink className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Project Code</CardTitle>
              <CardDescription>Reference for this research group</CardDescription>
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
            viewerContext="coordinator"
            onMembersChange={loadMembers}
            onInviteClick={() => {}}
          />
        </div>

        <Card id={PROJECT_MEETINGS_SECTION_ID} className="scroll-mt-24">
          <CardHeader>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Meetings</CardTitle>
                <CardDescription>Scheduled sessions for this project</CardDescription>
              </div>
              {!meetingsLoading ? (
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
              ) : null}
            </div>
          </CardHeader>
          {meetingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
            </div>
          ) : meetingsError ? (
            <p className="py-4 text-center text-sm text-archivumRed">{meetingsError}</p>
          ) : meetings.length > 0 ? (
            filteredMeetings.length > 0 ? (
              <div className="space-y-3">
                {filteredMeetings.map((meeting) => (
                  <MeetingScheduleCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-500">
                No {meetingStatusFilterEmptyLabel(meetingStatusFilter)} to show.
              </p>
            )
          ) : (
            <EmptyState
              title="No meetings scheduled"
              description="Meetings booked for this project will appear here."
            />
          )}
        </Card>

        <Card id={PROJECT_PAPER_VERSIONS_SECTION_ID} className="scroll-mt-24">
          <PaperVersionTimeline
            projectId={project.id}
            paperStandard={project.paper_standard}
            versions={paperVersions}
            loading={versionsLoading}
            onRefresh={refreshPaperTimeline}
            allowUpload={false}
            activeReviewRequest={activeReviewRequest}
            canCompleteReview={false}
            onReviewChange={loadReviewRequest}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
