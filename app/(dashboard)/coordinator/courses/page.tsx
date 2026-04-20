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
} from '@/lib/api/coordinator';

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
    setFormData({
      courseName: course.course_name,
      code: course.code,
      description: course.description || '',
    });
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
      if (res.error) {
        setFormError(res.error);
      } else {
        closeForm();
        await loadCourses();
      }
    } else {
      const res = await createCourse(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        closeForm();
        await loadCourses();
      }
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteCourse(deleteTarget.id);
    if (!res.error) {
      setDeleteTarget(null);
      await loadCourses();
    }
    setDeleting(false);
  }

  function openDefenseModal(course: Course) {
    setDefenseTarget(course);
    setDefenseForm({ defenseType: 'proposal', date: '', startTime: '', endTime: '', location: '', venue: '' });
    setDefenseError('');
    setDefenseSuccess('');
  }

  function closeDefenseModal() {
    setDefenseTarget(null);
    setDefenseError('');
    setDefenseSuccess('');
  }

  async function handleScheduleDefense() {
    if (!defenseTarget) return;
    if (!defenseForm.date || !defenseForm.startTime || !defenseForm.endTime || !defenseForm.location.trim()) {
      setDefenseError('Date, start time, end time, and location are required.');
      return;
    }
    setDefenseSubmitting(true);
    setDefenseError('');
    setDefenseSuccess('');
    const res = await createDefenseForCourse(defenseTarget.id, {
      defenseType: defenseForm.defenseType,
      date: defenseForm.date,
      startTime: defenseForm.startTime,
      endTime: defenseForm.endTime,
      location: defenseForm.location.trim(),
      venue: defenseForm.venue.trim() || undefined,
    });
    if (res.error) {
      setDefenseError(res.error);
    } else {
      setDefenseSuccess(`Scheduled ${res.data?.count || 0} defense(s) for all projects in this course.`);
    }
    setDefenseSubmitting(false);
  }

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
                      <td className="px-4 py-3 text-neutral-600 truncate max-w-xs">
                        {course.description || '—'}
                      </td>
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
          {formError && (
            <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Course Name</label>
            <input
              type="text"
              value={formData.courseName}
              onChange={(e) => setFormData((p) => ({ ...p, courseName: e.target.value }))}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Information Technology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. BSIT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Brief description of the course..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Course">
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete <strong>{deleteTarget?.course_name}</strong> ({deleteTarget?.code})?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="error" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Defense Modal */}
      <Modal isOpen={!!defenseTarget} onClose={closeDefenseModal} title={`Schedule Defense — ${defenseTarget?.course_name || ''}`}>
        <div className="p-6 space-y-4">
          {defenseError && (
            <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{defenseError}</div>
          )}
          {defenseSuccess && (
            <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg">{defenseSuccess}</div>
          )}
          {!defenseSuccess && (
            <>
              <p className="text-sm text-neutral-600">
                This will create a defense schedule for <strong>all projects</strong> enrolled in this course
                and notify all members.
              </p>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Defense Type</label>
                <select
                  value={defenseForm.defenseType}
                  onChange={(e) => setDefenseForm((p) => ({ ...p, defenseType: e.target.value as 'proposal' | 'midterm' | 'final' }))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="proposal">Proposal</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                <input
                  type="date"
                  value={defenseForm.date}
                  onChange={(e) => setDefenseForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={defenseForm.startTime}
                    onChange={(e) => setDefenseForm((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={defenseForm.endTime}
                    onChange={(e) => setDefenseForm((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
                <input
                  type="text"
                  value={defenseForm.location}
                  onChange={(e) => setDefenseForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Room 301, Building A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Venue (optional)</label>
                <input
                  type="text"
                  value={defenseForm.venue}
                  onChange={(e) => setDefenseForm((p) => ({ ...p, venue: e.target.value }))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Conference Hall"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={closeDefenseModal}>Cancel</Button>
                <Button variant="primary" onClick={handleScheduleDefense} disabled={defenseSubmitting}>
                  {defenseSubmitting ? 'Scheduling...' : 'Schedule Defenses'}
                </Button>
              </div>
            </>
          )}
          {defenseSuccess && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={closeDefenseModal}>Done</Button>
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
