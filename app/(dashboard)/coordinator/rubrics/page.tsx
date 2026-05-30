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
import Link from 'next/dist/client/link';

export default function CoordinatorRubricPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [rubrics, setRubrics] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ rubricName: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadRubrics() {
    setLoading(true);
    const res = await getCourses();
    if (res.data) setRubrics(res.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    loadRubrics().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, []);

  function openCreate() {
    setEditingRubric(null);
    setFormData({ rubricName: '', code: '', description: '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function openEdit(rubric: Course) {
    setEditingRubric(rubric);
    setFormData({ rubricName: rubric.course_name, code: rubric.code, description: rubric.description || '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingRubric(null);
    setFormError('');
  }

  async function handleSubmit() {
    if (!formData.rubricName.trim() || !formData.code.trim()) {
      setFormError('Rubric name and code are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    const payload = {
      courseName: formData.rubricName,
      code: formData.code,
      description: formData.description,
    };

    if (editingRubric) {
      const res = await updateCourse(editingRubric.id, payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        closeForm();
        await loadRubrics();
      }
    } else {
      const res = await createCourse(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        closeForm();
        await loadRubrics();
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
      await loadRubrics();
    }
    setDeleting(false);
  }

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Rubrics</h1>
            <p className="text-neutral-600 mt-1">Manage rubrics for your institution</p>
          </div>
          <Link href="/coordinator/rubrics/rubric-creation">
            <Button variant="primary">
              <FiPlus className="mr-2" /> New Rubric
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : rubrics.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              No rubrics found. Create your first rubric to get started.
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card padding="none">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-600">Rubric Name</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Group</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">Description</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rubrics.map((rubric) => (
                    <tr key={rubric.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{rubric.course_name}</td>
                      <td className="px-4 py-3 text-neutral-600">{rubric.code}</td>
                      <td className="px-4 py-3 text-neutral-600 truncate max-w-xs">{rubric.description || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(rubric)}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit rubric"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(rubric)}
                            className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                            title="Delete rubric"
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

    </DashboardLayout>
  );
}
