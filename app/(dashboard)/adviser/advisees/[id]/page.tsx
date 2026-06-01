'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { FiArrowLeft, FiCalendar, FiClock, FiUsers, FiFileText, FiMapPin, FiVideo } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import StatusIcon from '@/components/StatusIcon';
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

function formatModalityLabel(modality?: string | null) {
  if (!modality) return 'Not specified';
  const normalized = modality.trim().toLowerCase();
  if (normalized === 'face-to-face' || normalized === 'face to face') return 'Face to face';
  if (normalized === 'online') return 'Online';
  if (normalized === 'hybrid') return 'Hybrid';
  return modality;
}

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
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Loading project details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row">
          <div className="flex items-left gap-5 flex-col lg:items-center lg:gap-12 lg:flex-row">
            <button
              onClick={() => router.push('/adviser/advisees')}
              className="flex gap-2 items-center font-medium rounded-lg
                      transition-all duration-200
                      focus:outline-none hover:shadow-[0_4px_12px_rgba(229,231,235,0.4)] active:shadow-[0_2px_8px_rgba(229,231,235,0.5)]
                      disabled:cursor-not-allowed disabled:opacity-60
                      text-darkSlateBlue hover:bg-neutral-100 focus:ring-neutral-300 disabled:text-neutral-400
                      py-2.5 text-base"
            >
              <FiArrowLeft /> Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary-700">{project.title}</h1>
              <p className="text-neutral-600 mt-1">Project Details</p>
            </div>
          </div>
          <div className="flex items-left flex-col lg:items-center lg:flex-row gap-4">
            <StatusIcon status={project.status} />
            <Button
              onClick={
                handleBookMeeting}
              className="bg-navy hover:bg-navy/10 text-white"
            >
              Book a Meeting
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <p className="mt-4 text-neutral-700">
                {project.description || 'No description provided'}
              </p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiUsers /> Team Members
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div 
                        key={member.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          member.role === 'leader' ? 'bg-primary-50 border-2 border-primary-200' : 'bg-neutral-100 border border-neutral-200'
                        }`}
                      >
                        <div className="w-full flex items-center gap-3">
                          <Avatar 
                            src={member.users?.avatar_url || undefined} 
                            name={member.users?.full_name || 'Unknown'} 
                            size="md"
                          />
                          <div className='flex flex-1 flex-col lg:flex-row lg:items-center lg:justify-between'>
                            <div>
                              <p className={`font-medium ${member.role === 'leader' ? 'font-semibold text-primary-900' : 'text-neutral-900'}`}>
                                {member.users?.full_name || 'Unknown'}
                              </p>
                              <p className={`text-sm ${member.role === 'leader' ? 'text-primary-700' : 'text-neutral-600'}`}>
                                {member.users?.email}
                              </p>
                            </div>
                            <div className='mt-2 lg:mt-0'>
                              <Badge variant="default" className="capitalize">
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-600 text-center py-4">
                      No team members found
                    </p>
                  )}
                </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiCalendar /> Meetings
                </CardTitle>
              </CardHeader>
              <div className="mt-4">
                {meetingsLoading ? (
                  <p className="text-neutral-600 text-center py-4">Loading meetings...</p>
                ) : meetingsError ? (
                  <p className="text-red-600 text-center py-4 text-sm">{meetingsError}</p>
                ) : meetings.length > 0 ? (
                  <div className="space-y-4">
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
                          className="rounded-lg border border-neutral-200 bg-neutral-100 p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-primary-800 capitalize">
                                {meeting.defense_type} meeting
                              </p>
                              <p className="text-sm text-neutral-600 mt-0.5">
                                {formatModalityLabel(meeting.modality)}
                              </p>
                            </div>
                            <Badge
                              variant={meeting.status === 'cancelled' ? 'default' : 'primary'}
                              className="capitalize"
                            >
                              {meeting.status_label || meeting.status}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-neutral-700">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-accent-500 flex-shrink-0" />
                              <span>{formatMeetingDate(meeting.start_time)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiClock className="text-accent-500 flex-shrink-0" />
                              <span>
                                {formatMeetingTime(meeting.start_time)}
                                {meeting.end_time
                                  ? ` – ${formatMeetingTime(meeting.end_time)}`
                                  : ''}
                              </span>
                            </div>
                          </div>

                          {online ? (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-start gap-2 text-sm text-neutral-700">
                                <FiVideo className="text-accent-500 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="font-medium text-neutral-800">Meeting link</p>
                                  {joinUrl ? (
                                    <a
                                      href={joinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-700 break-all hover:underline"
                                    >
                                      {joinUrl}
                                    </a>
                                  ) : (
                                    <p className="text-neutral-500">
                                      Link will be available once the meeting is confirmed.
                                    </p>
                                  )}
                                </div>
                              </div>
                              <JoinMeetingButton
                                meeting_url={meeting.meeting_url}
                                meeting_room={meeting.meeting_room}
                                label="Join Meeting"
                                size="sm"
                              />
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 text-sm text-neutral-700 pt-1">
                              <FiMapPin className="text-accent-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-neutral-800">Venue</p>
                                <p>{venue || 'Venue not specified'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={<FiCalendar />}
                    title="No meetings scheduled"
                    description="Book a meeting to see it listed here for this project."
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiFileText /> Project Details
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm text-neutral-600">Project Code</p>
                  <p className="font-mono font-semibold text-primary-700">{project.project_code}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Type</p>
                  <p className="font-medium capitalize">{project.project_type}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Status</p>
                  <p className="font-medium capitalize">{project.status}</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiClock /> Timeline
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm text-neutral-600">Created</p>
                  <p className="font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Last Updated</p>
                  <p className="font-medium">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Paper Version Control - Full Width */}
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