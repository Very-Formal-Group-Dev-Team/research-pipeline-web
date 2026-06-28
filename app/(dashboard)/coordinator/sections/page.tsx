'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getCoordinatorSections,
  createCoordinatorSection,
  updateCoordinatorSection,
  deleteCoordinatorSection,
  type InstitutionSectionRecord,
} from '@/lib/api/coordinator';
import { toast } from 'sonner';

export default function CoordinatorSectionsPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [sections, setSections] = useState<InstitutionSectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<InstitutionSectionRecord | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<InstitutionSectionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const duplicateName = useMemo(() => {
    const name = formData.name.trim().toLowerCase();
    if (!name) return false;
    return sections.some(
      (item) =>
        item.name.trim().toLowerCase() === name && item.id !== editingSection?.id,
    );
  }, [formData.name, sections, editingSection]);

  const formDirty = useMemo(() => {
    if (!editingSection) return true;
    return (
      formData.name.trim() !== editingSection.name ||
      formData.code.trim() !== (editingSection.code || '').trim()
    );
  }, [editingSection, formData]);

  async function loadSections() {
    setLoading(true);
    const res = await getCoordinatorSections();
    if (res.data) setSections(res.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    loadSections().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditingSection(null);
    setFormData({ name: '', code: '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function openEdit(section: InstitutionSectionRecord) {
    setEditingSection(section);
    setFormData({ name: section.name, code: section.code || '' });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (submitting) return;
    setIsFormOpen(false);
    setEditingSection(null);
    setFormData({ name: '', code: '' });
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = formData.name.trim();
    const code = formData.code.trim();

    if (!name) {
      setFormError('Section name is required');
      return;
    }
    if (duplicateName) {
      setFormError('A section with this name already exists');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = editingSection
      ? await updateCoordinatorSection(editingSection.id, { name, code: code || undefined })
      : await createCoordinatorSection({ name, code: code || undefined });

    setSubmitting(false);

    if (res.error) {
      setFormError(res.error);
      return;
    }

    toast.success(editingSection ? 'Section updated' : 'Section created');
    closeForm();
    await loadSections();
  }

  async function toggleActive(section: InstitutionSectionRecord) {
    const isActive = Boolean(section.is_active);
    const res = await updateCoordinatorSection(section.id, { isActive: !isActive });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isActive ? 'Section deactivated' : 'Section activated');
    await loadSections();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    const res = await deleteCoordinatorSection(deleteTarget.id);
    setDeleting(false);
    if (res.error) {
      setDeleteError(res.error);
      return;
    }
    toast.success('Section deleted');
    setDeleteTarget(null);
    await loadSections();
  }

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Sections</h1>
            <p className="mt-1 text-neutral-600">
              Define class sections students can choose when creating projects
            </p>
          </div>
          <Button variant="primary" size="sm" className="shrink-0" onClick={openCreate}>
            <FiPlus className="mr-1" /> New Section
          </Button>
        </div>

        {loading ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">Loading sections...</div>
          </Card>
        ) : sections.length === 0 ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">
              No sections yet. Create one so students can select their class section.
            </div>
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Name</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Code</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Status</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {sections.map((section) => {
                    const isActive = Boolean(section.is_active);
                    return (
                      <tr key={section.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-800 sm:px-6">
                          {section.name}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 sm:px-6">
                          {section.code?.trim() || '—'}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <Badge variant={isActive ? 'success' : 'default'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(section)}
                              aria-label={`Edit ${section.name}`}
                            >
                              <FiEdit2 />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void toggleActive(section)}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-archivumRed hover:bg-archivumRed/10"
                              onClick={() => {
                                setDeleteError('');
                                setDeleteTarget(section);
                              }}
                              aria-label={`Delete ${section.name}`}
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingSection ? 'Edit section' : 'New section'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Section name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. 4A"
            required
            responsiveText
          />
          <Input
            label="Code (optional)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Short code"
            responsiveText
          />
          {formError ? <p className="text-sm text-archivumRed">{formError}</p> : null}
          {duplicateName ? (
            <p className="text-sm text-archivumRed">A section with this name already exists</p>
          ) : null}
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!formDirty || duplicateName}
            >
              {editingSection ? 'Save changes' : 'Create section'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (deleting) return;
          setDeleteTarget(null);
          setDeleteError('');
        }}
        title="Delete section?"
        size="sm"
      >
        <p className="text-sm text-neutral-600">
          Delete <span className="font-semibold text-neutral-900">{deleteTarget?.name}</span>?
          This cannot be undone. Sections in use by projects cannot be deleted.
        </p>
        {deleteError ? <p className="mt-3 text-sm text-archivumRed">{deleteError}</p> : null}
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button type="button" variant="error" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
