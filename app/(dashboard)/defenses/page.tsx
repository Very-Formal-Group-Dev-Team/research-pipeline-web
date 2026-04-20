//Urri Tomas is my best
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { type ProjectMember } from '@/lib/api/projects';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import { createPortal } from 'react-dom';

interface ScheduledDefense {
  id: string;
  project_title: string;
  project_code: string;
  start_time: string;
  end_time: string;
  scheduled_at?: string;
  defense_type: string;
  location: string;
  modality: string;
  status: string;
  status_label: string;
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
  });

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

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
    }));
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
      throw new Error(data.error || 'Failed to book meeting.');
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
    if (!pendingSubmitPayload) return;
    try {
      await submitDefense({ ...pendingSubmitPayload, wait_for_slot: true });
    } catch (err: any) {
      showToast(err.message || 'Failed to queue meeting.', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        project_id: form.projectId,
        defense_type: form.defenseType === 'Finals'
            ? 'final'
            : form.defenseType.toLowerCase(),
        start_time: `${form.date}T${form.startTime}:00`,
        end_time: `${form.date}T${form.endTime}:00`,
        location: form.meetingType === 'Face-to-Face'
            ? `Face-to-Face - ${form.roomOption}` 
            : 'Online',
        modality: form.meetingType,
      };

      await submitDefense(payload);
    } catch (err: any) {
      showToast(err.message || 'Failed to book meeting.', 'error');
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
            <div>
              <h1 className="text-3xl font-bold text-primary-700">Meeting Schedule</h1>
              <p className="text-neutral-600 mt-1">Manage your meeting availability and scheduled sessions</p>
            </div>

            {/* Book a Meeting Form */}
            <div>
              <Card className="border border-neutral-300 p-6">
                <h1 className="text-xl font-semibold text-neutral-700 mb-6">Book a Meeting</h1>

                {/* Project Code and Project Title and Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Project Code</label>
                    <input
                      type="text"
                      name="projectCode"
                      value={form.projectCode || ''}
                      onChange={handleChange}
                      placeholder="Project Code"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Project Title</label>
                    <input
                      type="text"
                      name="projectTitle"
                      value={form.projectTitle || ''}
                      onChange={handleChange}
                      placeholder="Project Title"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={form.section || ''}
                      onChange={handleChange}
                      placeholder="Section"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Team Members - read-only */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Team Members</label>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    {projectMembers.length > 0 ? (
                      <div className="space-y-2">
                        {projectMembers.map((member) => (
                          <div key={member.id} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="text-neutral-700 font-medium">{member.users?.full_name || 'Unknown'}</p>
                              <p className="text-neutral-500 text-xs">{member.users?.email || 'No email'}</p>
                            </div>
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded capitalize">
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400">No members loaded</p>
                    )}
                  </div>
                </div>

                {/* Time Range & Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime || ''}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime || ''}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date || ''}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Meeting Type & Defense Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">Meeting Type</p>
                    <div className="space-y-1">
                      {['Online', 'Face-to-Face'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="meetingType"
                            value={type}
                            checked={form.meetingType === type}
                            onChange={handleChange}
                            className="accent-primary-500"
                          />
                          <span className="text-sm text-neutral-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Room Option - only for Face-to-Face */}
                {form.meetingType === 'Face-to-Face' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Room Option</label>
                    <select
                      name="roomOption"
                      value={form.roomOption || ''}
                      onChange={handleChange}
                      className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a room</option>
                      <option value="room1">Room 1</option>
                      <option value="room2">Room 2</option>
                      <option value="room3">Room 3</option>
                    </select>
                  </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button variant="error" onClick={handleSubmit}>
                    Book Meeting
                  </Button>
                  {/* Changed: Clear button calls handleClearClick (modal aware) */}
                  <Button variant="outline" onClick={handleClearClick}>
                    Clear
                  </Button>
                </div>

              </Card>
            </div>

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
                      <thead className="bg-neutral-50 border-b border-neutral-200">
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
                          const style = statusStyles[d.status] || 'bg-neutral-100 text-neutral-600';
                          return (
                            <tr key={d.id} className="hover:bg-neutral-50">
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

            {/*  Clear Confirmation Modal */}
            {isCancelModalOpen &&
              typeof document !== 'undefined' &&
              createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 transition-opacity duration-200 ease-out">
                  <div className="bg-white rounded-lg shadow-lg p-6 transform transition-all duration-200 ease-out scale-95 opacity-0 animate-modal-in">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-2">
                      Discard Changes?
                    </h2>
                    <p className="text-sm text-neutral-600 mb-4">
                      You have unsaved changes. Are you sure you want to clear the form? All progress will be lost.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCancelModalOpen(false)}
                      >
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
                  </div>
                </div>,
                document.body
              )}  

          </>
        )}
      </div>
    </DashboardLayout>
  );
}