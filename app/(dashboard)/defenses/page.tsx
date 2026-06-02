//Urri Tomas is my best
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { type ProjectMember } from '@/lib/api/projects';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Button from '@/components/Button';
import { FiArrowLeft } from 'react-icons/fi';
import { formControlTextSizeClassName, formLabelClassName } from '@/lib/utils/formControls';
import JoinMeetingButton from '@/components/meetings/JoinMeetingButton';
import { buildMeetingBookingPayload, meetingToBookingForm } from '@/lib/meetings/bookingForm';
import { getMeeting } from '@/lib/api/defenses';
import { createPortal } from 'react-dom';

interface ScheduledDefense {
  id: string;
  project_title: string;
  project_code: string;
  meeting_title?: string | null;
  start_time: string;
  end_time: string;
  scheduled_at?: string;
  defense_type: string;
  location: string;
  modality: string;
  status: string;
  status_label: string;
  meeting_url?: string | null;
  meeting_room?: string | null;
}

interface OverlapConflict {
  domain: string;
  defense_id: string;
  project_id: string;
  overlap_minutes: number;
  remaining_minutes: number;
}

interface OverlapConflictResponse {
  conflict: true;
  conflicts: OverlapConflict[];
  max_overlap_minutes: number;
  candidate_total_minutes: number;
  effective_minutes: number;
  effective_start_time: string;
  message: string;
}

