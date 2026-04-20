'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Modal from '@/components/ui/Modal';
import { FiUserPlus, FiTrash2, FiSearch } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getInstitutionAdvisers,
  getCourses,
  addAdviserToInstitution,
  removeAdviserFromInstitution,
  type InstitutionAdviser,
  type Course,
} from '@/lib/api/coordinator';
import { useUserSearch } from '@/lib/hooks/useUserSearch';
import type { SearchUserResult } from '@/lib/api/users';

export default function CoordinatorAdvisersPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [advisers, setAdvisers] = useState<InstitutionAdviser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const { query, setQuery, results, isLoading: searching, error: searchError, reset: resetSearch } = useUserSearch({ role: 'adviser' });
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [removeTarget, setRemoveTarget] = useState<InstitutionAdviser | null>(null);
  const [removing, setRemoving] = useState(false);

  async function loadAdvisers() {
    setLoading(true);
    const [advisersRes, coursesRes] = await Promise.all([
      getInstitutionAdvisers(),
      getCourses(),
    ]);
    if (advisersRes.data) setAdvisers(advisersRes.data);
    if (coursesRes.data) setCourses(coursesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    loadAdvisers().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, []);

  const existingIds = useMemo(() => new Set(advisers.map((a) => a.id)), [advisers]);
  const suggestions = useMemo(() => results.filter((u) => !existingIds.has(u.id)), [results, existingIds]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedUser(null);
    setAddError('');
  }

  function handleSelectUser(u: SearchUserResult) {
    setSelectedUser(u);
    setQuery(u.full_name || u.email);
  }

  async function handleAdd() {
    if (!selectedUser) return;
    if (!selectedCourseId) {
      setAddError('Please select a course before inviting an adviser.');
      return;
    }
    setAddingId(selectedUser.id);
    setAddError('');
    const res = await addAdviserToInstitution(selectedUser.id, selectedCourseId);
    if (res.error) {
      setAddError(res.error);
    } else {
      closeAddModal();
      await loadAdvisers();
    }
    setAddingId(null);
  }

  function closeAddModal() {
    setIsAddOpen(false);
    setSelectedUser(null);
    setSelectedCourseId('');
    setAddError('');
    resetSearch();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    const res = await removeAdviserFromInstitution(removeTarget.id);
    if (!res.error) {
      setRemoveTarget(null);
      await loadAdvisers();
    }
    setRemoving(false);
  }

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Advisers</h1>
            <p className="text-neutral-600 mt-1">Manage advisers in your institution</p>
          </div>
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <FiUserPlus className="mr-2" /> Add Adviser
          </Button>
        </div>

        {!loading && courses.length === 0 && (
          <Card>
            <div className="text-center py-4 text-warning-700">
              Create at least one course before inviting advisers.
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : advisers.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              No advisers in your institution yet. Add one to get started.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advisers.map((adviser) => (
              <Card key={adviser.id} padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {adviser.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">{adviser.full_name || 'Unknown'}</p>
                    <p className="text-sm text-neutral-500 truncate">{adviser.email}</p>
                  </div>
                  <button
                    onClick={() => setRemoveTarget(adviser)}
                    className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                    title="Remove from institution"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isAddOpen} onClose={closeAddModal} title="Add Adviser">
        <div className="p-6 space-y-4">
          {addError && (
            <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{addError}</div>
          )}
          {searchError && (
            <div className="p-3 bg-error-50 text-error-700 text-sm rounded-lg">{searchError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setAddError('');
              }}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              disabled={courses.length === 0}
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
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 flex items-center gap-3 transition-colors border-b border-neutral-50 last:border-0"
                  >
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0">
                      {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{u.full_name || 'Unknown'}</p>
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
                  <p className="font-medium text-neutral-800 text-sm">{selectedUser.full_name || 'Unknown'}</p>
                  <p className="text-xs text-neutral-500">{selectedUser.email}</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleAdd}
                disabled={addingId === selectedUser.id || !selectedCourseId || courses.length === 0}
              >
                {addingId === selectedUser.id ? 'Adding...' : 'Add'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove Adviser">
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to remove <strong>{removeTarget?.full_name}</strong> from your institution?
            This will unlink them but not delete their account.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="error" onClick={handleRemove} disabled={removing}>
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
