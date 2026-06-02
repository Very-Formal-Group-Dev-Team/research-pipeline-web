'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { FiArrowLeft, FiCheck, FiClock, FiCopy, FiFileText } from 'react-icons/fi';
import { LuLink } from 'react-icons/lu';
import { useRouter, useParams } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { getProject, getProjectMembers, type Project, type ProjectMember } from '@/lib/api/projects';
import PaperVersionTimeline from '@/components/PaperVersionTimeline';
import { getPaperVersions, type PaperVersion } from '@/lib/api/paperVersions';
import { getProjectMeetings, getMyDefenses, normalizeDefenseSchedule, type Defense } from '@/lib/api/defenses';
import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import { isOnlineModality, normalizeJitsiJoinUrl } from '@/lib/meetings/jitsi';
import EmptyState from '@/components/layout/EmptyState';

function formatMeetingDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMeetingTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatProjectDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

function statusBadgeVariant(status: string): 'primary' | 'warning' | 'success' | 'default' {
  const s = status.toLowerCase();
  if (s === 'draft') return 'warning';
  if (s === 'active') return 'primary';
  if (s === 'completed' || s === 'archived') return 'success';
  return 'default';
}

const summaryDetailTextClass = 'text-sm md:text-md text-neutral-700';

export default function AdviserProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, handleLogout } = useDashboardUser('Adviser');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [paperVersions, setPaperVersions] = useState<PaperVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [meetings, setMeetings] = useState<Defense[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const loadMeetings = async () => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    try {
      const normalizedProjectId = projectId.trim().toLowerCase();
      const meetingsRes = await getProjectMeetings(projectId);
      let rows = (meetingsRes.data || []).map(normalizeDefenseSchedule);

      if (!rows.length) {
        const mineRes = await getMyDefenses();
        rows = (mineRes.data || [])
          .filter((row) => String(row.project_id).trim().toLowerCase() === normalizedProjectId)
          .map(normalizeDefenseSchedule);
      }

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
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, membersRes] = await Promise.all([
          getProject(projectId),
          getProjectMembers(projectId),
        ]);
        if (projectRes.data) setProject(projectRes.data);
        if (membersRes.data) setMembers(membersRes.data);
        await loadMeetings();
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        setMeetingsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

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
  const studentMembers = members.filter((m) => m.role === 'leader' || m.role === 'member');

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="min-w-0 truncate text-2xl font-bold text-primary-700 sm:text-3xl">
              {project.title}
            </h1>
            <Badge variant={statusBadgeVariant(project.status)} className="capitalize shrink-0">
              {project.status}
            </Badge>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-700 hover:bg-primary-50"
              leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
              onClick={() => router.push('/adviser/advisees')}
            >
              Back to Advisees
            </Button>
            <Button variant="primary" onClick={handleBookMeeting}>
              Book a Meeting
            </Button>
          </div>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <LuLink className="mb-2 text-2xl text-primary-500" aria-hidden />
              <CardTitle>Project Code</CardTitle>
              <CardDescription>Reference for this research group</CardDescription>
            </CardHeader>
            <div className="mt-4 flex min-w-0 items-center gap-2">
              <code className="flex-1 min-w-0 break-all rounded-lg bg-neutral-100 px-3 py-2 font-mono text-sm text-primary-700">
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
            <CardTitle>Abstract</CardTitle>
            <CardDescription>Project summary from the student team</CardDescription>
          </CardHeader>
          <p className="text-neutral-700 whitespace-pre-wrap">
            {abstractText || 'No abstract provided'}
          </p>
        </Card>

        {/* Team members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {studentMembers.length > 0
                ? `${studentMembers.length} ${studentMembers.length === 1 ? 'member' : 'members'} on this project`
                : 'No student members yet'}
            </CardDescription>
          </CardHeader>
          {members.length > 0 ? (
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
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 py-4 text-center">No team members found</p>
          )}
        </Card>

        {/* Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>Meetings</CardTitle>
            <CardDescription>Scheduled sessions for this project</CardDescription>
          </CardHeader>
          {meetingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
            </div>
          ) : meetingsError ? (
            <p className="text-sm text-archivumRed py-4 text-center">{meetingsError}</p>
          ) : meetings.length > 0 ? (
            <div className="space-y-3">
              {meetings.map((meeting) => {
                const online = isOnlineModality(meeting.modality);
                const joinUrl = normalizeJitsiJoinUrl(
                  meeting.meeting_url,
                  meeting.meeting_room,
                );
                const venue = meeting.venue?.trim() || meeting.location?.trim();

                return (
                  <div
                    key={meeting.id}
                    className="rounded-lg border border-neutral-300 bg-white p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-lg font-semibold text-eerieBlack capitalize">
                          {meeting.defense_type} meeting
                        </p>
                        <p className="text-sm text-neutral-600 mt-0.5">
                          {formatModalityLabel(meeting.modality)}
                        </p>
                      </div>
                      <Badge variant="default" className="capitalize shrink-0">
                        {meeting.status_label || meeting.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-neutral-700">
                      <p>
                        <span className="font-medium text-neutral-900">Date:</span>{' '}
                        {formatMeetingDate(meeting.start_time)}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-900">Time:</span>{' '}
                        {formatMeetingTime(meeting.start_time)}
                        {meeting.end_time ? ` – ${formatMeetingTime(meeting.end_time)}` : ''}
                      </p>
                    </div>

                    {online ? (
                      <div className="space-y-2 border-t border-neutral-200 pt-3 text-sm text-neutral-700">
                        <div>
                          <p className="font-medium text-neutral-900">Meeting link</p>
                          {joinUrl ? (
                            <a
                              href={joinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-oxfordBlue break-all hover:underline"
                            >
                              {joinUrl}
                            </a>
                          ) : (
                            <p className="text-neutral-500">
                              Link will be available once the meeting is confirmed.
                            </p>
                          )}
                        </div>
                        <JoinMeetingButton
                          meeting_url={meeting.meeting_url}
                          meeting_room={meeting.meeting_room}
                          label="Join Meeting"
                          size="sm"
                        />
                      </div>
                    ) : (
                      <div className="border-t border-neutral-200 pt-3 text-sm text-neutral-700">
                        <p className="font-medium text-neutral-900">Venue</p>
                        <p>{venue || 'Venue not specified'}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No meetings scheduled"
              description="Book a meeting to see it listed here for this project."
              action={{
                label: 'Book a Meeting',
                onClick: handleBookMeeting,
              }}
            />
          )}
        </Card>

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
