'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiEdit2, FiMinusCircle } from 'react-icons/fi';

import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
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

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'student', label: 'Student' },
  { value: 'adviser', label: 'Adviser' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'admin', label: 'Admin' },
];

const EDIT_ROLE_OPTIONS = ROLE_OPTIONS.filter((option) => option.value);

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
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
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await listAdminUsers({
      search: search.trim() || undefined,
      role: roleFilter || undefined,
      status: statusFilter ? (statusFilter as 'active' | 'inactive') : undefined,
      page,
      limit: 25,
    });
    if (res.data) {
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  }, [search, roleFilter, statusFilter, page]);

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
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Users</h1>
          <p className="mt-1 text-neutral-600">
            View accounts, assign roles, and manage access across the platform
          </p>
        </div>

        <Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Search"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Email or name"
              fullWidth
            />
            <Select
              label="Role"
              value={roleFilter}
              onChange={(e) => {
                setPage(1);
                setRoleFilter(e.target.value);
              }}
              options={ROLE_OPTIONS}
              fullWidth
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              options={STATUS_FILTER_OPTIONS}
              fullWidth
            />
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">Loading users…</div>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">No users match your filters.</div>
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-neutral-100">
              {users.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800">{row.full_name || 'Unnamed user'}</p>
                    <p className="text-sm text-neutral-500">{row.email}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {formatRole(row.role)}
                      {row.institution_name ? ` · ${row.institution_name}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isUserActive(row)
                          ? 'bg-success-50 text-success-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {isUserActive(row) ? (
                        <FiCheckCircle className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <FiMinusCircle className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {isUserActive(row) ? 'Active' : 'Inactive'}
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                      <FiEdit2 className="mr-1.5 h-4 w-4" aria-hidden />
                      Manage
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
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
