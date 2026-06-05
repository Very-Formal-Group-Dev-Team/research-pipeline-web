'use client';

import React, { useMemo, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  COORDINATOR_DATE_FIELD_WRAPPER_CLASS,
  COORDINATOR_DATE_TIME_ROW_CLASS,
  COORDINATOR_SCHEDULE_DEFENSE_FORM_CLASS,
  COORDINATOR_TIME_FIELD_WRAPPER_CLASS,
  CoordinatorTimeRangeFields,
} from '@/components/coordinator/CoordinatorTimeRangeFields';
import { formLabelClassName } from '@/lib/utils/formControls';
import type { CoordinatorRubric, InstitutionAdviser } from '@/lib/api/coordinator';
import type { DefenseBatchPlannerDraft } from '@/lib/coordinator/defenseBatchSession';

interface DefenseBatchMetadataFormProps {
  draft: DefenseBatchPlannerDraft;
  onDraftChange: (draft: DefenseBatchPlannerDraft) => void;
  rubrics: CoordinatorRubric[];
  panelistPool: InstitutionAdviser[];
  groupCount: number;
}

export default function DefenseBatchMetadataForm({
  draft,
  onDraftChange,
  rubrics,
  panelistPool,
  groupCount,
}: DefenseBatchMetadataFormProps) {
  const [panelistQuery, setPanelistQuery] = useState('');

  const filteredRubrics = useMemo(
    () => rubrics.filter((rubric) => rubric.defense_type === draft.defenseType),
    [rubrics, draft.defenseType],
  );

  const selectedPanelists = useMemo(
    () =>
      draft.panelistIds
        .map((id) => panelistPool.find((panelist) => panelist.id === id))
        .filter((panelist): panelist is InstitutionAdviser => !!panelist),
    [draft.panelistIds, panelistPool],
  );

  const panelistSuggestions = useMemo(() => {
    const selectedIds = new Set(draft.panelistIds);
    const term = panelistQuery.trim().toLowerCase();
    return panelistPool.filter((member) => {
      if (selectedIds.has(member.id)) return false;
      if (!term) return false;
      const name = member.full_name?.toLowerCase() || '';
      const email = member.email?.toLowerCase() || '';
      return name.includes(term) || email.includes(term);
    });
  }, [panelistPool, panelistQuery, draft.panelistIds]);

  function updateDraft(patch: Partial<DefenseBatchPlannerDraft>) {
    onDraftChange({ ...draft, ...patch });
  }

  function addPanelist(panelist: InstitutionAdviser) {
    if (draft.panelistIds.includes(panelist.id)) return;
    updateDraft({ panelistIds: [...draft.panelistIds, panelist.id] });
    setPanelistQuery('');
  }

  function removePanelist(panelistId: string) {
    updateDraft({ panelistIds: draft.panelistIds.filter((id) => id !== panelistId) });
  }

  return (
    <Card padding="md" shadow="soft" hoverShadow={false} className="h-full">
      <h2 className="mb-4 text-lg font-semibold coordinator-heading">Defense Details</h2>
      <div className={`space-y-3 ${COORDINATOR_SCHEDULE_DEFENSE_FORM_CLASS}`}>
        <Input
          label="Course"
          value={draft.courseName}
          readOnly
          responsiveText
          fullWidth
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            fullWidth
            responsiveText
            label="Defense Type"
            value={draft.defenseType}
            onChange={(e) =>
              updateDraft({
                defenseType: e.target.value as DefenseBatchPlannerDraft['defenseType'],
                rubricId: '',
              })
            }
            options={[
              { value: 'proposal', label: 'Proposal' },
              { value: 'midterm', label: 'Midterm' },
              { value: 'final', label: 'Final' },
            ]}
          />
          <Select
            fullWidth
            responsiveText
            label="Rubric"
            placeholder="Optional"
            value={draft.rubricId}
            onChange={(e) => updateDraft({ rubricId: e.target.value })}
            options={filteredRubrics.map((rubric) => ({ value: rubric.id, label: rubric.name }))}
          />
        </div>
        <div className={COORDINATOR_DATE_TIME_ROW_CLASS}>
          <div className={COORDINATOR_DATE_FIELD_WRAPPER_CLASS}>
            <Input
              label="Date"
              type="date"
              required
              value={draft.date}
              onChange={(e) => updateDraft({ date: e.target.value })}
              responsiveText
              fullWidth
            />
          </div>
          <div className={COORDINATOR_TIME_FIELD_WRAPPER_CLASS}>
            <CoordinatorTimeRangeFields
              required
              startTime={draft.startTime}
              endTime={draft.endTime}
              onStartChange={(value) => updateDraft({ startTime: value })}
              onEndChange={(value) => updateDraft({ endTime: value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            fullWidth
            responsiveText
            label="Modality"
            value={draft.modality}
            onChange={(e) => updateDraft({ modality: e.target.value })}
            options={[
              { value: 'Online', label: 'Online' },
              { value: 'In-Person', label: 'Face-to-Face' },
              { value: 'Hybrid', label: 'Hybrid' },
            ]}
          />
          <Input
            label="Location"
            required
            value={draft.location}
            onChange={(e) => updateDraft({ location: e.target.value, venue: e.target.value })}
            responsiveText
            fullWidth
          />
        </div>
        <div>
          <label className={formLabelClassName}>Panelists</label>
          <div className="space-y-3 rounded-lg border border-neutral-200 p-3">
            <div className="relative">
              <FiSearch
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <input
                type="text"
                value={panelistQuery}
                onChange={(e) => setPanelistQuery(e.target.value)}
                className="coordinator-panelist-search w-full rounded-sm border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-coordinator-rose/40"
                placeholder="Search advisers or coordinators by name or email..."
              />
              {panelistSuggestions.length > 0 ? (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                  {panelistSuggestions.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addPanelist(user)}
                      className="flex w-full items-center gap-3 border-b border-neutral-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-coordinator-rose/5"
                    >
                      <Avatar
                        src={user.avatar_url ?? undefined}
                        name={user.full_name || 'Unknown'}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-coordinator-ink">
                          {user.full_name || 'Unknown'}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
              {panelistSuggestions.length === 0 && panelistQuery.trim().length > 0 ? (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-lg">
                  <p className="text-sm text-neutral-500">No advisers or coordinators found matching your search.</p>
                </div>
              ) : null}
            </div>
            {selectedPanelists.length > 0 ? (
              <ul className="space-y-2">
                {selectedPanelists.map((panelist) => (
                  <li
                    key={panelist.id}
                    className="flex items-center gap-3 rounded-lg border border-coordinator-rose/20 bg-coordinator-rose/5 px-3 py-2"
                  >
                    <Avatar
                      src={panelist.avatar_url ?? undefined}
                      name={panelist.full_name || 'Unknown'}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-coordinator-ink">
                        {panelist.full_name || 'Unknown'}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{panelist.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePanelist(panelist.id)}
                      className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
                      aria-label={`Remove ${panelist.full_name || 'panelist'}`}
                    >
                      <FiX className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">
                Search and add advisers or coordinators from your institution to serve as panelists.
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-coordinator-ink">Total Groups:</span> {groupCount}
        </p>
      </div>
    </Card>
  );
}
