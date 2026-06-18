'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronRight, FiLoader, FiSave } from 'react-icons/fi';
import { toast } from 'sonner';

import Button from '@/components/Button';
import {
  getDefenseMeetingSession,
  saveDefensePanelEvaluations,
  type DefenseMeetingProject,
  type DefensePanelEvaluation,
} from '@/lib/api/defenses';
import type { CoordinatorRubric } from '@/lib/api/coordinator';
import { MEETING_CONTROL_BAR_HEIGHT } from '@/lib/meetings/jitsiTheme';

type ScoreDraft = {
  score: string;
  comments: string;
};

interface DefensePanelOverlayProps {
  defenseId: string;
  meetingProjects: DefenseMeetingProject[];
  rubric: CoordinatorRubric | null;
  evaluations: DefensePanelEvaluation[];
  initialNotes: string;
  initialTotalScore?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (notes: string) => void;
}

function buildScoreDrafts(
  rubric: CoordinatorRubric | null,
  evaluations: DefensePanelEvaluation[],
): Record<string, ScoreDraft> {
  const byCriterion = new Map(
    evaluations.map((row) => [row.criterion_id, row]),
  );

  const drafts: Record<string, ScoreDraft> = {};
  for (const criterion of rubric?.criteria || []) {
    if (!criterion.id) continue;
    const existing = byCriterion.get(criterion.id);
    drafts[criterion.id] = {
      score: existing ? String(existing.score) : '',
      comments: existing?.comments || '',
    };
  }
  return drafts;
}

function computeDraftTotalScore(
  rubric: CoordinatorRubric | null,
  scoreDrafts: Record<string, ScoreDraft>,
): number | null {
  const criteria = rubric?.criteria || [];
  if (!criteria.length) return null;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const criterion of criteria) {
    if (!criterion.id) continue;
    const draft = scoreDrafts[criterion.id];
    const score = Number(draft?.score ?? '');
    const weight = Number(criterion.weight) || 0;
    const maxScore = Number(criterion.max_score) || 5;
    if (!Number.isFinite(score) || weight <= 0 || maxScore <= 0) continue;
    weightedSum += (score / maxScore) * weight;
    totalWeight += weight;
  }

  if (!totalWeight) return null;
  return Math.round((weightedSum / totalWeight) * 10000) / 100;
}

