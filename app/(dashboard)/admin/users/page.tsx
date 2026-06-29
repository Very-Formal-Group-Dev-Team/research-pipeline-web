'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiUsers } from 'react-icons/fi';

import AdminUsersListToolbar, {
  DEFAULT_ADMIN_USERS_FILTERS,
  isAdminUsersFiltersDirty,
  type AdminUsersFilterState,
} from '@/components/admin/AdminUsersListToolbar';
import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/layout/EmptyState';
import AdminUsersListSkeleton from '@/components/skeletons/AdminUsersListSkeleton';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  listAdminInstitutions,
  listAdminUsers,
  updateAdminUser,
  type AdminInstitution,
  type AdminUser,
} from '@/lib/api/admin';
import { toast } from 'sonner';

const EDIT_ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'adviser', label: 'Adviser' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'admin', label: 'Admin' },
];

function isUserActive(user: AdminUser): boolean {
  return user.status === 1;
}

function formatRole(role: string | null): string {
  if (!role) return '—';
  if (role === 'adviser' || role === 'teacher') return 'Adviser';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AdminUsersPage() {
  const { user, handleLogout } = useDashboardUser('Admin');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [institutions, setInstitutions] = useState<AdminInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilters, setListFilters] = useState<AdminUsersFilterState>(DEFAULT_ADMIN_USERS_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ role: '', institutionId: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const institutionOptions = useMemo(
    () => institutions.map((inst) => ({ value: inst.id, label: `${inst.name} (${inst.code})` })),
    [institutions],
  );

  const filtersActive = isAdminUsersFiltersDirty(listFilters);

  const handleFiltersChange = (next: AdminUsersFilterState) => {
    setPage(1);
    setListFilters(next);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await listAdminUsers({
      search: listFilters.search.trim() || undefined,
      role: listFilters.role || undefined,
      status: listFilters.status ? (listFilters.status as 'active' | 'inactive') : undefined,
      page,
      limit: 25,
    });
    if (res.data) {
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  }, [listFilters, page]);

  useEffect(() => {
    void listAdminInstitutions().then((res) => {
      if (res.data) setInstitutions(res.data);
    });
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function openEdit(target: AdminUser) {
    setEditTarget(target);
    setEditForm({
      role: target.role === 'teacher' ? 'adviser' : target.role || 'student',
      institutionId: target.institution_id || '',
      isActive: isUserActive(target),
    });
    setFormError('');
  }

  async function handleSave() {
    if (!editTarget) return;
    if (!editForm.role || !editForm.institutionId) {
      setFormError('Role and institution are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = await updateAdminUser(editTarget.id, {
      role: editForm.role,
      institutionId: editForm.institutionId,
      isActive: editForm.isActive,
    });

    if (res.error) {
      setFormError(res.error);
      setSubmitting(false);
      return;
    }

    setEditTarget(null);
    toast.success('User updated');
    await loadUsers();
    setSubmitting(false);
  }

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Users</h1>
            <p className="mt-1 text-neutral-600">
              View accounts, assign roles, and manage access across the platform
            </p>
          </div>

          {!loading && (users.length > 0 || filtersActive) ? (
            <AdminUsersListToolbar filters={listFilters} onFiltersChange={handleFiltersChange} />
          ) : null}
        </div>

        {loading ? (
          <AdminUsersListSkeleton />
        ) : users.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FiUsers />}
              title={filtersActive ? 'No matching users' : 'No users yet'}
              description={
                filtersActive
                  ? 'Try adjusting your search, role, or status filters.'
                  : 'User accounts will appear here once people register on the platform.'
              }
              action={
                filtersActive
                  ? {
                      label: 'Reset filters',
                      onClick: () => handleFiltersChange(DEFAULT_ADMIN_USERS_FILTERS),
                    }
                  : undefined
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Name</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Role</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Institution</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Status</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {users.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 sm:px-6">
                        <div>
                          <p className="font-medium text-neutral-800">
                            {row.full_name || 'Unnamed user'}
                          </p>
                          <p className="text-xs text-neutral-500">{row.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 sm:px-6">{formatRole(row.role)}</td>
                      <td className="px-4 py-3 text-neutral-600 sm:px-6">
                        {row.institution_name || '—'}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <Badge variant={isUserActive(row) ? 'success' : 'default'} size="sm">
                          {isUserActive(row) ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<FiEdit2 aria-hidden />}
                          onClick={() => openEdit(row)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-neutral-600">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => {
          if (!submitting) setEditTarget(null);
        }}
        title="Manage user"
        size="md"
      >
        {editTarget ? (
          <div className="space-y-4">
            <div className="rounded-md bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <p className="font-medium">{editTarget.full_name || editTarget.email}</p>
              <p className="text-neutral-500">{editTarget.email}</p>
            </div>
            {formError ? (
              <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                {formError}
              </div>
            ) : null}
            <Select
              label="Role"
              value={editForm.role}
              onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
              options={EDIT_ROLE_OPTIONS}
              fullWidth
            />
            <Select
              label="Institution"
              value={editForm.institutionId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, institutionId: e.target.value }))}
              options={institutionOptions}
              fullWidth
            />
            <Select
              label="Account status"
              value={editForm.isActive ? 'active' : 'inactive'}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))
              }
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              fullWidth
            />
          </div>
        ) : null}
        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={submitting}
            onClick={() => void handleSave()}
          >
            Save changes
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
