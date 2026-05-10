'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Modal from '@/components/ui/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  createDefenseForCourse,
  type Course,
  type CourseDefenseConflict,
  type CreateCourseDefensePayload,
} from '@/lib/api/coordinator';

function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function CoordinatorCoursesPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ courseName: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Defense scheduling modal
  const [defenseTarget, setDefenseTarget] = useState<Course | null>(null);
  const [defenseForm, setDefenseForm] = useState({
    defenseType: 'proposal' as 'proposal' | 'midterm' | 'final',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    venue: '',
  });
  const [defenseSubmitting, setDefenseSubmitting] = useState(false);
  const [defenseError, setDefenseError] = useState('');
  const [defenseSuccess, setDefenseSuccess] = useState('');

  // Conflict resolution state
  const [conflictData, setConflictData] = useState<CourseDefenseConflict | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateCourseDefensePayload | null>(null);
  const [conflictAction, setConflictAction] = useState<'hold' | 'confirm' | null>(null);

  async function loadCourses() {
    setLoading(true);
    const res = await getCourses();
    if (res.data) setCourses(res.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    loadCourses().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, []);

  function openCreate() {
    setEditingCourse(null);
    setFormData({ courseName: '', code: '', description: '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function openEdit(course: Course) {
    setEditingCourse(course);
    setFormData({ courseName: course.course_name, code: course.code, description: course.description || '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCourse(null);
    setFormError('');
  }

  async function handleSubmit() {
    if (!formData.courseName.trim() || !formData.code.trim()) {
      setFormError('Course name and code are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    if (editingCourse) {
      const res = await updateCourse(editingCourse.id, formData);
      if (res.error) { setFormError(res.error); } else { closeForm(); await loadCourses(); }
    } else {
      const res = await createCourse(formData);
      if (res.error) { setFormError(res.error); } else { closeForm(); await loadCourses(); }
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteCourse(deleteTarget.id);
    if (!res.error) { setDeleteTarget(null); await loadCourses(); }
    setDeleting(false);
  }

  function openDefenseModal(course: Course) {
    setDefenseTarget(course);
    setDefenseForm({ defenseType: 'proposal', date: '', startTime: '', endTime: '', location: '', venue: '' });
    setDefenseError('');
    setDefenseSuccess('');
    setConflictData(null);
    setPendingPayload(null);
  }

  function closeDefenseModal() {
    setDefenseTarget(null);
    setDefenseError('');
    setDefenseSuccess('');
    setConflictData(null);
    setPendingPayload(null);
    setConflictAction(null);
  }

  async function submitDefense(payload: CreateCourseDefensePayload) {
    if (!defenseTarget) return;
    setDefenseSubmitting(true);
    setDefenseError('');

    const res = await createDefenseForCourse(defenseTarget.id, payload);

    if (res.data && 'conflict' in res.data && res.data.conflict) {
      setConflictData(res.data as CourseDefenseConflict);
      setPendingPayload(payload);
      setDefenseSubmitting(false);
      return;
    }

    if (res.error) {
      setDefenseError(res.error);
      setDefenseSubmitting(false);
      return;
    }

    const result = res.data as { count: number; status: string };
    const label = result?.status === 'pending' ? 'queued' : 'scheduled';
    setDefenseSuccess(`Successfully ${label} ${result?.count ?? 0} defense(s) for all projects in this institution.`);
    setConflictData(null);
    setPendingPayload(null);
    setDefenseSubmitting(false);
  }

  async function handleScheduleDefense() {
    if (!defenseTarget) return;
    if (!defenseForm.date || !defenseForm.startTime || !defenseForm.endTime || !defenseForm.location.trim()) {
      setDefenseError('Date, start time, end time, and location are required.');
      return;
    }
    if (defenseForm.endTime <= defenseForm.startTime) {
      setDefenseError('End time must be after start time.');
      return;
    }
    await submitDefense({
      defenseType: defenseForm.defenseType,
      date: defenseForm.date,
      startTime: defenseForm.startTime,
      endTime: defenseForm.endTime,
      location: defenseForm.location.trim(),
      venue: defenseForm.venue.trim() || undefined,
    });
  }

  async function handleConflictResolution(action: 'hold' | 'confirm') {
    if (!pendingPayload) return;
    setConflictAction(action);
    await submitDefense({
      ...pendingPayload,
      holdDefense: action === 'hold',
      forceSchedule: action === 'confirm',
    });
    setConflictAction(null);
  }

  const uniqueConflicts = conflictData
    ? Array.from(new Map(conflictData.conflicts.map((c) => [c.defense_id, c])).values())
    : [];

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Courses</h1>
            <p className="text-neutral-600 mt-1">Manage courses for your institution</p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <FiPlus className="mr-2" /> New Course
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              No courses created yet. Create your first course to get started.
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card padding="none">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-600">Course Name</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Code</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Description</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{course.course_name}</td>
                      <td className="px-4 py-3 text-neutral-600">{course.code}</td>
                      <td className="px-4 py-3 text-neutral-600 truncate max-w-xs">{course.description || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDefenseModal(course)}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Schedule defense"
                          >
                            <FiCalendar />
                          </button>
                          <button
                            onClick={() => openEdit(course)}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit course"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(course)}
                            className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                            title="Delete course"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>

      {/* Create / Edit Course Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={editingCourse ? 'Edit Course' : 'New Course'}>
        <div className="p-6 space-y-4">
          {formError && <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Course Name</label>
            <input type="text" value={formData.courseName} onChange={(e) => setFormData((p) => ({ ...p, courseName: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Information Technology" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Code</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. BSIT" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description (optional)</label>
            <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Brief description of the course..." />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : editingCourse ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Course">
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete <strong>{deleteTarget?.course_name}</strong> ({deleteTarget?.code})? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="error" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Defense Modal */}
      <Modal isOpen={!!defenseTarget && !conflictData} onClose={closeDefenseModal} title={`Schedule Defense — ${defenseTarget?.course_name || ''}`}>
        <div className="p-6 space-y-4">
          {defenseError && <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{defenseError}</div>}
          {defenseSuccess ? (
            <>
              <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg">{defenseSuccess}</div>
              <div className="flex justify-end">
                <Button variant="primary" onClick={closeDefenseModal}>Done</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-600">
                This will create a defense schedule for <strong>all projects</strong> in this institution and notify all members.
              </p>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Defense Type</label>
                <select value={defenseForm.defenseType} onChange={(e) => setDefenseForm((p) => ({ ...p, defenseType: e.target.value as 'proposal' | 'midterm' | 'final' }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="proposal">Proposal</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                <input type="date" value={defenseForm.date} onChange={(e) => setDefenseForm((p) => ({ ...p, date: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Start Time</label>
                  <input type="time" value={defenseForm.startTime} onChange={(e) => setDefenseForm((p) => ({ ...p, startTime: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">End Time</label>
                  <input type="time" value={defenseForm.endTime} onChange={(e) => setDefenseForm((p) => ({ ...p, endTime: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
                <input type="text" value={defenseForm.location} onChange={(e) => setDefenseForm((p) => ({ ...p, location: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Room 301, Building A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Venue (optional)</label>
                <input type="text" value={defenseForm.venue} onChange={(e) => setDefenseForm((p) => ({ ...p, venue: e.target.value }))} className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Conference Hall" />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={closeDefenseModal}>Cancel</Button>
                <Button variant="primary" onClick={handleScheduleDefense} disabled={defenseSubmitting}>
                  {defenseSubmitting ? 'Scheduling...' : 'Schedule Defenses'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal isOpen={!!conflictData} onClose={() => { setConflictData(null); setPendingPayload(null); }} title="Schedule Conflict Found">
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            This time slot overlaps with existing confirmed schedules. Choose how to proceed:
          </p>

          {conflictData && (
            <>
              <div className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-800">
                {uniqueConflicts.length} overlapping schedule{uniqueConflicts.length === 1 ? '' : 's'} detected.
              </div>

              <div className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-800 space-y-1">
                <p>Requested total time: <strong>{formatMinutes(conflictData.candidate_total_minutes)}</strong></p>
                <p>Overlap: <strong>{formatMinutes(conflictData.max_overlap_minutes)}</strong></p>
                <p>Time left if you proceed: <strong>{formatMinutes(conflictData.effective_minutes)}</strong></p>
              </div>

              {uniqueConflicts.length > 0 && (
                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Overlapping time slots</p>
                  <ul className="space-y-1 text-sm text-neutral-700">
                    {uniqueConflicts.map((c) => (
                      <li key={c.defense_id}>{c.start_time} – {c.end_time}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-neutral-700 space-y-2">
            <div>
              <p className="font-medium text-blue-900 mb-1">Option 1: Hold Defense</p>
              <p className="text-blue-800 text-xs">Queue all defenses as pending. They will be scheduled automatically when the conflicting slot becomes available.</p>
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Option 2: Confirm</p>
              <p className="text-blue-800 text-xs">Schedule all defenses regardless of the conflict. Both will run at their requested times.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setConflictData(null); setPendingPayload(null); setConflictAction(null); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handleConflictResolution('hold')} disabled={defenseSubmitting}>
              {defenseSubmitting && conflictAction === 'hold' ? 'Processing...' : 'Hold Defense'}
            </Button>
            <Button variant="error" onClick={() => handleConflictResolution('confirm')} disabled={defenseSubmitting}>
              {defenseSubmitting && conflictAction === 'confirm' ? 'Confirming...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
