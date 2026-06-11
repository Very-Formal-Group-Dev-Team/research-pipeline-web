'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiEdit2, FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';

import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { formTextareaResponsiveClassName } from '@/lib/utils/formControls';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  createAdminProgram,
  listAdminInstitutions,
  listAdminPrograms,
  updateAdminProgram,
  type AdminInstitution,
  type AdminProgram,
} from '@/lib/api/admin';

function isActive(value: AdminProgram['is_active']): boolean {
  return value === true || value === 1;
}

export default function AdminInstitutionProgramsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const institutionId = typeof params?.id === 'string' ? params.id : '';
  const { user, handleLogout } = useDashboardUser('Admin');

  const [institution, setInstitution] = useState<AdminInstitution | null>(null);
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProgram | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    const [instRes, progRes] = await Promise.all([
      listAdminInstitutions(),
      listAdminPrograms(institutionId),
    ]);
    const match = instRes.data?.find((row) => row.id === institutionId) || null;
    setInstitution(match);
    setPrograms(progRes.data || []);
    setLoading(false);
  }, [institutionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const formDirty = useMemo(() => {
    if (!editing) {
      return Boolean(formData.name.trim() && formData.code.trim());
    }
    return (
      formData.name.trim() !== editing.name ||
      formData.code.trim().toUpperCase() !== editing.code ||
      formData.description.trim() !== (editing.description || '').trim()
    );
  }, [editing, formData]);

  function openCreate() {
    setEditing(null);
    setFormData({ name: '', code: '', description: '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function openEdit(program: AdminProgram) {
    setEditing(program);
    setFormData({
      name: program.name,
      code: program.code,
      description: program.description || '',
    });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
    setFormError('');
  }

  async function handleSubmit() {
    if (!institutionId || !formData.name.trim() || !formData.code.trim()) {
      setFormError('Name and code are required.');
      return;
    }
    if (editing && !formDirty) return;

    setSubmitting(true);
    setFormError('');

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      description: formData.description.trim() || undefined,
    };

    const res = editing
      ? await updateAdminProgram(institutionId, editing.id, payload)
      : await createAdminProgram(institutionId, payload);

    if (res.error) {
      setFormError(res.error);
    } else {
      closeForm();
      await loadData();
      toast.success(editing ? 'Program updated' : 'Program created');
    }

    setSubmitting(false);
  }

  async function toggleActive(program: AdminProgram) {
    const res = await updateAdminProgram(institutionId, program.id, {
      isActive: !isActive(program.is_active),
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    await loadData();
    toast.success(isActive(program.is_active) ? 'Program disabled' : 'Program enabled');
  }

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Programs</h1>
            <p className="mt-1 text-neutral-600">
              {institution
                ? `Program catalog for ${institution.name} (${institution.code})`
                : 'Manage programs offered by this institution'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-primary-700 hover:bg-primary-50"
              leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
              onClick={() => router.push('/admin/institutions')}
            >
              Back to Institutions
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <FiPlus className="mr-2" aria-hidden />
              New Program
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
          </div>
        ) : programs.length === 0 ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">
              No programs yet. Add programs students can select when creating projects.
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-neutral-100">
              {programs.map((program) => (
                <li
                  key={program.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800">
                      {program.name}
                      <span className="ml-2 text-sm font-normal text-neutral-500">
                        ({program.code})
                      </span>
                    </p>
                    {program.description ? (
                      <p className="mt-1 text-sm text-neutral-500">{program.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isActive(program.is_active) ? 'success' : 'default'} size="sm">
                      {isActive(program.is_active) ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FiEdit2 aria-hidden />}
                      onClick={() => openEdit(program)}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void toggleActive(program)}>
                      {isActive(program.is_active) ? 'Disable' : 'Enable'}
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
        title={editing ? 'Edit Program' : 'New Program'}
      >
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {formError}
            </div>
          ) : null}
          <Input
            label="Program name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Bachelor of Science in Computer Science"
            responsiveText
            fullWidth
          />
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g. BSCS"
            responsiveText
            fullWidth
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={formTextareaResponsiveClassName}
              placeholder="Optional details about this program"
            />
          </div>
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
            {editing ? 'Save changes' : 'Create program'}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
