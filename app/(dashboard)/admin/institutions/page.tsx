'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiEdit2, FiMinusCircle, FiPlus } from 'react-icons/fi';

import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { adminInstitutionUndoToastMessage } from '@/lib/meetings/undoStatusMessages';
import {
  createAdminInstitution,
  listAdminInstitutions,
  updateAdminInstitution,
  type AdminInstitution,
} from '@/lib/api/admin';
import { toast } from 'sonner';

function isActive(value: AdminInstitution['is_active']): boolean {
  return value === true || value === 1;
}

function ActiveStatusButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'success' : 'outline'}
      size="sm"
      leftIcon={active ? <FiCheckCircle aria-hidden /> : <FiMinusCircle aria-hidden />}
      onClick={onClick}
      title={active ? 'Click to disable' : 'Click to enable'}
      className={active ? undefined : 'border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-700'}
    >
      {active ? 'Active' : 'Inactive'}
    </Button>
  );
}

export default function AdminInstitutionsPage() {
  const { user, handleLogout } = useDashboardUser('Admin');
  const [institutions, setInstitutions] = useState<AdminInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<AdminInstitution | null>(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const { toast: statusUndoToast, showUndoToast: showStatusUndoToast, dismissUndoToast: dismissStatusUndoToast } =
    useUndoActionToast();

  async function loadInstitutions() {
    setLoading(true);
    const res = await listAdminInstitutions();
    if (res.data) setInstitutions(res.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadInstitutions();
  }, []);

  const formDirty = useMemo(
    () => Boolean(formData.name.trim() && formData.code.trim()),
    [formData],
  );

  const willEnableInstitution = statusConfirmTarget
    ? !isActive(statusConfirmTarget.is_active)
    : false;

  function openCreate() {
    setFormData({ name: '', code: '' });
    setFormError('');
    setIsCreateOpen(true);
  }

  function closeCreate() {
    setIsCreateOpen(false);
    setFormError('');
  }

  async function handleCreate() {
    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Name and code are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = await createAdminInstitution({
      name: formData.name.trim(),
      code: formData.code.trim(),
    });
    if (res.error) setFormError(res.error);
    else {
      closeCreate();
      await loadInstitutions();
      toast.success('Institution created');
    }

    setSubmitting(false);
  }

  async function handleRevertInstitutionStatus(institutionId: string, previousActive: boolean) {
    const res = await updateAdminInstitution(institutionId, { isActive: previousActive });
    if (res.error) {
      setStatusActionError(res.error);
      return;
    }
    dismissStatusUndoToast();
    await loadInstitutions();
  }

  async function handleConfirmStatusChange() {
    if (!statusConfirmTarget) return;
    const institution = statusConfirmTarget;
    const previousActive = isActive(institution.is_active);
    const nextActive = !previousActive;

    setStatusActionLoading(true);
    setStatusActionError(null);
    dismissStatusUndoToast();

    const res = await updateAdminInstitution(institution.id, { isActive: nextActive });
    if (res.error) {
      setStatusActionError(res.error);
      setStatusActionLoading(false);
      return;
    }

    setStatusConfirmTarget(null);
    await loadInstitutions();
    showStatusUndoToast({
      message: adminInstitutionUndoToastMessage(nextActive ? 'enable' : 'disable'),
      onUndo: () => handleRevertInstitutionStatus(institution.id, previousActive),
    });
    setStatusActionLoading(false);
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
          <Button variant="primary" size="sm" onClick={openCreate}>
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
                    <ActiveStatusButton
                      active={isActive(institution.is_active)}
                      onClick={() => {
                        setStatusActionError(null);
                        setStatusConfirmTarget(institution);
                      }}
                    />
                    <Link
                      href={`/admin/institutions/${institution.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-oxfordBlue px-3 py-1.5 text-sm font-medium text-oxfordBlue transition-all duration-200 hover:bg-oxfordBlue hover:text-snow"
                    >
                      <FiEdit2 className="h-4 w-4" aria-hidden />
                      Manage
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Modal isOpen={isCreateOpen} onClose={closeCreate} title="New Institution">
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
          <Button type="button" variant="outline" onClick={closeCreate}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={submitting || !formDirty}
            onClick={() => void handleCreate()}
          >
            Create institution
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={Boolean(statusConfirmTarget)}
        onClose={() => {
          if (!statusActionLoading) setStatusConfirmTarget(null);
        }}
        title={willEnableInstitution ? 'Enable institution?' : 'Disable institution?'}
        size="sm"
      >
        <p className="text-sm text-neutral-700">
          {willEnableInstitution
            ? `${statusConfirmTarget?.name} will become available for registration and project setup again.`
            : `${statusConfirmTarget?.name} will be hidden from students and coordinators. Existing data is preserved.`}
        </p>
        {statusActionError ? (
          <p className="mt-3 text-sm text-error-700">{statusActionError}</p>
        ) : null}
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStatusConfirmTarget(null)}
            disabled={statusActionLoading}
          >
            {willEnableInstitution ? 'Keep inactive' : 'Keep active'}
          </Button>
          <Button
            type="button"
            variant={willEnableInstitution ? 'success' : 'error'}
            onClick={() => void handleConfirmStatusChange()}
            loading={statusActionLoading}
            disabled={statusActionLoading}
          >
            {willEnableInstitution ? 'Enable institution' : 'Disable institution'}
          </Button>
        </ModalFooter>
      </Modal>

      <UndoActionToastHost toast={statusUndoToast} onDismiss={dismissStatusUndoToast} />
    </DashboardLayout>
  );
}