export default function DefensePanelOverlay({
  defenseId,
  meetingProjects,
  rubric,
  evaluations,
  initialNotes,
  initialTotalScore = null,
  open,
  onOpenChange,
  onSaved,
}: DefensePanelOverlayProps) {
  const [activeTab, setActiveTab] = useState<'rubric' | 'notes'>(rubric ? 'rubric' : 'notes');
  const [selectedDefenseId, setSelectedDefenseId] = useState(defenseId);
  const [notes, setNotes] = useState(initialNotes);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, ScoreDraft>>(() =>
    buildScoreDrafts(rubric, evaluations),
  );
  const [totalScore, setTotalScore] = useState<number | null>(initialTotalScore);
  const [loadingProject, setLoadingProject] = useState(false);
  const [saving, setSaving] = useState(false);

  const projectOptions = useMemo(() => {
    if (meetingProjects.length) return meetingProjects;
    return [];
  }, [meetingProjects]);

  useEffect(() => {
    setSelectedDefenseId(defenseId);
  }, [defenseId]);

  useEffect(() => {
    if (selectedDefenseId === defenseId) {
      setNotes(initialNotes);
      setScoreDrafts(buildScoreDrafts(rubric, evaluations));
      setTotalScore(initialTotalScore ?? null);
    }
  }, [defenseId, evaluations, initialNotes, initialTotalScore, rubric, selectedDefenseId]);

  useEffect(() => {
    if (!open || selectedDefenseId === defenseId) return undefined;

    let cancelled = false;
    setLoadingProject(true);

    void getDefenseMeetingSession(selectedDefenseId).then((res) => {
      if (cancelled) return;
      setLoadingProject(false);

      if (res.error || !res.data) {
        toast.error(res.error || 'Failed to load project evaluation');
        setSelectedDefenseId(defenseId);
        return;
      }

      if (!res.data.is_panelist) {
        toast.error('You are not assigned as a panelist for that project');
        setSelectedDefenseId(defenseId);
        return;
      }

      setNotes(res.data.notes);
      setScoreDrafts(buildScoreDrafts(res.data.rubric || rubric, res.data.evaluations));
      setTotalScore(res.data.total_score ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [defenseId, open, rubric, selectedDefenseId]);

  const criteria = useMemo(() => rubric?.criteria || [], [rubric]);
  const draftTotalScore = useMemo(
    () => computeDraftTotalScore(rubric, scoreDrafts),
    [rubric, scoreDrafts],
  );
  const displayedTotalScore = draftTotalScore ?? totalScore;

  async function handleSave() {
    const scores = criteria
      .filter((criterion) => criterion.id)
      .map((criterion) => {
        const draft = scoreDrafts[criterion.id as string];
        return {
          criterionId: criterion.id as string,
          score: Number(draft?.score ?? ''),
          comments: draft?.comments?.trim() || undefined,
        };
      })
      .filter((row) => Number.isFinite(row.score));

    setSaving(true);
    const res = await saveDefensePanelEvaluations(selectedDefenseId, {
      scores,
      notes,
    });
    setSaving(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    setTotalScore(res.data?.total_score ?? draftTotalScore);
    toast.success('Panel evaluation saved');
    onSaved?.(notes);
  }

  if (!open) {
    return null;
  }

  const selectedProject = projectOptions.find((project) => project.defense_id === selectedDefenseId);

  return (
    <div
      className="pointer-events-auto fixed left-4 z-30 flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-white/15 bg-neutral-900/95 text-white shadow-2xl backdrop-blur-md"
      style={{
        top: `calc(${MEETING_CONTROL_BAR_HEIGHT} + 0.5rem)`,
        maxHeight: `calc(100vh - ${MEETING_CONTROL_BAR_HEIGHT} - 1rem)`,
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Panel Evaluation</p>
          <p className="text-xs text-neutral-300">{rubric?.name || 'Notes only'}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-sm p-1.5 text-neutral-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Close panel tools"
        >
          <FiChevronRight aria-hidden />
        </button>
      </div>

      {projectOptions.length > 1 ? (
        <div className="border-b border-white/10 px-4 py-3">
          <label className="block text-xs font-medium text-neutral-300">
            Project
            <select
              value={selectedDefenseId}
              onChange={(e) => setSelectedDefenseId(e.target.value)}
              disabled={loadingProject || saving}
              className="mt-1 w-full rounded-sm border border-white/15 bg-neutral-950/70 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
            >
              {projectOptions.map((project) => (
                <option key={project.defense_id} value={project.defense_id}>
                  {project.project_title} ({project.project_code})
                </option>
              ))}
            </select>
          </label>
          {selectedProject ? (
            <p className="mt-1 text-xs text-neutral-400">
              Scores and notes are saved separately for each project in this defense meeting.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex border-b border-white/10 px-2">
        {(rubric ? (['rubric', 'notes'] as const) : (['notes'] as const)).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'border-b-2 border-oxfordBlue text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loadingProject ? (
          <div className="flex items-center gap-2 py-8 text-sm text-neutral-300">
            <FiLoader className="animate-spin" aria-hidden />
            Loading project evaluation...
          </div>
        ) : activeTab === 'rubric' ? (
          <div className="space-y-4">
            {criteria.length === 0 ? (
              <p className="text-sm text-neutral-300">This rubric has no criteria yet.</p>
            ) : (
              criteria.map((criterion) => {
                const criterionId = criterion.id || criterion.criterion_name;
                const draft = scoreDrafts[criterion.id || ''] || { score: '', comments: '' };
                const maxScore = criterion.max_score ?? 5;

                return (
                  <div key={criterionId} className="rounded-sm border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{criterion.criterion_name}</p>
                        {criterion.description ? (
                          <p className="mt-1 text-xs text-neutral-400">{criterion.description}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs text-neutral-400">/{maxScore}</span>
                    </div>
                    <label className="mb-2 block text-xs text-neutral-300">
                      Score
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        step="0.5"
                        value={draft.score}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!criterion.id) return;
                          setScoreDrafts((prev) => ({
                            ...prev,
                            [criterion.id as string]: {
                              ...prev[criterion.id as string],
                              score: value,
                            },
                          }));
                        }}
                        className="mt-1 w-full rounded-sm border border-white/15 bg-neutral-950/70 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                      />
                    </label>
                    <label className="block text-xs text-neutral-300">
                      Criterion notes
                      <textarea
                        rows={2}
                        value={draft.comments}
                        onChange={(e) => {
                          if (!criterion.id) return;
                          setScoreDrafts((prev) => ({
                            ...prev,
                            [criterion.id as string]: {
                              ...prev[criterion.id as string],
                              comments: e.target.value,
                            },
                          }));
                        }}
                        className="mt-1 w-full resize-y rounded-sm border border-white/15 bg-neutral-950/70 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                        placeholder="Comments for this criterion"
                      />
                    </label>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <label className="block text-sm text-neutral-200">
            Meeting notes
            <textarea
              rows={12}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full resize-y rounded-sm border border-white/15 bg-neutral-950/70 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              placeholder="Capture questions, feedback, and follow-up items during the defense."
            />
          </label>
        )}
      </div>

      <div className="space-y-3 border-t border-white/10 px-4 py-3">
        {rubric && displayedTotalScore != null ? (
          <div className="rounded-sm border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Weighted total</p>
            <p className="text-lg font-semibold text-white">{displayedTotalScore.toFixed(2)}%</p>
          </div>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="primary"
          leftIcon={<FiSave />}
          className="w-full"
          onClick={handleSave}
          disabled={saving || loadingProject}
        >
          {saving ? 'Saving...' : 'Save Evaluation'}
        </Button>
      </div>
    </div>
  );
}
