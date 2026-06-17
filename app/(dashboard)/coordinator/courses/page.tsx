'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formLabelClassName, formTextareaResponsiveClassName } from '@/lib/utils/formControls';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  addAdviserToInstitution,
  removeAdviserFromCourse,
  type Course,
  type CourseAdviser,
} from '@/lib/api/coordinator';
import { toast } from 'sonner';
import { useUserSearch } from '@/lib/hooks/useUserSearch';
import type { SearchUserResult } from '@/lib/api/users';

export default function CoordinatorCoursesPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ courseName: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addAdviserCourse, setAddAdviserCourse] = useState<Course | null>(null);
  const { query, setQuery, results, isLoading: searching, error: searchError, reset: resetSearch } =
    useUserSearch({ role: 'adviser' });
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  const [removeAdviserTarget, setRemoveAdviserTarget] = useState<{
    course: Course;
    adviser: CourseAdviser;
  } | null>(null);
  const [removingAdviser, setRemovingAdviser] = useState(false);

  const suggestions = useMemo(() => {
    if (!addAdviserCourse) return results;
    const courseAdviserIds = new Set((addAdviserCourse.advisers || []).map((a) => a.id));
    return results.filter((u) => !courseAdviserIds.has(u.id));
  }, [results, addAdviserCourse]);

  const courseFormDirty = useMemo(() => {
    if (!editingCourse) return true;
    return (
      formData.courseName.trim() !== editingCourse.course_name ||
      formData.code.trim() !== editingCourse.code ||
      formData.description.trim() !== (editingCourse.description || '').trim()
    );
  }, [editingCourse, formData]);

  const duplicateCourseName = useMemo(() => {
    const name = formData.courseName.trim().toLowerCase();
    if (!name) return false;
    return courses.some(
      (c) =>
        c.course_name.trim().toLowerCase() === name && c.id !== editingCourse?.id,
    );
  }, [formData.courseName, courses, editingCourse]);

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

  function toggleExpanded(courseId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

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
    if (duplicateCourseName) {
      setFormError('A course with this name already exists.');
      return;
    }
    if (editingCourse && !courseFormDirty) return;

    setSubmitting(true);
    setFormError('');
    if (editingCourse) {
      const res = await updateCourse(editingCourse.id, formData);
      if (res.error) setFormError(res.error);
      else {
        closeForm();
        await loadCourses();
        toast.success('Changes saved');
      }
    } else {
      const res = await createCourse(formData);
      if (res.error) setFormError(res.error);
      else {
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

  function openAddAdviser(course: Course) {
    setAddAdviserCourse(course);
    setSelectedUser(null);
    setAddError('');
    resetSearch();
    setExpandedIds((prev) => new Set(prev).add(course.id));
  }

  function closeAddAdviser() {
    setAddAdviserCourse(null);
    setSelectedUser(null);
    setAddError('');
    resetSearch();
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedUser(null);
    setAddError('');
  }

  function handleSelectUser(u: SearchUserResult) {
    setSelectedUser(u);
    setQuery(u.full_name || u.email);
  }

  async function handleAddAdviser() {
    if (!addAdviserCourse || !selectedUser) return;
    setAddingId(selectedUser.id);
    setAddError('');
    const res = await addAdviserToInstitution(selectedUser.id, addAdviserCourse.id);
    if (res.error) {
      setAddError(res.error);
    } else {
      closeAddAdviser();
      await loadCourses();
    }
    setAddingId(null);
  }

  async function handleRemoveAdviser() {
    if (!removeAdviserTarget) return;
    setRemovingAdviser(true);
    const res = await removeAdviserFromCourse(
      removeAdviserTarget.course.id,
      removeAdviserTarget.adviser.id,
    );
    if (!res.error) {
      setRemoveAdviserTarget(null);
      await loadCourses();
    }
    setRemovingAdviser(false);
  }

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Courses</h1>
            <p className="text-neutral-600 mt-1">
              Manage courses and assign faculty advisers to each course
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 px-4 py-2 text-base hover:bg-primary-600 hover:shadow-none active:bg-primary-700 active:shadow-none"
            onClick={openCreate}
          >
            <FiPlus className="mr-1" /> New Course
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              No courses created yet. Create your first course, then add advisers to it.
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-neutral-100">
              {courses.map((course) => {
                const expanded = expandedIds.has(course.id);
                const advisers = course.advisers || [];
                return (
                  <li key={course.id}>
                    <div className="flex items-center gap-2 px-4 py-3 sm:px-6 hover:bg-neutral-50">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(course.id)}
                        className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-oxfordBlue"
                        aria-expanded={expanded}
                        aria-label={expanded ? 'Collapse advisers' : 'Expand advisers'}
                      >
                        {expanded ? <FiChevronDown /> : <FiChevronRight />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(course.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="font-medium text-neutral-800 truncate">
                          {course.course_name}
                          <span className="ml-2 text-sm font-normal text-neutral-500">
                            ({course.code})
                          </span>
                        </p>
                        {course.description && (
                          <p className="text-sm text-neutral-500 truncate">{course.description}</p>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {advisers.length} adviser{advisers.length === 1 ? '' : 's'}
                        </p>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openAddAdviser(course)}
                          className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Add adviser to course"
                        >
                          <FiUserPlus />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(course)}
                          className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit course"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(course)}
                          className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                          title="Delete course"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-neutral-100 bg-neutral-50/80 px-4 py-3 pl-12">
                        {advisers.length === 0 ? (
                          <p className="text-sm text-neutral-500">
                            No advisers assigned yet. Use the add user icon to invite one.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {advisers.map((adviser) => (
                              <li
                                key={adviser.id}
                                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2"
                              >
                                <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                  {adviser.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-neutral-800 truncate">
                                    {adviser.full_name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-neutral-500 truncate">{adviser.email}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRemoveAdviserTarget({ course, adviser })
                                  }
                                  className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                                  title="Remove adviser from course"
                                >
                                  <FiTrash2 />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingCourse ? 'Edit Course' : 'New Course'}
        size="sm"
        dense
      >
        <div className="space-y-3">
          {(formError || duplicateCourseName) && (
            <div className="rounded-lg bg-error-50 p-2.5 text-sm text-error-700">
              {formError || 'A course with this name already exists.'}
            </div>
          )}
          <Input
            label="Course Name"
            type="text"
            value={formData.courseName}
            onChange={(e) => setFormData((p) => ({ ...p, courseName: e.target.value }))}
            placeholder="e.g. Information Technology"
            responsiveText
            fullWidth
          />
          <Input
            label="Code"
            type="text"
            value={formData.code}
            onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
            placeholder="e.g. BSIT"
            responsiveText
            fullWidth
          />
          <div>
            <label className={formLabelClassName}>Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className={formTextareaResponsiveClassName}
              placeholder="Brief description of the course..."
            />
          </div>
        </div>
        <ModalFooter className="!mt-4 !pt-3">
          <Button variant="outline" size="sm" onClick={closeForm} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={
              submitting ||
              duplicateCourseName ||
              (Boolean(editingCourse) && !courseFormDirty)
            }
            loading={submitting}
          >
            {submitting ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Course"
        size="sm"
        dense
      >
        <p className="text-sm text-neutral-600">
          Are you sure you want to delete <strong>{deleteTarget?.course_name}</strong> (
          {deleteTarget?.code})? This action cannot be undone.
        </p>
        <ModalFooter className="!mt-4 !pt-3">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="error" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={!!addAdviserCourse}
        onClose={closeAddAdviser}
        title={addAdviserCourse ? `Add Adviser — ${addAdviserCourse.course_name}` : 'Add Adviser'}
      >
        <div className="p-6 space-y-4">
          {addError && (
            <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{addError}</div>
          )}
          {searchError && (
            <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{searchError}</div>
          )}
          <p className="text-sm text-neutral-600">
            Search for an adviser to assign to projects in{' '}
            <strong>{addAdviserCourse?.course_name}</strong> ({addAdviserCourse?.code}).
          </p>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search by name or email..."
              autoFocus
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!selectedUser && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {suggestions.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 flex items-center gap-3 transition-colors border-b border-neutral-50 last:border-0"
                  >
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0">
                      {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">
                        {u.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!selectedUser && !searching && suggestions.length === 0 && query.trim().length >= 2 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg px-4 py-3">
                <p className="text-sm text-neutral-500">No advisers found matching your search.</p>
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-neutral-800 text-sm">
                    {selectedUser.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-neutral-500">{selectedUser.email}</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleAddAdviser}
                disabled={addingId === selectedUser.id}
              >
                {addingId === selectedUser.id ? 'Adding...' : 'Add'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!removeAdviserTarget}
        onClose={() => setRemoveAdviserTarget(null)}
        title="Remove adviser from course"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Remove <strong>{removeAdviserTarget?.adviser.full_name}</strong> from{' '}
            <strong>{removeAdviserTarget?.course.course_name}</strong> ({removeAdviserTarget?.course.code})?
            They will no longer be assigned as adviser on projects in this course.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRemoveAdviserTarget(null)}>
              Cancel
            </Button>
            <Button variant="error" onClick={handleRemoveAdviser} disabled={removingAdviser}>
              {removingAdviser ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
