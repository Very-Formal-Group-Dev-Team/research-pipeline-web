'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/Button';
import {
  formLabelClassName,
  formTextareaResponsiveClassName,
  rubricCriteriaInputClassName,
  rubricCriteriaWeightInputClassName,
} from '@/lib/utils/formControls';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  SAMPLE_COORDINATOR_RUBRIC,
  createCoordinatorRubric,
  updateCoordinatorRubric,
  getCoordinatorRubric,
  type CoordinatorRubric,
  type DefenseType,
  type SaveCoordinatorRubricPayload,
} from '@/lib/api/coordinator';

type CriterionRow = {
  key: string;
  criterionName: string;
  description: string;
  weight: string;
};

const DEFENSE_TYPES: { value: DefenseType; label: string }[] = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
];

function rowsFromTemplate(template: SaveCoordinatorRubricPayload): CriterionRow[] {
  return template.criteria.map((c, i) => ({
    key: `row-${i}`,
    criterionName: c.criterionName,
    description: c.description ?? '',
    weight: String(c.weight),
  }));
}

function rowsFromRubric(rubric: CoordinatorRubric): CriterionRow[] {
  const criteria = rubric.criteria || [];
  return criteria.map((c, i) => ({
    key: c.id || `row-${i}`,
    criterionName: c.criterion_name,
    description: c.description ?? '',
    weight: String(c.weight),
  }));
}

function parseWeight(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface RubricEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rubricId?: string | null;
  onSaved: () => void;
}

export default function RubricEditorModal({
  isOpen,
  onClose,
  rubricId,
  onSaved,
}: RubricEditorModalProps) {
  const isEdit = Boolean(rubricId);
  const [name, setName] = useState(SAMPLE_COORDINATOR_RUBRIC.name);
  const [description, setDescription] = useState(SAMPLE_COORDINATOR_RUBRIC.description);
  const [defenseType, setDefenseType] = useState<DefenseType>(SAMPLE_COORDINATOR_RUBRIC.defenseType);
  const [rows, setRows] = useState<CriterionRow[]>(() => rowsFromTemplate(SAMPLE_COORDINATOR_RUBRIC));
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function init() {
      setError('');
      if (!rubricId) {
        setName(SAMPLE_COORDINATOR_RUBRIC.name);
        setDescription(SAMPLE_COORDINATOR_RUBRIC.description);
        setDefenseType(SAMPLE_COORDINATOR_RUBRIC.defenseType);
        setRows(rowsFromTemplate(SAMPLE_COORDINATOR_RUBRIC));
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await getCoordinatorRubric(rubricId);
      if (cancelled) return;
      setLoading(false);

      if (res.error || !res.data) {
        setError(res.error || 'Failed to load rubric');
        return;
      }

      setName(res.data.name);
      setDescription(res.data.description ?? '');
      setDefenseType(res.data.defense_type);
      setRows(rowsFromRubric(res.data));
    }

    init();
    return () => { cancelled = true; };
  }, [isOpen, rubricId]);

  const totalWeight = useMemo(
    () => rows.reduce((sum, row) => sum + parseWeight(row.weight), 0),
    [rows],
  );

  const weightsValid = Math.abs(totalWeight - 100) < 0.01;
  const canSave =
    !loading &&
    !submitting &&
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    rows.length > 0 &&
    rows.every((r) => r.criterionName.trim().length > 0 && parseWeight(r.weight) > 0) &&
    weightsValid;

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: `row-${Date.now()}`, criterionName: '', description: '', weight: '' },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function updateRow(
    key: string,
    field: 'criterionName' | 'description' | 'weight',
    value: string,
  ) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    setError('');

    const payload: SaveCoordinatorRubricPayload = {
      name: name.trim(),
      description: description.trim(),
      defenseType,
      criteria: rows.map((r) => {
        const criterionDescription = r.description.trim();
        return {
          criterionName: r.criterionName.trim(),
          weight: parseWeight(r.weight),
          description: criterionDescription.length ? criterionDescription : null,
        };
      }),
    };

    const res = isEdit && rubricId
      ? await updateCoordinatorRubric(rubricId, payload)
      : await createCoordinatorRubric(payload);

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Rubric' : 'New Rubric'}
      size="xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
        </div>
      ) : (
        <div className="space-y-5 p-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Rubric name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Proposal Defense Rubric"
              responsiveText
              fullWidth
            />
            <Select
              label="Defense type"
              value={defenseType}
              onChange={(e) => setDefenseType(e.target.value as DefenseType)}
              options={DEFENSE_TYPES}
              responsiveText
              fullWidth
            />
          </div>

          <div>
            <label className={formLabelClassName}>
              Rubric description <span className="text-error-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={formTextareaResponsiveClassName}
              placeholder="Describe the purpose and scope of this rubric"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-800">Criteria</h3>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                <FiPlus /> Add row
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-2 py-1.5 md:px-3 md:py-2 text-left font-medium text-neutral-600">
                      Criterion
                    </th>
                    <th className="min-w-[12rem] px-2 py-1.5 md:px-3 md:py-2 text-left font-medium text-neutral-600">
                      Description
                    </th>
                    <th className="w-[4.5rem] px-2 py-1.5 md:px-3 md:py-2 text-left font-medium text-neutral-600">
                      Weight (%)
                    </th>
                    <th className="w-14 px-2 py-1.5 md:px-3 md:py-2" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-neutral-500">
                        No criteria yet. Add a row or use the sample template.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.key}>
                        <td className="px-2 py-1.5 md:px-3 md:py-2">
                          <input
                            type="text"
                            value={row.criterionName}
                            onChange={(e) => updateRow(row.key, 'criterionName', e.target.value)}
                            className={rubricCriteriaInputClassName}
                            placeholder="Criterion name"
                          />
                        </td>
                        <td className="px-2 py-1.5 md:px-3 md:py-2">
                          <textarea
                            value={row.description}
                            onChange={(e) => updateRow(row.key, 'description', e.target.value)}
                            className={`${rubricCriteriaInputClassName} resize-none h-full`}
                            placeholder="Optional"
                          />
                        </td>
                        <td className="w-[4.5rem] px-2 py-1.5 md:px-2 md:py-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={row.weight}
                            onChange={(e) => updateRow(row.key, 'weight', e.target.value)}
                            className={rubricCriteriaWeightInputClassName}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-1.5 md:px-1 md:py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            disabled={rows.length <= 1}
                            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-error-50 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Remove row"
                            aria-label="Remove row"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p
              className={`mt-2 text-sm ${
                weightsValid ? 'text-green-700' : 'text-amber-700'
              }`}
            >
              Total weight: {Math.round(totalWeight * 100) / 100}%
              {!weightsValid && ' — must equal 100% to save'}
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!canSave}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create rubric'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
