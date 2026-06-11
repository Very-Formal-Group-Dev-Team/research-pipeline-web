'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';

import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  createAdminInstitution,
  listAdminInstitutions,
  updateAdminInstitution,
  type AdminInstitution,
} from '@/lib/api/admin';

function isActive(value: AdminInstitution['is_active']): boolean {
  return value === true || value === 1;
}

export default function AdminInstitutionsPage() {
  const { user, handleLogout } = useDashboardUser('Admin');
  const [institutions, setInstitutions] = useState<AdminInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminInstitution | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadInstitutions() {
    setLoading(true);
    const res = await listAdminInstitutions();
    if (res.data) setInstitutions(res.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadInstitutions();
  }, []);

  const formDirty = useMemo(() => {
    if (!editing) return Boolean(formData.name.trim() && formData.code.trim());
    return (
      formData.name.trim() !== editing.name ||
      formData.code.trim().toUpperCase() !== editing.code
    );
  }, [editing, formData]);

  function openCreate() {
    setEditing(null);
    setFormData({ name: '', code: '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function openEdit(institution: AdminInstitution) {
    setEditing(institution);
    setFormData({ name: institution.name, code: institution.code });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
    setFormError('');
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Name and code are required.');
      return;
    }
    if (editing && !formDirty) return;

    setSubmitting(true);
    setFormError('');

    if (editing) {
      const res = await updateAdminInstitution(editing.id, {
        name: formData.name.trim(),
        code: formData.code.trim(),
      });
      if (res.error) setFormError(res.error);
      else {
        closeForm();
        await loadInstitutions();
        toast.success('Institution updated');
      }
    } else {
      const res = await createAdminInstitution({
        name: formData.name.trim(),
        code: formData.code.trim(),
      });
      if (res.error) setFormError(res.error);
      else {
        closeForm();
        await loadInstitutions();
        toast.success('Institution created');
      }
    }

    setSubmitting(false);
  }

  async function toggleActive(institution: AdminInstitution) {
    const res = await updateAdminInstitution(institution.id, {
      isActive: !isActive(institution.is_active),
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    await loadInstitutions();
    toast.success(isActive(institution.is_active) ? 'Institution disabled' : 'Institution enabled');
  }

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Institutions</h1>
            <p className="mt-1 text-neutral-600">
              Register schools on Archivum and manage their program catalogs
            </p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <FiPlus className="mr-2" aria-hidden />
            New Institution
          </Button>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
          </div>
        ) : institutions.length === 0 ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">
              No institutions yet. Create the first school to get started.
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-neutral-100">
              {institutions.map((institution) => (
                <li
                  key={institution.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800">{institution.name}</p>
                    <p className="text-sm text-neutral-500">{institution.code}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isActive(institution.is_active) ? 'success' : 'default'} size="sm">
                      {isActive(institution.is_active) ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FiEdit2 aria-hidden />}
                      onClick={() => openEdit(institution)}
                    >
                      Edit
                    </Button>
                    <Link
                      href={`/admin/institutions/${institution.id}/programs`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-oxfordBlue px-3 py-1.5 text-sm font-medium text-oxfordBlue transition-all duration-200 hover:bg-oxfordBlue hover:text-snow"
                    >
                      Programs
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void toggleActive(institution)}
                    >
                      {isActive(institution.is_active) ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editing ? 'Edit Institution' : 'New Institution'}
      >
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {formError}
            </div>
          ) : null}
          <Input
            label="Institution name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Mapúa Malayan Colleges Mindanao"
            responsiveText
            fullWidth
          />
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g. MMCM"
            responsiveText
            fullWidth
          />
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={closeForm}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={submitting || !formDirty}
            onClick={() => void handleSubmit()}
          >
            {editing ? 'Save changes' : 'Create institution'}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
