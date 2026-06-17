'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEdit2,
  FiMinusCircle,
  FiPlus,
  FiSave,
} from 'react-icons/fi';
import { toast } from 'sonner';

import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import { formTextareaResponsiveClassName } from '@/lib/utils/formControls';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  adminInstitutionUndoToastMessage,
  adminProgramUndoToastMessage,
} from '@/lib/meetings/undoStatusMessages';
import {
  createAdminProgram,
  listAdminInstitutions,
  listAdminPrograms,
  updateAdminInstitution,
  updateAdminProgram,
  type AdminInstitution,
  type AdminProgram,
} from '@/lib/api/admin';
import AdminInstitutionDetailSkeleton from '@/components/skeletons/AdminInstitutionDetailSkeleton';

function isActive(value: AdminInstitution['is_active'] | AdminProgram['is_active']): boolean {
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

export default function AdminInstitutionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const institutionId = typeof params?.id === 'string' ? params.id : '';
  const { user, handleLogout } = useDashboardUser('Admin');

  const [institution, setInstitution] = useState<AdminInstitution | null>(null);
  const [institutionForm, setInstitutionForm] = useState({ name: '', code: '' });
  const [institutionError, setInstitutionError] = useState('');
  const [savingInstitution, setSavingInstitution] = useState(false);

  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AdminProgram | null>(null);
  const [programForm, setProgramForm] = useState({ name: '', code: '', description: '' });
  const [programSubmitting, setProgramSubmitting] = useState(false);
  const [programFormError, setProgramFormError] = useState('');
  const [institutionStatusConfirmOpen, setInstitutionStatusConfirmOpen] = useState(false);
  const [programStatusTarget, setProgramStatusTarget] = useState<AdminProgram | null>(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const { toast: statusUndoToast, showUndoToast: showStatusUndoToast, dismissUndoToast: dismissStatusUndoToast } =
    useUndoActionToast();

  const loadData = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    const [instRes, progRes] = await Promise.all([
      listAdminInstitutions(),
      listAdminPrograms(institutionId),
    ]);
    const match = instRes.data?.find((row) => row.id === institutionId) || null;
    setInstitution(match);
    if (match) {
      setInstitutionForm({ name: match.name, code: match.code });
    }
    setPrograms(progRes.data || []);
    setLoading(false);
  }, [institutionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const institutionDirty = useMemo(() => {
    if (!institution) return false;
    return (
      institutionForm.name.trim() !== institution.name ||
      institutionForm.code.trim().toUpperCase() !== institution.code
    );
  }, [institution, institutionForm]);

  const programFormDirty = useMemo(() => {
    if (!editingProgram) {
      return Boolean(programForm.name.trim() && programForm.code.trim());
    }
    return (
      programForm.name.trim() !== editingProgram.name ||
      programForm.code.trim().toUpperCase() !== editingProgram.code ||
      programForm.description.trim() !== (editingProgram.description || '').trim()
    );
  }, [editingProgram, programForm]);

  const willEnableInstitution = institution
    ? !isActive(institution.is_active)
    : false;
  const willEnableProgram = programStatusTarget
    ? !isActive(programStatusTarget.is_active)
    : false;

  async function handleSaveInstitution() {
    if (!institution || !institutionForm.name.trim() || !institutionForm.code.trim()) {
      setInstitutionError('Name and code are required.');
      return;
    }
    if (!institutionDirty) return;

    setSavingInstitution(true);
    setInstitutionError('');

    const res = await updateAdminInstitution(institution.id, {
      name: institutionForm.name.trim(),
      code: institutionForm.code.trim(),
    });

    if (res.error) {
      setInstitutionError(res.error);
    } else {
      await loadData();
      toast.success('Institution updated');
    }

    setSavingInstitution(false);
  }

  async function handleRevertInstitutionStatus(previousActive: boolean) {
    if (!institution) return;
    const res = await updateAdminInstitution(institution.id, { isActive: previousActive });
    if (res.error) {
      setStatusActionError(res.error);
      return;
    }
    dismissStatusUndoToast();
    await loadData();
  }

  async function handleConfirmInstitutionStatusChange() {
    if (!institution) return;
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

    setInstitutionStatusConfirmOpen(false);
    await loadData();
    showStatusUndoToast({
      message: adminInstitutionUndoToastMessage(nextActive ? 'enable' : 'disable'),
      onUndo: () => handleRevertInstitutionStatus(previousActive),
    });
    setStatusActionLoading(false);
  }

  async function handleRevertProgramStatus(programId: string, previousActive: boolean) {
    const res = await updateAdminProgram(institutionId, programId, { isActive: previousActive });
    if (res.error) {
      setStatusActionError(res.error);
      return;
    }
    dismissStatusUndoToast();
    await loadData();
  }

  async function handleConfirmProgramStatusChange() {
    if (!programStatusTarget) return;
    const program = programStatusTarget;
    const previousActive = isActive(program.is_active);
    const nextActive = !previousActive;

    setStatusActionLoading(true);
    setStatusActionError(null);
    dismissStatusUndoToast();

    const res = await updateAdminProgram(institutionId, program.id, { isActive: nextActive });
    if (res.error) {
      setStatusActionError(res.error);
      setStatusActionLoading(false);
      return;
    }

    setProgramStatusTarget(null);
    await loadData();
    showStatusUndoToast({
      message: adminProgramUndoToastMessage(nextActive ? 'enable' : 'disable'),
      onUndo: () => handleRevertProgramStatus(program.id, previousActive),
    });
    setStatusActionLoading(false);
  }

  function openCreateProgram() {
    setEditingProgram(null);
    setProgramForm({ name: '', code: '', description: '' });
    setProgramFormError('');
    setIsProgramFormOpen(true);
  }

  function openEditProgram(program: AdminProgram) {
    setEditingProgram(program);
    setProgramForm({
      name: program.name,
      code: program.code,
      description: program.description || '',
    });
    setProgramFormError('');
    setIsProgramFormOpen(true);
  }

  function closeProgramForm() {
    setIsProgramFormOpen(false);
    setEditingProgram(null);
    setProgramFormError('');
  }

  async function handleProgramSubmit() {
    if (!institutionId || !programForm.name.trim() || !programForm.code.trim()) {
      setProgramFormError('Name and code are required.');
      return;
    }
    if (editingProgram && !programFormDirty) return;

    setProgramSubmitting(true);
    setProgramFormError('');

    const payload = {
      name: programForm.name.trim(),
      code: programForm.code.trim(),
      description: programForm.description.trim() || undefined,
    };

    const res = editingProgram
      ? await updateAdminProgram(institutionId, editingProgram.id, payload)
      : await createAdminProgram(institutionId, payload);

    if (res.error) {
      setProgramFormError(res.error);
    } else {
      closeProgramForm();
      await loadData();
      toast.success(editingProgram ? 'Program updated' : 'Program created');
    }

    setProgramSubmitting(false);
  }

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">
              {institution?.name || 'Institution'}
            </h1>
            <p className="mt-1 text-neutral-600">
              Edit institution details and manage its program catalog
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {institution ? (
              <ActiveStatusButton
                active={isActive(institution.is_active)}
                onClick={() => {
                  setStatusActionError(null);
                  setInstitutionStatusConfirmOpen(true);
                }}
              />
            ) : null}
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
          </div>
        </div>

        {loading ? (
          <AdminInstitutionDetailSkeleton />
        ) : !institution ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">Institution not found.</div>
          </Card>
        ) : (
          <>
            <Card>
              <h2 className="text-lg font-semibold text-neutral-800">Institution details</h2>
              <div className="mt-4 space-y-4">
                {institutionError ? (
                  <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                    {institutionError}
                  </div>
                ) : null}
                <Input
                  label="Institution name"
                  value={institutionForm.name}
                  onChange={(e) =>
                    setInstitutionForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Mapúa Malayan Colleges Mindanao"
                  responsiveText
                  fullWidth
                />
                <Input
                  label="Code"
                  value={institutionForm.code}
                  onChange={(e) =>
                    setInstitutionForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. MMCM"
                  responsiveText
                  fullWidth
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="shrink-0"
                    loading={savingInstitution}
                    disabled={savingInstitution || !institutionDirty}
                    leftIcon={
                      !savingInstitution ? <FiSave className="h-4 w-4" aria-hidden /> : undefined
                    }
                    onClick={() => void handleSaveInstitution()}
                  >
                    {savingInstitution ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Programs</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Programs students can select when creating projects
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={openCreateProgram}>
                <FiPlus className="mr-2" aria-hidden />
                New Program
              </Button>
            </div>

            {programs.length === 0 ? (
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
                        <ActiveStatusButton
                          active={isActive(program.is_active)}
                          onClick={() => {
                            setStatusActionError(null);
                            setProgramStatusTarget(program);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<FiEdit2 aria-hidden />}
                          onClick={() => openEditProgram(program)}
                        >
                          Edit
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isProgramFormOpen}
        onClose={closeProgramForm}
        title={editingProgram ? 'Edit Program' : 'New Program'}
      >
        <div className="space-y-4">
          {programFormError ? (
            <div className="rounded-md border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {programFormError}
            </div>
          ) : null}
          <Input
            label="Program name"
            value={programForm.name}
            onChange={(e) => setProgramForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Bachelor of Science in Computer Science"
            responsiveText
            fullWidth
          />
          <Input
            label="Code"
            value={programForm.code}
            onChange={(e) =>
              setProgramForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g. BSCS"
            responsiveText
            fullWidth
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              value={programForm.description}
              onChange={(e) =>
                setProgramForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className={formTextareaResponsiveClassName}
              placeholder="Optional details about this program"
            />
          </div>
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={closeProgramForm}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={programSubmitting}
            disabled={programSubmitting || !programFormDirty}
            onClick={() => void handleProgramSubmit()}
          >
            {editingProgram ? 'Save changes' : 'Create program'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={institutionStatusConfirmOpen}
        onClose={() => {
          if (!statusActionLoading) setInstitutionStatusConfirmOpen(false);
        }}
        title={willEnableInstitution ? 'Enable institution?' : 'Disable institution?'}
        size="sm"
      >
        <p className="text-sm text-neutral-700">
          {willEnableInstitution
            ? `${institution?.name} will become available for registration and project setup again.`
            : `${institution?.name} will be hidden from students and coordinators. Existing data is preserved.`}
        </p>
        {statusActionError ? (
          <p className="mt-3 text-sm text-error-700">{statusActionError}</p>
        ) : null}
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setInstitutionStatusConfirmOpen(false)}
            disabled={statusActionLoading}
          >
            {willEnableInstitution ? 'Keep inactive' : 'Keep active'}
          </Button>
          <Button
            type="button"
            variant={willEnableInstitution ? 'success' : 'error'}
            onClick={() => void handleConfirmInstitutionStatusChange()}
            loading={statusActionLoading}
            disabled={statusActionLoading}
          >
            {willEnableInstitution ? 'Enable institution' : 'Disable institution'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={Boolean(programStatusTarget)}
        onClose={() => {
          if (!statusActionLoading) setProgramStatusTarget(null);
        }}
        title={willEnableProgram ? 'Enable program?' : 'Disable program?'}
        size="sm"
      >
        <p className="text-sm text-neutral-700">
          {willEnableProgram
            ? `${programStatusTarget?.name} will be available for students to select when creating projects.`
            : `${programStatusTarget?.name} will no longer be available for new project selections.`}
        </p>
        {statusActionError ? (
          <p className="mt-3 text-sm text-error-700">{statusActionError}</p>
        ) : null}
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setProgramStatusTarget(null)}
            disabled={statusActionLoading}
          >
            {willEnableProgram ? 'Keep inactive' : 'Keep active'}
          </Button>
          <Button
            type="button"
            variant={willEnableProgram ? 'success' : 'error'}
            onClick={() => void handleConfirmProgramStatusChange()}
            loading={statusActionLoading}
            disabled={statusActionLoading}
          >
            {willEnableProgram ? 'Enable program' : 'Disable program'}
          </Button>
        </ModalFooter>
      </Modal>

      <UndoActionToastHost toast={statusUndoToast} onDismiss={dismissStatusUndoToast} />
    </DashboardLayout>
  );
}
