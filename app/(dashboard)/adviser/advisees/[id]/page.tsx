'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { FiArrowLeft, FiCheck, FiClock, FiCopy, FiFileText, FiMoreVertical } from 'react-icons/fi';
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
import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import {
  formatMeetingStatusLabel,
  formatMeetingVenueDisplay,
  meetingStatusBadgeVariant,
} from '@/lib/meetings/display';
import { PROJECT_MEETINGS_SECTION_ID } from '@/lib/meetings/navigation';
import Dropdown from '@/components/ui/Dropdown';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { isOnlineModality, normalizeJitsiJoinUrl } from '@/lib/meetings/jitsi';
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

function formatMeetingTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMeetingDateCompact(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
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

function formatModalityLabel(modality?: string | null) {
  if (!modality) return 'Not specified';
  const normalized = modality.trim().toLowerCase();
  if (normalized === 'face-to-face' || normalized === 'face to face') return 'Face to face';
  if (normalized === 'online') return 'Online';
  if (normalized === 'hybrid') return 'Hybrid';
  return modality;
}

const projectSummaryBodyTextClass = `${projectSummaryDetailTextClassName} text-neutral-700`;

/** Meeting card typography — body text-md from md up; title one step above (xl at lg) */
const MEETING_CARD_BODY_CLASS = 'text-sm leading-tight md:text-md';
const MEETING_CARD_TITLE_CLASS =
  'text-md font-semibold leading-tight sm:text-lg md:text-xl';

/** Shared height for Meetings card toolbar filter + primary action */
const MEETINGS_TOOLBAR_CONTROL_CLASS =
  'h-9 min-h-9 max-h-9 shrink-0 box-border !py-0 inline-flex items-center';

type MeetingStatusFilter = 'scheduled' | 'completed' | 'cancelled' | 'all';

const MEETING_STATUS_FILTER_OPTIONS: { value: MeetingStatusFilter; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'Show all' },
];

function meetingMatchesStatusFilter(
  meeting: Defense,
  filter: MeetingStatusFilter,
): boolean {
  const status = (meeting.status || '').toLowerCase();
  if (filter === 'all') return true;
  if (filter === 'completed') return status === 'completed';
  if (filter === 'cancelled') return status === 'cancelled';
  return status === 'scheduled' || status === 'pending' || status === 'rescheduled';
}

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
  const { user, handleLogout } = useDashboardUser('Adviser');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadPaperVersions = async () => {
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
  };

  useEffect(() => {
    if (projectId) {
      loadPaperVersions();
    }
  }, [projectId]);

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

          {/* Team members */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'member' : 'members'}
                {pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
              </CardDescription>
            </CardHeader>

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
                    src={member.users?.avatar_url || undefined}
                    name={member.users?.full_name || 'Unknown'}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-neutral-900 truncate">
                        {member.users?.full_name || 'Unknown'}
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
                      className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <Avatar
                        src={invite.users?.avatar_url}
                        name={invite.users?.full_name || invite.users?.email || 'Unknown'}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-neutral-800 truncate">
                          {invite.users?.full_name || 'Unknown User'}
                        </h4>
                        <p className="mt-0.5 text-sm text-neutral-600 break-all">{invite.users?.email}</p>
                      </div>
                      <Badge
                        variant={invite.role === 'adviser' ? 'success' : 'default'}
                        className="capitalize shrink-0"
                      >
                        {invite.role}
                      </Badge>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-neutral-500">No team members found</p>
          )}
          </Card>
        </div>

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
              {filteredMeetings.map((meeting) => {
                const online = isOnlineModality(meeting.modality);
                const joinUrl = normalizeJitsiJoinUrl(
                  meeting.meeting_url,
                  meeting.meeting_room,
                );
                const venueDisplay = formatMeetingVenueDisplay(
                  meeting.location,
                  meeting.venue,
                );
                const meetingHeading =
                  meeting.meeting_title?.trim() ||
                  `${meeting.defense_type} meeting`;
                const timeRange = meeting.end_time
                  ? `${formatMeetingTime(meeting.start_time)} – ${formatMeetingTime(meeting.end_time)}`
                  : formatMeetingTime(meeting.start_time);
                const statusKey = (meeting.status || '').toLowerCase();
                const isTerminalStatus =
                  statusKey === 'cancelled' || statusKey === 'completed';

                const locationLine = online
                  ? formatModalityLabel(meeting.modality)
                  : [formatModalityLabel(meeting.modality), venueDisplay || 'Venue not specified']
                      .filter(Boolean)
                      .join(' · ');

                return (
                  <article
                    key={meeting.id}
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <h4
                        className={`min-w-0 flex-1 font-serif text-eerieBlack ${MEETING_CARD_TITLE_CLASS} ${
                          meeting.meeting_title?.trim() ? '' : 'capitalize'
                        }`}
                      >
                        {meetingHeading}
                      </h4>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge
                          variant={meetingStatusBadgeVariant(meeting.status)}
                          size="sm"
                          className="capitalize md:px-2.5 md:py-1 md:text-sm"
                        >
                          {formatMeetingStatusLabel(meeting.status, meeting.status_label)}
                        </Badge>
                        <Dropdown
                          align="right"
                          trigger={
                            <button
                              type="button"
                              className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                              aria-label="Meeting options"
                            >
                              <FiMoreVertical className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                            </button>
                          }
                          items={[
                            {
                              label: 'Edit',
                              value: 'edit',
                              onClick: () => handleEditMeeting(meeting),
                              disabled: isTerminalStatus || meetingActionLoading,
                            },
                            {
                              label: 'Cancel',
                              value: 'cancel',
                              danger: true,
                              onClick: () => setCancelMeetingId(meeting.id),
                              disabled: isTerminalStatus || meetingActionLoading,
                            },
                            {
                              label: 'Mark as complete',
                              value: 'complete',
                              onClick: () => void handleCompleteMeeting(meeting.id),
                              disabled: isTerminalStatus || meetingActionLoading,
                            },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className={`min-w-0 space-y-0.5 ${MEETING_CARD_BODY_CLASS}`}>
                        <p className="text-neutral-600">{locationLine}</p>
                        <p className="font-medium text-neutral-900 tabular-nums">
                          {formatMeetingDateCompact(meeting.start_time)}
                        </p>
                        <p className="text-neutral-600 tabular-nums">{timeRange}</p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-end">
                        {online && joinUrl && !isTerminalStatus ? (
                          <JoinMeetingButton
                            meeting_url={meeting.meeting_url}
                            meeting_room={meeting.meeting_room}
                            label="Join Meeting"
                            size="sm"
                            className="md:!text-base"
                          />
                        ) : online && !joinUrl && !isTerminalStatus ? (
                          <p
                            className={`max-w-[11rem] text-right text-neutral-500 ${MEETING_CARD_BODY_CLASS}`}
                          >
                            Link available when confirmed
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-500">
                No{' '}
                {meetingStatusFilter === 'all'
                  ? 'meetings'
                  : `${MEETING_STATUS_FILTER_OPTIONS.find((o) => o.value === meetingStatusFilter)?.label.toLowerCase() ?? meetingStatusFilter} meetings`}{' '}
                to show.
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
            onRefresh={loadPaperVersions}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
