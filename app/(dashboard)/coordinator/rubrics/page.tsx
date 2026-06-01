'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Modal from '@/components/ui/Modal';
import RubricEditorModal from '@/components/coordinator/RubricEditorModal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getCoordinatorRubrics,
  deleteCoordinatorRubric,
  type CoordinatorRubric,
  type DefenseType,
} from '@/lib/api/coordinator';

const DEFENSE_LABELS: Record<DefenseType, string> = {
  proposal: 'Proposal',
  midterm: 'Midterm',
  final: 'Final',
};

export default function CoordinatorRubricPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [rubrics, setRubrics] = useState<CoordinatorRubric[]>([]);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CoordinatorRubric | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function loadRubrics() {
    setLoading(true);
    const res = await getCoordinatorRubrics();
    if (res.data) setRubrics(res.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    loadRubrics().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, []);

  function openCreate() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEdit(rubric: CoordinatorRubric) {
    setEditingId(rubric.id);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    const res = await deleteCoordinatorRubric(deleteTarget.id);
    setDeleting(false);
    if (res.error) {
      setDeleteError(res.error);
      return;
    }
    setDeleteTarget(null);
    await loadRubrics();
  }

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Rubrics</h1>
            <p className="text-neutral-600 mt-1">
              Define defense rubrics with weighted criteria (total must equal 100%)
            </p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <FiPlus className="mr-2" /> New Rubric
          </Button>
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
                    <th className="px-4 py-3 sm:px-6 font-medium text-neutral-600">Rubric name</th>
                    <th className="px-4 py-3 sm:px-6 font-medium text-neutral-600">Description</th>
                    <th className="px-4 py-3 sm:px-6 font-medium text-neutral-600">Defense type</th>
                    <th className="px-4 py-3 sm:px-6 font-medium text-neutral-600">Criteria</th>
                    <th className="px-4 py-3 sm:px-6 font-medium text-neutral-600">Total weight</th>
                    <th className="px-4 py-3 sm:px-6 font-medium text-neutral-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rubrics.map((rubric) => {
                    const total = Number(rubric.total_weight ?? 0);
                    const weightOk = Math.abs(total - 100) < 0.01;
                    return (
                      <tr key={rubric.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 sm:px-6 font-medium text-neutral-800">{rubric.name}</td>
                        <td className="px-4 py-3 sm:px-6 text-neutral-600 max-w-xs truncate" title={rubric.description}>
                          {rubric.description || '—'}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-neutral-600 capitalize">
                          {DEFENSE_LABELS[rubric.defense_type] || rubric.defense_type}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-neutral-600">
                          {rubric.criteria_count ?? 0}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <span className={weightOk ? 'text-green-700' : 'text-amber-700'}>
                            {Math.round(total * 100) / 100}%
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(rubric)}
                              className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Edit rubric"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError('');
                                setDeleteTarget(rubric);
                              }}
                              className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                              title="Delete rubric"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>

      <RubricEditorModal
        isOpen={editorOpen}
        onClose={closeEditor}
        rubricId={editingId}
        onSaved={loadRubrics}
      />

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError('');
        }}
        title="Delete rubric"
        size="sm"
      >
        <div className="space-y-4 p-6 pt-0">
          <p className="text-neutral-600">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          {deleteError && (
            <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{deleteError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError('');
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="error" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
