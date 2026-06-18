'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { getBranch, type Branch } from '@/lib/api/paperBranches';
import {
  previewMerge,
  commitMerge,
  type MergedParagraph,
  type MergePreviewResult,
} from '@/lib/api/paperMerge';
import {
  FiArrowLeft,
  FiArrowRight,
  FiGitMerge,
  FiGitBranch,
  FiRefreshCw,
  FiCheck,
  FiAlertTriangle,
  FiInfo,
} from 'react-icons/fi';
import { toast } from 'sonner';

type Resolution = 'A' | 'B' | 'custom';

export default function MergeReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, handleLogout } = useDashboardUser('Student');

  const projectId = params.id as string;
  const sourceName = decodeURIComponent(params.source as string);
  const targetName = decodeURIComponent(params.target as string);

  const [preview, setPreview] = useState<MergePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [sourceBranch, setSourceBranch] = useState<Branch | null>(null);
  const [targetBranch, setTargetBranch] = useState<Branch | null>(null);

  const [resolutions, setResolutions] = useState<Record<number, Resolution>>({});
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({});

  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPreviewLoading(true);
      setPreviewError(null);

      const [srcRes, tgtRes, previewRes] = await Promise.all([
        getBranch(projectId, sourceName),
        getBranch(projectId, targetName),
        previewMerge(projectId, sourceName, targetName),
      ]);

      if (cancelled) return;

      setSourceBranch(srcRes.data ?? null);
      setTargetBranch(tgtRes.data ?? null);

      if (previewRes.error) {
        setPreviewError(previewRes.error);
      } else if (previewRes.data) {
        setPreview(previewRes.data);
        setCommitMessage(`Merge branch "${sourceName}" into ${targetName}`);
      }

      setPreviewLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, sourceName, targetName]);

  const conflictIndices: number[] = [];
  if (preview?.paragraphs) {
    preview.paragraphs.forEach((p, idx) => {
      if (p.status === 'conflict') conflictIndices.push(idx);
    });
  }

  const totalConflicts = conflictIndices.length;
  const resolvedCount = conflictIndices.filter((idx) => resolutions[idx] !== undefined).length;
  const allResolved = totalConflicts === 0 || resolvedCount === totalConflicts;

  const buildResolutionsArray = (): Array<'A' | 'B' | string> | null => {
    if (!preview?.paragraphs || totalConflicts === 0) return null;
    return conflictIndices.map((globalIdx) => {
      const choice = resolutions[globalIdx];
      if (choice === 'A' || choice === 'B') return choice;
      return customTexts[globalIdx] ?? '';
    });
  };

  const handleCommit = async () => {
    setConfirmOpen(false);
    setCommitting(true);
    setCommitError(null);

    const resolutionsArr = buildResolutionsArray();
    const res = await commitMerge(projectId, sourceName, targetName, resolutionsArr);

    setCommitting(false);

    if (res.error) {
      setCommitError(res.error);
      return;
    }

    if (res.data?.type === 'conflict') {
      setPreview(res.data as MergePreviewResult);
      setResolutions({});
      setCustomTexts({});
      setCommitError('New conflicts were detected. Please resolve them below.');
      return;
    }

    const message =
      res.data?.type === 'already-merged'
        ? 'Branch is already merged — no changes needed.'
        : `Merged successfully as version ${res.data?.versionNumber}.`;

    toast.success(message);
    router.push(`/student/projects/${projectId}`);
  };

  if (!user) return null;

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/student/projects/${projectId}`)}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to project
          </button>
        </div>

        <Card>
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-lg font-bold text-neutral-900">
              <FiGitMerge className="w-5 h-5 text-primary-600 shrink-0" />
              Merge Branch
            </div>
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <code className="font-mono px-2 py-1 bg-primary-50 border border-primary-200 rounded text-primary-700">
                {sourceName}
              </code>
              <FiArrowRight className="text-neutral-400 w-4 h-4 shrink-0" />
              <code className="font-mono px-2 py-1 bg-neutral-100 border border-neutral-200 rounded text-neutral-700">
                {targetName}
              </code>
            </div>
            {sourceBranch && targetBranch ? (
              <div className="flex flex-wrap gap-4 text-xs text-neutral-500 pt-1">
                <span>
                  Source head:{' '}
                  <span className="font-mono text-neutral-700">
                    v{sourceBranch.head_version_number ?? '—'}
                  </span>
                </span>
                <span>
                  Target head:{' '}
                  <span className="font-mono text-neutral-700">
                    v{targetBranch.head_version_number ?? '—'}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        </Card>

        {previewLoading ? (
          <Card>
            <div className="p-10 flex items-center justify-center gap-3 text-neutral-400">
              <FiRefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Analyzing branches…</span>
            </div>
          </Card>
        ) : previewError ? (
          <Card>
            <div className="p-6 flex items-start gap-3 text-error-700">
              <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Failed to load merge preview</p>
                <p className="text-sm mt-1 text-error-600">{previewError}</p>
              </div>
            </div>
          </Card>
        ) : preview?.type === 'already-merged' ? (
          <AlreadyMergedCard sourceName={sourceName} targetName={targetName} />
        ) : preview?.type === 'fast-forward' ? (
          <FastForwardCard
            sourceName={sourceName}
            targetName={targetName}
            committing={committing}
            onConfirm={() => void handleCommit()}
          />
        ) : preview ? (
          <>
            <MergeStatusCard preview={preview} conflictCount={totalConflicts} resolvedCount={resolvedCount} />

            {preview.paragraphs && preview.paragraphs.length > 0 ? (
              <Card>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900 text-sm">Merged Content Preview</h3>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-success-100 border border-success-300" />
                        From {sourceName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-primary-100 border border-primary-300" />
                        From {targetName}
                      </span>
                      {totalConflicts > 0 ? (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-3 h-3 rounded bg-warning-100 border border-warning-300" />
                          Conflict
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {preview.paragraphs.map((p, idx) => (
                      <ParagraphRow
                        key={idx}
                        paragraph={p}
                        globalIdx={idx}
                        sourceName={sourceName}
                        targetName={targetName}
                        resolution={resolutions[idx]}
                        customText={customTexts[idx] ?? ''}
                        onResolve={(choice) =>
                          setResolutions((prev) => ({ ...prev, [idx]: choice }))
                        }
                        onCustomText={(text) =>
                          setCustomTexts((prev) => ({ ...prev, [idx]: text }))
                        }
                      />
                    ))}
                  </div>
                </div>
              </Card>
            ) : null}

            <Card>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Commit message
                  </label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm font-mono"
                  />
                </div>

                {commitError ? (
                  <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{commitError}</p>
                ) : null}

                {totalConflicts > 0 && !allResolved ? (
                  <p className="text-sm text-warning-700 bg-warning-50 border border-warning-200 px-3 py-2 rounded-lg">
                    Resolve all {totalConflicts - resolvedCount} remaining conflict
                    {totalConflicts - resolvedCount !== 1 ? 's' : ''} before merging.
                  </p>
                ) : null}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/student/projects/${projectId}`)}
                    disabled={committing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setConfirmOpen(true)}
                    disabled={committing || !allResolved}
                    loading={committing}
                  >
                    <FiGitMerge className="w-3.5 h-3.5 mr-1.5" />
                    {totalConflicts > 0 ? 'Complete Merge' : 'Confirm Merge'}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : null}
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm merge"
        size="sm"
      >
        <p className="text-sm text-neutral-600">
          This will create a new merge commit on{' '}
          <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">{targetName}</code>{' '}
          combining changes from{' '}
          <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">{sourceName}</code>.
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void handleCommit()} loading={committing}>
            <FiGitMerge className="w-3.5 h-3.5 mr-1.5" />
            Merge
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}