function parseNaiveDate(iso?: string | null) {
  if (!iso) return null;
  // The API stores wall-clock datetimes without timezone info but
  // JSON serialisation may add a trailing "Z".  Strip it so the
  // browser interprets the value as local time, not UTC.
  const parsed = new Date(iso.replace(/Z$/i, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(iso?: string | null) {
  const parsed = parseNaiveDate(iso);
  if (!parsed) return '-';
  return parsed.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true,
  });
}

function computeTotalTime(start?: string | null, end?: string | null) {
  const startDate = parseNaiveDate(start);
  const endDate = parseNaiveDate(end);
  if (!startDate || !endDate) return '-';

  const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function normalizeDefense(item: any): ScheduledDefense {
  const start = item?.start_time || item?.scheduled_at || '';
  return {
    ...item,
    start_time: start,
    end_time: item?.end_time || '',
  };
}

function formatMinutes(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

const statusColors: Record<string, string> = {
  Scheduled: 'bg-success-100 text-success-700',
  Pending: 'bg-warning-100 text-warning-700',
  Cancelled: 'bg-error-100 text-error-700',
  Rescheduled: 'bg-accent-100 text-accent-700',
  Completed: 'bg-primary-100 text-primary-700',
};

export default function MeetingSchedule() {
  const { user, isLoading, handleLogout } = useDashboardUser('Adviser');

  const router = useRouter();
  const searchParams = useSearchParams();

  const [defenses, setDefenses] = useState<ScheduledDefense[]>([]);
  const [defensesLoading, setDefensesLoading] = useState(true);
  const [editFormLoading, setEditFormLoading] = useState(false);

  const editingMeetingId = searchParams.get('meeting_id');
  const isEditMode = Boolean(editingMeetingId);

  const [form, setForm] = useState({
    projectId: '',
    projectCode: '',
    projectTitle: '',
    section: '',
    startTime: '',
    endTime: '',
    date: '',
    meetingType: 'Online',
    defenseType: 'Proposal',
    roomOption: '',
    meetingTitle: '',
  });

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectLookupLoading, setProjectLookupLoading] = useState(false);

  //Clear Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false); 
  const [isDirty, setIsDirty] = useState(false);

  // Meeting action modals
  const [selectedDefense, setSelectedDefense] = useState<ScheduledDefense | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<ScheduledDefense | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', startTime: '', endTime: '' });

  // Cancel meeting confirmation modal
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<OverlapConflictResponse | null>(null);
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState<Record<string, unknown> | null>(null);

  // In-app toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  //Mark form as dirty if any field changes
  useEffect(() => {
    const hasChanges = Object.values(form).some(v => v !== '');
    setIsDirty(hasChanges);
  }, [form]);

  useEffect(() => {
    const projectId = searchParams.get('project_id');
    const projectCode = searchParams.get('project_code');
    const title = searchParams.get('title');
    if (projectId || projectCode || title) {
      setForm(prev => ({
        ...prev,
        projectId: projectId || prev.projectId,
        projectCode: projectCode || prev.projectCode,
        projectTitle: title || prev.projectTitle,
      }));
    }

    // Load members passed from advisees detail page
    const storedMembers = localStorage.getItem('projectMembers');
    if (storedMembers) {
      try {
        setProjectMembers(JSON.parse(storedMembers));
      } catch (err) {
        console.error('Failed to parse stored members:', err);
      }
      localStorage.removeItem('projectMembers');
    }
  }, [searchParams]);

  useEffect(() => {
    const meetingId = searchParams.get('meeting_id');
    if (!meetingId) return;

    const meetingIdForEdit = meetingId;
    let cancelled = false;
    async function loadMeetingForEdit() {
      setEditFormLoading(true);
      try {
        const res = await getMeeting(meetingIdForEdit);
        if (cancelled) return;
        if (res.data) {
          setForm((prev) => ({
            ...prev,
            ...meetingToBookingForm(res.data!),
          }));
        } else {
          showToast(res.error || 'Failed to load meeting for editing.', 'error');
        }
      } finally {
        if (!cancelled) setEditFormLoading(false);
      }
    }

    void loadMeetingForEdit();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    let cleared = false;
    async function fetchDefenses() {
      try {
        const res = await fetch('/api/defenses', { credentials: 'include' }); 
        if (!res.ok) throw new Error('Failed to fetch defenses');
        const data = await res.json();
        if (!cleared) {
          const normalized = Array.isArray(data) ? data.map(normalizeDefense) : [];
          setDefenses(normalized);
        }
      } catch (err) {
        console.error('Failed to load defenses:', err);
      } finally {
        if (!cleared) setDefensesLoading(false);
      }
    }
    fetchDefenses();
    return () => { cleared = true; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      ...(name === 'projectCode' ? { projectId: '' } : {}),
    }));
  };

  const resolveProjectIdFromCode = async (projectCode: string) => {
    if (!projectCode?.trim()) return null;
    setProjectLookupLoading(true);
    try {
      const res = await fetch(
        `/api/projects/code/${encodeURIComponent(projectCode.trim())}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (!res.ok) return null;
      if (data?.id) {
        setForm(prev => ({ ...prev, projectId: data.id }));
        return data.id;
      }
      return null;
    } catch (err) {
      console.error('Project lookup failed:', err);
      return null;
    } finally {
      setProjectLookupLoading(false);
    }
  };

  async function refreshDefenses() {
    const refreshRes = await fetch('/api/defenses', { credentials: 'include' });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      const normalized = Array.isArray(data) ? data.map(normalizeDefense) : [];
      setDefenses(normalized);
    }
  }

  const submitDefense = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/defenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data = await res.json();

    if (res.status === 409 && data?.conflict) {
      setOverlapWarning(data as OverlapConflictResponse);
      setPendingSubmitPayload(payload);
      return;
    }

    if (!res.ok) {
      throw new Error(data?.error || 'Failed to book meeting.');
    }

    const createdStatus = data?.status || data?.data?.status;
    if (createdStatus === 'pending') {
      showToast('Meeting added to wait queue. It will be auto-scheduled when the slot opens.', 'info');
    } else {
      showToast('Meeting booked successfully.', 'success');
    }
    setOverlapWarning(null);
    setPendingSubmitPayload(null);
    handleClear();
    await refreshDefenses();
  };

  const handleWaitForSlot = async () => {
    if (!pendingSubmitPayload || isEditMode) return;
    try {
      await submitDefense({ ...pendingSubmitPayload, wait_for_slot: true });
    } catch (err: any) {
      showToast(err.message || 'Failed to queue meeting.', 'error');
    }
  };

  const submitMeetingUpdate = async (payload: Record<string, unknown>) => {
    if (!editingMeetingId) return;

    const res = await fetch(`/api/defenses/${editingMeetingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data = await res.json();

    if (res.status === 409 && data?.conflict) {
      setOverlapWarning(data as OverlapConflictResponse);
      setPendingSubmitPayload(payload);
      return;
    }

    if (!res.ok) {
      throw new Error(data?.error || 'Failed to update meeting.');
    }

    showToast('Meeting updated successfully.', 'success');
    setOverlapWarning(null);
    setPendingSubmitPayload(null);

    const projectId = form.projectId || searchParams.get('project_id');
    if (projectId) {
      router.push(`/adviser/advisees/${projectId}`);
    } else {
      handleClear();
      await refreshDefenses();
    }
  };

  const handleSubmit = async () => {
    try {
      let projectId = form.projectId;
      if (!projectId && form.projectCode?.trim()) {
        projectId = await resolveProjectIdFromCode(form.projectCode);
      }

      if (!projectId) {
        showToast('Please enter a valid project code before booking the meeting.', 'error');
        return;
      }

      const meetingTitle = form.meetingTitle.trim();
      if (!meetingTitle) {
        showToast('Please enter a meeting title.', 'error');
        return;
      }

      if (form.meetingType === 'Face-to-Face' && !form.roomOption) {
        showToast('Please select a room for face-to-face meetings.', 'error');
        return;
      }

      const payload = buildMeetingBookingPayload({
        ...form,
        projectId,
        meetingTitle,
      });

      if (isEditMode) {
        await submitMeetingUpdate(payload);
      } else {
        await submitDefense(payload);
      }
    } catch (err: any) {
      showToast(err.message || (isEditMode ? 'Failed to update meeting.' : 'Failed to book meeting.'), 'error');
    }
  };

  const handleCancelMeeting = async (defenseId: string) => {
    try {
      const res = await fetch(`/api/defenses/${defenseId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel meeting.');
      showToast('Meeting cancelled successfully.', 'success');
      setCancelConfirmId(null);
      setSelectedDefense(null);
      await refreshDefenses();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel meeting.', 'error');
    }
  };

  const handleRescheduleMeeting = async () => {
    if (!rescheduleModal) return;
    try {
      const res = await fetch(`/api/defenses/${rescheduleModal.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: `${rescheduleForm.date}T${rescheduleForm.startTime}:00`,
          end_time: `${rescheduleForm.date}T${rescheduleForm.endTime}:00`,
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule meeting.');
      showToast('Meeting rescheduled successfully.', 'success');
      setRescheduleModal(null);
      setSelectedDefense(null);
      await refreshDefenses();
    } catch (err: any) {
      showToast(err.message || 'Failed to reschedule meeting.', 'error');
    }
  };

  //  Handle Clear Button Click with modal
  const handleClearClick = () => {
    if (isDirty) {
      setIsCancelModalOpen(true); // show modal if there are unsaved changes
    } else {
      handleClear(); // clear immediately if form is clean
    }
  };

  const handleClear = () => {
    setForm({
      projectId: '',
      projectCode: '',
      projectTitle: '',
      section: '',
      startTime: '',
      endTime: '',
      date: '',
      meetingType: 'Online',
      defenseType: 'Proposal',
      roomOption: '',
      meetingTitle: '',
    });
  };

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      {/* In-app toast notification */}
      {toast &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
            toast.type === 'success' ? 'bg-success-100 text-success-700 border border-success-200' :
            toast.type === 'error' ? 'bg-error-100 text-error-700 border border-error-200' :
            'bg-primary-100 text-primary-700 border border-primary-200'
          }`}>
            <div className="flex items-center justify-between">
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-3 opacity-60 hover:opacity-100">&times;</button>
            </div>
          </div>,
          document.body
        )}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary-700">Meeting Schedule</h1>
                <p className="text-neutral-600 mt-1">
                  Manage your meeting availability and scheduled sessions
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 self-start text-primary-700 hover:bg-primary-50"
                leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
                onClick={() => {
                  const projectId = searchParams.get('project_id');
                  if (projectId) {
                    router.push(`/adviser/advisees/${projectId}`);
                  } else {
                    router.push('/adviser/advisees');
                  }
                }}
              >
                {searchParams.get('project_id') ? 'Back to Project' : 'Back to Advisees'}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{isEditMode ? 'Edit Meeting' : 'Book a Meeting'}</CardTitle>
                <CardDescription>
                  {isEditMode
                    ? 'Update the meeting title, schedule, and location for this session'
                    : 'Enter a project code and time slot to schedule a session with your advisee group'}
                </CardDescription>
              </CardHeader>

              {editFormLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
                </div>
              ) : (
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit();
                }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Project Code"
                    type="text"
                    name="projectCode"
                    value={form.projectCode || ''}
                    onChange={handleChange}
                    placeholder="Enter project code"
                    responsiveText
                    fullWidth
                    disabled={isEditMode}
                  />
                  <Input
                    label="Meeting Title"
                    type="text"
                    name="meetingTitle"
                    value={form.meetingTitle || ''}
                    onChange={handleChange}
                    placeholder="e.g. Proposal review"
                    responsiveText
                    fullWidth
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    name="date"
                    value={form.date || ''}
                    onChange={handleChange}
                    responsiveText
                    fullWidth
                  />
                  <Input
                    label="Start Time"
                    type="time"
                    name="startTime"
                    value={form.startTime || ''}
                    onChange={handleChange}
                    responsiveText
                    fullWidth
                  />
                  <Input
                    label="End Time"
                    type="time"
                    name="endTime"
                    value={form.endTime || ''}
                    onChange={handleChange}
                    responsiveText
                    fullWidth
                  />
                </div>

                <div className="space-y-3">
                  <p className={formLabelClassName}>Meeting Type</p>
                  <div className="flex flex-wrap gap-6">
                    {['Online', 'Face-to-Face'].map((type) => (
                      <label
                        key={type}
                        className={`flex items-center gap-2 cursor-pointer text-neutral-700 ${formControlTextSizeClassName}`}
                      >
                        <input
                          type="radio"
                          name="meetingType"
                          value={type}
                          checked={form.meetingType === type}
                          onChange={handleChange}
                          className="accent-primary-500"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {form.meetingType === 'Face-to-Face' ? (
                  <Select
                    label="Room"
                    name="roomOption"
                    placeholder="Select a room"
                    value={form.roomOption || ''}
                    onChange={handleChange}
                    responsiveText
                    fullWidth
                    options={[
                      { value: 'room1', label: 'Room 1' },
                      { value: 'room2', label: 'Room 2' },
                      { value: 'room3', label: 'Room 3' },
                    ]}
                  />
                ) : null}

                <div className="flex justify-start pt-2">
                  <div className="inline-grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-w-[8.5rem]"
                      onClick={handleClearClick}
                    >
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full min-w-[8.5rem]"
                      disabled={projectLookupLoading}
                      loading={projectLookupLoading}
                    >
                      {isEditMode ? 'Save Changes' : 'Book Meeting'}
                    </Button>
                  </div>
                </div>
              </form>
              )}
            </Card>

            {/* Scheduled Meetings Table */}
            <div className="pt-6">
              <h1 className="text-3xl font-bold text-primary-700">Recent Scheduled Meetings</h1>
              <Card className="border border-neutral-300 mt-4 overflow-hidden">
                {defensesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-neutral-500">Loading meetings...</p>
                  </div>
                ) : defenses.length === 0 ? (
                  <table className="w-full text-sm text-left">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 font-medium text-neutral-600">Project Title</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Project Code</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Start Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">End Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Total Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                          <tr>
                            <td colSpan={5} className="py-12">
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-neutral-500">No scheduled meetings yet</p>
                              </div>
                            </td>
                          </tr>
                      </tbody>
                  </table>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-neutral-100 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 font-medium text-neutral-600">Project Title</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Project Code</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Start Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">End Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Total Time</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Modality</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {defenses.map((d) => {
                          const statusStyles: Record<string, string> = {
                            pending: 'bg-warning-100 text-warning-700',
                            approved: 'bg-success-100 text-success-700',
                            moved: 'bg-accent-100 text-accent-700',
                            rejected: 'bg-error-100 text-error-700',
                          };
                          const style = statusStyles[d.status] || 'bg-neutral-200 text-neutral-600';
                          return (
                            <tr key={d.id} className="hover:bg-coordinator-neutral-50 cursor-pointer">
                              <td className="px-4 py-3 text-neutral-800">{d.project_title}</td>
                              <td className="px-4 py-3 text-neutral-600">{d.project_code}</td>
                              <td className="px-4 py-3 text-neutral-600">{formatDateTime(d.start_time)}</td>
                              <td className="px-4 py-3 text-neutral-600">{d.end_time ? formatDateTime(d.end_time) : '-'}</td>
                              <td className="px-4 py-3 text-neutral-600">{d.end_time ? computeTotalTime(d.start_time, d.end_time) : '-'}</td>
                              <td className="px-4 py-3 text-neutral-600">{d.modality || 'Online'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Meeting Actions Modal (shown when clicking a row) */}
            {selectedDefense &&
              typeof document !== 'undefined' &&
              createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40" onClick={() => setSelectedDefense(null)}>
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-semibold text-neutral-800 mb-1">{selectedDefense.project_title}</h2>
                    <p className="text-sm text-neutral-500 mb-4">
                      {formatDateTime(selectedDefense.start_time)} — {formatDateTime(selectedDefense.end_time)}
                    </p>
                    <div className="mb-4">
                      <JoinMeetingButton
                        meeting_url={selectedDefense.meeting_url}
                        meeting_room={selectedDefense.meeting_room}
                        label="Join Meeting"
                      />
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setCancelConfirmId(selectedDefense.id)}
                        className="w-full text-left px-4 py-3 text-sm text-error-600 bg-error-50 hover:bg-error-100 rounded-lg transition-colors"
                      >
                        Cancel Meeting
                      </button>
                      <button
                        onClick={() => {
                          setRescheduleModal(selectedDefense);
                          setRescheduleForm({ date: '', startTime: '', endTime: '' });
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                      >
                        Reschedule Meeting
                      </button>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button type="button" variant="outline" onClick={() => setSelectedDefense(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {/* Cancel Meeting Confirmation Modal */}
            {cancelConfirmId &&
              typeof document !== 'undefined' &&
              createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-2">Cancel Meeting?</h2>
                    <p className="text-sm text-neutral-600 mb-4">
                      Are you sure you want to cancel this meeting? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setCancelConfirmId(null)}>
                        Keep Meeting
                      </Button>
                      <Button type="button" variant="error" onClick={() => handleCancelMeeting(cancelConfirmId)}>
                        Cancel Meeting
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {/* Reschedule Modal */}
            {rescheduleModal &&
              typeof document !== 'undefined' &&
              createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-2">
                      Reschedule Meeting
                    </h2>
                    <p className="text-sm text-neutral-600 mb-4">
                      Current: {formatDateTime(rescheduleModal.start_time)} — {formatDateTime(rescheduleModal.end_time)}
                    </p>
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">New Date</label>
                        <input
                          type="date"
                          value={rescheduleForm.date}
                          onChange={e => setRescheduleForm(p => ({ ...p, date: e.target.value }))}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={rescheduleForm.startTime}
                            onChange={e => setRescheduleForm(p => ({ ...p, startTime: e.target.value }))}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={rescheduleForm.endTime}
                            onChange={e => setRescheduleForm(p => ({ ...p, endTime: e.target.value }))}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setRescheduleModal(null)}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleRescheduleMeeting}
                        disabled={!rescheduleForm.date || !rescheduleForm.startTime || !rescheduleForm.endTime}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            {overlapWarning &&
              typeof document !== 'undefined' &&
              createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-[70] bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-2">Schedule Overlap Detected</h2>
                    <p className="text-sm text-neutral-600 mb-3">{overlapWarning.message}</p>
                    <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 mb-4 text-sm text-warning-800">
                      <p>Requested total time: <strong>{formatMinutes(overlapWarning.candidate_total_minutes)}</strong></p>
                      <p>Overlap: <strong>{formatMinutes(overlapWarning.max_overlap_minutes)}</strong></p>
                      <p>Time left if you proceed: <strong>{formatMinutes(overlapWarning.effective_minutes)}</strong></p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="error"
                        onClick={() => {
                          setOverlapWarning(null);
                          setPendingSubmitPayload(null);
                          showToast('Booking cancelled.', 'info');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="button" variant="primary" onClick={handleWaitForSlot}>
                        Wait
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            <Modal
              isOpen={isCancelModalOpen}
              onClose={() => setIsCancelModalOpen(false)}
              title="Discard changes?"
              size="sm"
            >
              <p className="text-sm text-neutral-600">
                You have unsaved changes. Are you sure you want to clear the form? All progress will be lost.
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                  Continue Editing
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    handleClear();
                  }}
                >
                  Clear Form
                </Button>
              </div>
            </Modal>

          </>
        )}
      </div>
    </DashboardLayout>
  );
}