function AlreadyMergedCard({ sourceName, targetName }: { sourceName: string; targetName: string }) {
  return (
    <Card>
      <div className="p-6 flex items-start gap-3 text-success-700">
        <FiCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Already merged</p>
          <p className="text-sm mt-1 text-neutral-600">
            <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">{sourceName}</code>{' '}
            is already fully merged into{' '}
            <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">{targetName}</code>.
            No action needed.
          </p>
        </div>
      </div>
    </Card>
  );
}

function FastForwardCard({
  sourceName,
  targetName,
  committing,
  onConfirm,
}: {
  sourceName: string;
  targetName: string;
  committing: boolean;
  onConfirm: () => void;
}) {
  return (
    <Card>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 text-primary-700">
          <FiInfo className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Fast-forward merge</p>
            <p className="text-sm mt-1 text-neutral-600">
              <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">{targetName}</code>{' '}
              is directly behind{' '}
              <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">{sourceName}</code>.
              No conflicts — this will advance the target branch head.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onConfirm} loading={committing} disabled={committing}>
            <FiGitMerge className="w-3.5 h-3.5 mr-1.5" />
            Confirm Merge
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MergeStatusCard({
  preview,
  conflictCount,
  resolvedCount,
}: {
  preview: MergePreviewResult;
  conflictCount: number;
  resolvedCount: number;
}) {
  const hasChanges = preview.paragraphs?.some((p) => p.status !== 'unchanged') ?? false;

  if (conflictCount > 0) {
    return (
      <Card>
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="w-4 h-4 text-warning-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900">
              {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} found
            </p>
            <p className="text-xs text-neutral-500">
              {resolvedCount} of {conflictCount} resolved — choose which version to keep for each conflict below.
            </p>
          </div>
          <Badge variant="warning" size="sm">
            {resolvedCount}/{conflictCount}
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center shrink-0">
          <FiCheck className="w-4 h-4 text-success-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {hasChanges ? 'Clean merge — no conflicts' : 'No changes to merge'}
          </p>
          <p className="text-xs text-neutral-500">
            {hasChanges
              ? 'All changed paragraphs come from different parts of the document.'
              : 'The branches have identical content.'}
          </p>
        </div>
        <Badge variant="success" size="sm">Clean</Badge>
      </div>
    </Card>
  );
}

function ParagraphRow({
  paragraph,
  globalIdx,
  sourceName,
  targetName,
  resolution,
  customText,
  onResolve,
  onCustomText,
}: {
  paragraph: MergedParagraph;
  globalIdx: number;
  sourceName: string;
  targetName: string;
  resolution: Resolution | undefined;
  customText: string;
  onResolve: (choice: Resolution) => void;
  onCustomText: (text: string) => void;
}) {
  if (paragraph.status === 'unchanged') {
    return (
      <div className="px-3 py-2 rounded-lg text-sm text-neutral-500 bg-neutral-50 border border-neutral-100 whitespace-pre-wrap font-serif leading-relaxed">
        {paragraph.content}
      </div>
    );
  }

  if (paragraph.status === 'fromB') {
    return (
      <div className="rounded-lg border border-success-200 bg-success-50 overflow-hidden">
        <div className="px-3 py-1 bg-success-100 border-b border-success-200 flex items-center gap-1.5">
          <FiGitBranch className="w-3 h-3 text-success-700" />
          <span className="text-xs font-medium text-success-800">From {sourceName}</span>
        </div>
        <div className="px-3 py-2 text-sm text-success-900 whitespace-pre-wrap font-serif leading-relaxed">
          {paragraph.content}
        </div>
      </div>
    );
  }

  if (paragraph.status === 'fromA') {
    return (
      <div className="rounded-lg border border-primary-200 bg-primary-50 overflow-hidden">
        <div className="px-3 py-1 bg-primary-100 border-b border-primary-200 flex items-center gap-1.5">
          <FiGitBranch className="w-3 h-3 text-primary-700" />
          <span className="text-xs font-medium text-primary-800">From {targetName}</span>
        </div>
        <div className="px-3 py-2 text-sm text-primary-900 whitespace-pre-wrap font-serif leading-relaxed">
          {paragraph.content}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warning-300 bg-warning-50/50 overflow-hidden">
      <div className="px-4 py-2 bg-warning-100 border-b border-warning-200 flex items-center gap-2">
        <FiAlertTriangle className="w-3.5 h-3.5 text-warning-700 shrink-0" />
        <span className="text-xs font-semibold text-warning-900">Conflict — paragraph {globalIdx + 1}</span>
        {resolution ? (
          <Badge variant="success" size="sm">Resolved</Badge>
        ) : (
          <Badge variant="warning" size="sm">Needs resolution</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-warning-200">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-primary-700 flex items-center gap-1">
              <FiGitBranch className="w-3 h-3" />
              {targetName} version
            </span>
            <button
              onClick={() => onResolve('A')}
              className={`text-xs px-2 py-1 rounded-md border font-medium transition-colors ${
                resolution === 'A'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-primary-300 text-primary-700 hover:bg-primary-50'
              }`}
            >
              {resolution === 'A' ? '✓ Using this' : 'Use this'}
            </button>
          </div>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap font-serif leading-relaxed bg-white rounded p-2 border border-neutral-200">
            {paragraph.conflictA}
          </p>
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-success-700 flex items-center gap-1">
              <FiGitBranch className="w-3 h-3" />
              {sourceName} version
            </span>
            <button
              onClick={() => onResolve('B')}
              className={`text-xs px-2 py-1 rounded-md border font-medium transition-colors ${
                resolution === 'B'
                  ? 'bg-success-600 text-white border-success-600'
                  : 'border-success-300 text-success-700 hover:bg-success-50'
              }`}
            >
              {resolution === 'B' ? '✓ Using this' : 'Use this'}
            </button>
          </div>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap font-serif leading-relaxed bg-white rounded p-2 border border-neutral-200">
            {paragraph.conflictB}
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-warning-200 space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onResolve('custom')}
            className={`text-xs px-2 py-1 rounded-md border font-medium transition-colors ${
              resolution === 'custom'
                ? 'bg-neutral-700 text-white border-neutral-700'
                : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Write custom text
          </button>
        </div>
        {resolution === 'custom' ? (
          <textarea
            value={customText}
            onChange={(e) => onCustomText(e.target.value)}
            placeholder="Type your custom paragraph text here…"
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none font-serif"
            autoFocus
          />
        ) : null}
      </div>
    </div>
  );
}
