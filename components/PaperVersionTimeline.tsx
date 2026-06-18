'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FiUploadCloud,
  FiDownload,
  FiFileText,
  FiClock,
  FiTag,
  FiRefreshCw,
  FiGitCommit,
  FiZap,
  FiChevronDown,
  FiPlus,
  FiMinus,
  FiSend,
  FiCheckCircle,
  FiMessageSquare,
  FiGitBranch,
  FiGitMerge,
  FiArrowRight,
} from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listBranches, createBranch, type Branch } from '@/lib/api/paperBranches';
import { renderDocxPreview, isDocxFileName, observeDocxPreviewResize, scaleDocxPreviewToFit, HTML_PREVIEW_MOBILE_CLASS, DOCX_PREVIEW_SCROLL_CLASS } from '@/lib/manuscript/docxPreview';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import {
  uploadPaperVersion,
  generatePaperTemplate,
  getPaperVersionDownloadUrl,
  getPaperVersionDiff,
  type PaperVersion,
  type DiffResult,
} from '@/lib/api/paperVersions';
import {
  requestPaperReview,
  withdrawPaperReviewRequest,
  completePaperReviewRequest,
  type PaperReviewRequest,
} from '@/lib/api/paperReviews';
import {
  getPaperCommentSummary,
  type PaperCommentSummary,
} from '@/lib/api/paperComments';
import { formatPaperStandard } from '@/lib/utils/projectDisplay';
import { toast } from 'sonner';
import PaperVersionTimelineSkeleton from '@/components/skeletons/PaperVersionTimelineSkeleton';
import ShimmerLine from '@/components/skeletons/ShimmerLine';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortHash(id: string): string {
  return id.replace(/-/g, '').slice(0, 7);
}

function RenderedDiffView({
  diff,
  mode,
  className,
  projectId,
  versionId,
  fileName,
  isMergeCommit = false,
}: {
  diff: DiffResult;
  mode: 'current' | 'previous';
  className?: string;
  projectId: string;
  versionId: string;
  fileName?: string;
  isMergeCommit?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);

  const isDocxFile = isDocxFileName(fileName) && !isMergeCommit;

  const rescaleDocx = useCallback(() => {
    if (!viewportRef.current || !scrollRef.current) return;
    scaleDocxPreviewToFit(viewportRef.current, scrollRef.current);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isDocxFile) {
      let cancelled = false;

      const renderDocx = async () => {
        setDocxLoading(true);
        resizeCleanupRef.current?.();
        resizeCleanupRef.current = null;
        try {
          const viewport = await renderDocxPreview(container, projectId, versionId);
          if (cancelled) return;
          viewportRef.current = viewport;
          if (scrollRef.current) {
            resizeCleanupRef.current = observeDocxPreviewResize(scrollRef.current, rescaleDocx);
          }
          rescaleDocx();
        } catch {
          if (!cancelled) {
            container.innerHTML =
              '<div class="text-sm text-error-600 bg-error-50 p-3 rounded">Failed to render document</div>';
          }
        } finally {
          if (!cancelled) setDocxLoading(false);
        }
      };

      void renderDocx();
      return () => {
        cancelled = true;
        resizeCleanupRef.current?.();
        resizeCleanupRef.current = null;
      };
    }

    setDocxLoading(false);
    viewportRef.current = null;
    resizeCleanupRef.current?.();
    resizeCleanupRef.current = null;

    const html = mode === 'current' ? diff.currentHtml : diff.previousHtml;
    if (!html) {
      container.innerHTML =
        '<div class="text-sm text-neutral-500 italic">Rendered view not available for this file type.</div>';
      return;
    }

    container.innerHTML = html;

    if (!diff.changes || diff.changes.length === 0) return;

    const parts = diff.changes;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes: { node: Text; start: number; end: number }[] = [];
    let cur: Node | null = walker.nextNode();
    let idx = 0;
    while (cur) {
      const txt = cur.nodeValue || '';
      const len = txt.length;
      if (len > 0) {
        nodes.push({ node: cur as Text, start: idx, end: idx + len });
        idx += len;
      }
      cur = walker.nextNode();
    }

    const fullText = nodes.map((n) => n.node.nodeValue || '').join('');
    if (!fullText || fullText.length === 0) return;

    const ranges: { start: number; end: number; type: 'added' | 'removed' }[] = [];
    let pointer = 0;
    for (const part of parts) {
      if (mode === 'current' && part.removed) continue;
      if (mode === 'previous' && part.added) continue;
      const val = part.value || '';
      if (!val) continue;
      const startIndex = fullText.indexOf(val, pointer);
      if (startIndex === -1) {
        const alt = fullText.indexOf(val);
        if (alt === -1) continue;
        pointer = alt + val.length;
        ranges.push({ start: alt, end: alt + val.length, type: part.added ? 'added' : part.removed ? 'removed' : 'added' });
      } else {
        ranges.push({ start: startIndex, end: startIndex + val.length, type: part.added ? 'added' : part.removed ? 'removed' : 'added' });
        pointer = startIndex + val.length;
      }
    }

    if (ranges.length === 0) return;

    ranges.sort((a, b) => b.start - a.start);
    for (const r of ranges) {
      let startNodeIndex = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (r.start >= nodes[i].start && r.start < nodes[i].end) {
          startNodeIndex = i;
          break;
        }
      }
      if (startNodeIndex === -1) continue;

      let endNodeIndex = startNodeIndex;
      while (endNodeIndex < nodes.length && r.end > nodes[endNodeIndex].end) endNodeIndex++;
      if (endNodeIndex >= nodes.length) continue;

      const startNode = nodes[startNodeIndex].node;
      const endNode = nodes[endNodeIndex].node;
      const startOffset = r.start - nodes[startNodeIndex].start;
      const endOffset = r.end - nodes[endNodeIndex].start;

      const range = document.createRange();
      try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        const wrapper = document.createElement('span');
        if (r.type === 'added') {
          wrapper.className = 'bg-success-100 text-success-800 decoration-success-400';
        } else {
          wrapper.className = 'bg-error-100 text-error-800 line-through decoration-error-400';
        }
        range.surroundContents(wrapper);
      } catch {
        // surroundContents may throw for malformed ranges; ignore and continue
      }
    }
  }, [diff, mode, isDocxFile, projectId, versionId, rescaleDocx]);

  return (
    <div
      className={`relative min-h-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50/40 ${className ?? 'max-h-96'}`}
    >
      {docxLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/80 text-sm text-neutral-400">
          <FiRefreshCw className="w-4 h-4 animate-spin" />
          Rendering document…
        </div>
      ) : null}
      <div
        ref={scrollRef}
        className={`h-full min-h-0 ${DOCX_PREVIEW_SCROLL_CLASS} ${docxLoading ? 'invisible' : ''}`}
      >
        <div ref={containerRef} className={`w-full min-w-0 ${HTML_PREVIEW_MOBILE_CLASS}`} />
      </div>
    </div>
  );
}

function VersionCard({
  version,
  isLatest,
  isFirst,
  isLatestRealUpload,
  projectId,
  isOpen,
  onToggle,
  activeReviewRequest,
  canRequestReview,
  canCompleteReview,
  reviewRequestsDisabled,
  onReviewChange,
  commentCounts,
  getManuscriptReviewUrl,
  manuscriptLinkLabel = 'Review & comment',
  isHeadCommit = false,
  onMerge,
}: {
  version: PaperVersion;
  isLatest: boolean;
  isFirst: boolean;
  isLatestRealUpload: boolean;
  projectId: string;
  isOpen: boolean;
  onToggle: () => void;
  activeReviewRequest?: PaperReviewRequest | null;
  canRequestReview?: boolean;
  canCompleteReview?: boolean;
  reviewRequestsDisabled?: boolean;
  onReviewChange?: () => void;
  commentCounts?: { open: number; needs_revision: number };
  getManuscriptReviewUrl?: (versionId: string) => string;
  manuscriptLinkLabel?: string;
  isHeadCommit?: boolean;
  onMerge?: (e: React.MouseEvent) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [renderSide, setRenderSide] = useState<'current' | 'previous'>('current');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [completeConflict, setCompleteConflict] = useState<{
    open: number;
    needs_revision: number;
    resolved: number;
  } | null>(null);
  const hasFetchedRef = useRef(false);

  const isReviewTarget = activeReviewRequest?.paper_version_id === version.id;
  const hasPendingReview = Boolean(activeReviewRequest);
  const showStudentReviewActions =
    canRequestReview && isLatestRealUpload && version.is_generated === 0 && !reviewRequestsDisabled;
  const showRequestButton = showStudentReviewActions && (!hasPendingReview || !isReviewTarget);
  const showWithdrawButton = showStudentReviewActions && hasPendingReview && isReviewTarget;
  const showAdviserComplete = canCompleteReview && hasPendingReview && isReviewTarget;

  useEffect(() => {
    if (!isOpen || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setDiffLoading(true);
    setDiffError(null);
    getPaperVersionDiff(projectId, version.id).then((res) => {
      if (res.error) {
        setDiffError(res.error);
      } else if (res.data) {
        setDiff(res.data);
      }
      setDiffLoading(false);
    });
  }, [isOpen, projectId, version.id]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const tokenMatch = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
      const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

      const url = getPaperVersionDownloadUrl(projectId, version.id);
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = version.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      /* user can retry */
    } finally {
      setDownloading(false);
    }
  };

  const openWithdrawModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWithdrawModalOpen(true);
  };

  const handleWithdrawReview = async () => {
    setReviewActionLoading(true);
    const res = await withdrawPaperReviewRequest(projectId);
    setReviewActionLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setWithdrawModalOpen(false);
    toast.success('Review request withdrawn');
    onReviewChange?.();
  };

  const handleCompleteReview = async (e: React.MouseEvent, force = false) => {
    e.stopPropagation();
    setReviewActionLoading(true);
    const res = await completePaperReviewRequest(projectId, force);
    setReviewActionLoading(false);
    if (res.status === 409 && res.data && 'requiresConfirmation' in res.data && res.data.requiresConfirmation) {
      setCompleteConflict(res.data.commentCounts || { open: 0, needs_revision: 0, resolved: 0 });
      setCompleteConfirmOpen(true);
      return;
    }
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setCompleteConfirmOpen(false);
    setCompleteConflict(null);
    toast.success('Marked as reviewed');
    onReviewChange?.();
  };

  const versionCommentCounts = commentCounts || { open: 0, needs_revision: 0 };
  const manuscriptUrl = getManuscriptReviewUrl?.(version.id);

  return (
    <div className="flex min-w-0 gap-3 sm:gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
            isLatest
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-200 text-neutral-500'
          }`}
        >
          <FiGitCommit className="w-4 h-4" />
        </div>
        <div className="w-px flex-1 bg-neutral-200 mt-1" />
      </div>

      <div className="min-w-0 flex-1 mb-4">
        <div
          onClick={onToggle}
          className={`min-w-0 overflow-hidden rounded-xl border p-4 transition-all cursor-pointer hover:shadow-sm ${
            isReviewTarget
              ? 'border-warning-300 bg-warning-50/50 ring-1 ring-warning-200'
              : isLatest
              ? 'border-primary-200 bg-primary-50/40'
              : 'border-neutral-200 bg-white'
          } ${isOpen ? 'ring-1 ring-primary-200 shadow-sm' : ''}`}
        >
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-neutral-900 break-words">
                {version.commit_message.length > 80
                  ? version.commit_message.slice(0, 80) + '…'
                  : version.commit_message}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {isLatest ? <Badge variant="primary" size="sm">latest</Badge> : null}
                {isReviewTarget ? (
                  <Badge variant="warning" size="sm">review requested</Badge>
                ) : null}
                {version.is_generated === 1 ? (
                  <Badge variant="default" size="sm">
                    <FiZap className="inline w-3 h-3 mr-1" />
                    generated
                  </Badge>
                ) : null}
                {version.tag && version.tag !== 'template' ? (
                  <Badge variant="success" size="sm">
                    <FiTag className="inline w-3 h-3 mr-1" />
                    {version.tag}
                  </Badge>
                ) : null}
                {versionCommentCounts.open > 0 ? (
                  <Badge variant="warning" size="sm">
                    {versionCommentCounts.open} open comment{versionCommentCounts.open !== 1 ? 's' : ''}
                  </Badge>
                ) : null}
                {versionCommentCounts.needs_revision > 0 ? (
                  <Badge variant="warning" size="sm">
                    {versionCommentCounts.needs_revision} need revision
                  </Badge>
                ) : null}
                <code className="font-mono rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                  {shortHash(version.id)}
                </code>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 sm:text-sm">
                <span className="font-mono font-medium text-neutral-600">v{version.version_number}</span>
                <span className="flex items-center gap-1">
                  <Avatar
                    src={version.uploader_avatar ?? undefined}
                    name={version.uploader_name}
                    size="xs"
                  />
                  {version.uploader_name}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3 shrink-0" />
                  {formatDate(version.created_at)}
                </span>
                <span>{formatBytes(version.file_size)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:max-w-[17rem] sm:flex-shrink-0 sm:justify-end lg:max-w-none">
              {manuscriptUrl ? (
                <Link
                  href={manuscriptUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
                >
                  <FiMessageSquare className="w-3.5 h-3.5" />
                  {manuscriptLinkLabel}
                </Link>
              ) : null}
              {showRequestButton ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRequestModalOpen(true);
                  }}
                  disabled={reviewActionLoading}
                >
                  <FiSend className="w-3.5 h-3.5 mr-1" />
                  Request Review
                </Button>
              ) : null}
              {showWithdrawButton ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openWithdrawModal}
                  disabled={reviewActionLoading}
                >
                  Withdraw
                </Button>
              ) : null}
              {showAdviserComplete ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => handleCompleteReview(e, false)}
                  disabled={reviewActionLoading}
                  loading={reviewActionLoading}
                >
                  <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                  Mark reviewed
                </Button>
              ) : null}
              {isHeadCommit && onMerge ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMerge(e); }}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
                  title="Merge this branch into another branch"
                >
                  <FiGitMerge className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Merge…</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                title={`Download ${version.file_name}`}
              >
                {downloading ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiDownload className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="inline-flex items-center justify-center p-1 text-neutral-400 transition-colors hover:text-neutral-600"
                aria-label={isOpen ? 'Collapse version details' : 'Expand version details'}
              >
                <FiChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {isOpen && (
            <div
              className="mt-4 pt-4 border-t border-neutral-200"
              onClick={(e) => e.stopPropagation()}
            >
              {diffLoading && (
                <div className="flex items-center gap-2 text-sm text-neutral-400 py-6 justify-center">
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  Loading preview…
                </div>
              )}

              {diffError && (
                <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">
                  {diffError}
                </p>
              )}

              {diff && !diff.supported && (
                <p className="text-sm text-neutral-500 italic py-2">
                  {diff.message || 'Preview not available for this file type.'}
                </p>
              )}

              {diff && diff.supported && (
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <span className="text-sm font-medium text-neutral-700 shrink-0">Document Preview</span>
                      {!isFirst && diff.stats && (
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 text-success-700 font-medium">
                            <FiPlus className="w-3.5 h-3.5" />
                            +{diff.stats.addedWords}
                          </span>
                          <span className="flex items-center gap-1 text-error-700 font-medium">
                            <FiMinus className="w-3.5 h-3.5" />
                            −{diff.stats.removedWords}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {diff.stats.previousWords} → {diff.stats.currentWords} words
                          </span>
                        </div>
                      )}
                    </div>

                    {!isFirst && diff.previousHtml && (
                      <div className="inline-flex shrink-0 rounded-md bg-neutral-100 p-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenderSide('current'); }}
                          className={`px-3 py-1 text-xs rounded transition-colors ${renderSide === 'current' ? 'bg-white shadow-sm font-medium text-neutral-800' : 'text-neutral-600 hover:text-neutral-800'}`}
                        >
                          Current
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenderSide('previous'); }}
                          className={`px-3 py-1 text-xs rounded transition-colors ${renderSide === 'previous' ? 'bg-white shadow-sm font-medium text-neutral-800' : 'text-neutral-600 hover:text-neutral-800'}`}
                        >
                          Previous
                        </button>
                      </div>
                    )}
                  </div>

                  {!isFirst && diff.changes && diff.changes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-success-100 border border-success-300" />
                        Added text
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-error-100 border border-error-300" />
                        Removed text
                      </span>
                    </div>
                  )}

                  <RenderedDiffView
                    diff={isFirst ? { ...diff, changes: [] } : diff}
                    mode={isFirst ? 'current' : renderSide}
                    className="h-[min(480px,65vh)]"
                    projectId={projectId}
                    versionId={version.id}
                    fileName={version.file_name}
                    isMergeCommit={version.tag === 'merge'}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RequestReviewModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        projectId={projectId}
        versionId={version.id}
        onSuccess={() => {
          setRequestModalOpen(false);
          onReviewChange?.();
        }}
      />

      <WithdrawReviewModal
        isOpen={withdrawModalOpen}
        onClose={() => {
          if (reviewActionLoading) return;
          setWithdrawModalOpen(false);
        }}
        onConfirm={handleWithdrawReview}
        loading={reviewActionLoading}
        versionNumber={version.version_number}
      />

      <Modal
        isOpen={completeConfirmOpen}
        onClose={() => {
          if (reviewActionLoading) return;
          setCompleteConfirmOpen(false);
        }}
        title="Unresolved comments"
      >
        <p className="text-sm text-neutral-700">
          This version still has {completeConflict?.open ?? 0} open and{' '}
          {completeConflict?.needs_revision ?? 0} revision-requested comments. Mark the review
          complete anyway?
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setCompleteConfirmOpen(false)}
            disabled={reviewActionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={reviewActionLoading}
            onClick={(e) => {
              e.preventDefault();
              void handleCompleteReview(e as unknown as React.MouseEvent, true);
            }}
          >
            Complete anyway
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function WithdrawReviewModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  versionNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  versionNumber: number;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw review request?"
      size="sm"
      closeOnOverlayClick={!loading}
    >
      <p className="text-sm text-neutral-600">
        This will cancel the pending review request for version {versionNumber}. Your adviser will
        no longer see it in their pending reviews.
      </p>
      <ModalFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Keep request
        </Button>
        <Button
          variant="error"
          size="sm"
          onClick={() => void onConfirm()}
          loading={loading}
          disabled={loading}
        >
          Withdraw request
        </Button>
      </ModalFooter>
    </Modal>
  );
}

const REVIEW_FOCUS_NOTE_MIN_LENGTH = 20;

function RequestReviewModal({
  isOpen,
  onClose,
  projectId,
  versionId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  versionId: string;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedNote = note.trim();
  const noteTooShort = trimmedNote.length > 0 && trimmedNote.length < REVIEW_FOCUS_NOTE_MIN_LENGTH;

  const handleClose = () => {
    if (submitting) return;
    setNote('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (trimmedNote.length < REVIEW_FOCUS_NOTE_MIN_LENGTH) {
      setError(`Please add a focus note of at least ${REVIEW_FOCUS_NOTE_MIN_LENGTH} characters so your adviser knows what to review.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await requestPaperReview(projectId, versionId, trimmedNote);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    toast.success('Review request sent to your adviser');
    setNote('');
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request adviser review" size="md">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Your adviser and co-advisers will be notified to review this version.
        </p>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Focus note <span className="text-error-600 font-normal">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Please review the methodology section and whether I addressed your comments on Chapter 3."
            rows={3}
            maxLength={500}
            required
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-neutral-400 text-sm resize-none"
          />
          <p className={`mt-1.5 text-xs ${noteTooShort ? 'text-error-600' : 'text-neutral-500'}`}>
            {noteTooShort
              ? `${REVIEW_FOCUS_NOTE_MIN_LENGTH - trimmedNote.length} more character${REVIEW_FOCUS_NOTE_MIN_LENGTH - trimmedNote.length === 1 ? '' : 's'} needed`
              : `Briefly describe what you want feedback on (at least ${REVIEW_FOCUS_NOTE_MIN_LENGTH} characters).`}
          </p>
        </div>
        {error ? (
          <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{error}</p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || trimmedNote.length < REVIEW_FOCUS_NOTE_MIN_LENGTH}
            loading={submitting}
          >
            Send request
          </Button>
        </div>
      </div>
    </Modal>
  );
}


//Upload modal
function UploadVersionModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  branchName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  branchName: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setCommitMessage('');
    setError(null);
    setSubmitting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['docx', 'doc'].includes(ext || '')) {
      setError('Only .docx or .doc files are allowed.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10 MB.');
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped || null);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file.'); return; }
    if (!commitMessage.trim()) { setError('Please enter a description of your changes.'); return; }

    setSubmitting(true);
    setError(null);

    const res = await uploadPaperVersion(projectId, file, commitMessage.trim(), branchName);
    if (res.error) {
      setError(res.error);
      setSubmitting(false);
      return;
    }

    reset();
    onClose();
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload New Version" size="md">
      <div className="p-6 space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : file
              ? 'border-success-400 bg-success-50'
              : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".docx,.doc"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FiFileText className="w-8 h-8 text-success-600" />
              <p className="font-medium text-success-700">{file.name}</p>
              <p className="text-sm text-neutral-500">{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FiUploadCloud className="w-8 h-8 text-neutral-400" />
              <p className="text-neutral-600 font-medium">
                Drop your paper here, or click to browse
              </p>
              <p className="text-sm text-neutral-400">.docx, .doc — max 10 MB</p>
            </div>
          )}
        </div>

        {/* Commit message */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            What changed in this version? <span className="text-error-500">*</span>
          </label>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="e.g. Added methodology section, revised introduction, corrected citations..."
            rows={3}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-neutral-400 text-sm resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || !file}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <FiRefreshCw className="animate-spin w-4 h-4" /> Uploading…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FiUploadCloud className="w-4 h-4" /> Upload Version
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function NewBranchModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  fromVersionId,
  fromBranchName,
  fromVersionNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBranch: Branch) => void;
  projectId: string;
  fromVersionId: string;
  fromBranchName: string;
  fromVersionNumber: number;
}) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    setName('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Branch name is required.'); return; }
    if (!/^[a-zA-Z0-9/_-]+$/.test(trimmed)) {
      setError('Use letters, numbers, hyphens, underscores, or forward slashes only.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createBranch(projectId, trimmed, fromVersionId);
    setSubmitting(false);
    if (res.error) { setError(res.error); return; }
    if (res.data) {
      toast.success(`Branch "${trimmed}" created`);
      setName('');
      onSuccess(res.data);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Branch" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Branching from{' '}
          <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{fromBranchName}</code>{' '}
          at{' '}
          <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">v{fromVersionNumber}</code>.
        </p>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Branch name <span className="text-error-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
            placeholder="e.g. feature/introduction-revision"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-neutral-400 text-sm font-mono"
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
            autoFocus
          />
          <p className="mt-1 text-xs text-neutral-500">
            Letters, numbers, hyphens, underscores, forward slashes.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{error}</p>
        ) : null}
        <ModalFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting || !name.trim()}
          >
            Create Branch
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function MergePickerModal({
  isOpen,
  onClose,
  projectId,
  sourceBranch,
  branches,
  router,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  sourceBranch: Branch;
  branches: Branch[];
  router: ReturnType<typeof useRouter>;
}) {
  const otherBranches = branches.filter((b) => b.id !== sourceBranch.id);
  const [targetName, setTargetName] = useState('');

  useEffect(() => {
    if (isOpen && otherBranches.length > 0) {
      const main = otherBranches.find((b) => b.name === 'main');
      setTargetName(main?.name ?? otherBranches[0].name);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreview = () => {
    if (!targetName) return;
    router.push(
      `/student/projects/${projectId}/merge/${encodeURIComponent(sourceBranch.name)}/${encodeURIComponent(targetName)}`
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Merge Branch" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <code className="font-mono px-2 py-1 bg-primary-50 border border-primary-200 rounded text-primary-700 text-xs">
            {sourceBranch.name}
          </code>
          <FiArrowRight className="text-neutral-400 shrink-0 w-4 h-4" />
          <span className="text-neutral-600 text-xs">into</span>
        </div>
        {otherBranches.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">No other branches to merge into. Create another branch first.</p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Target branch
            </label>
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {otherBranches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePreview}
            disabled={!targetName || otherBranches.length === 0}
          >
            <FiGitMerge className="w-3.5 h-3.5 mr-1.5" />
            Preview &amp; Merge
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

//Main component
export interface PaperVersionTimelineProps {
  projectId: string;
  paperStandard: string;
  versions: PaperVersion[];
  loading: boolean;
  onRefresh: () => void;
  /** When false, hides upload/generate actions (e.g. adviser read-only view). */
  allowUpload?: boolean;
  activeReviewRequest?: PaperReviewRequest | null;
  canRequestReview?: boolean;
  canCompleteReview?: boolean;
  reviewRequestsDisabled?: boolean;
  onReviewChange?: () => void;
  getManuscriptReviewUrl?: (versionId: string) => string;
  manuscriptLinkLabel?: string;
}

export default function PaperVersionTimeline({
  projectId,
  paperStandard,
  versions,
  loading,
  onRefresh,
  allowUpload = true,
  activeReviewRequest = null,
  canRequestReview = false,
  canCompleteReview = false,
  reviewRequestsDisabled = false,
  onReviewChange,
  getManuscriptReviewUrl,
  manuscriptLinkLabel,
}: PaperVersionTimelineProps) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [openVersionId, setOpenVersionId] = useState<string | null>(null);
  const [commentSummary, setCommentSummary] = useState<PaperCommentSummary | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [mergePickerOpen, setMergePickerOpen] = useState(false);

  const loadBranches = useCallback(async () => {
    const res = await listBranches(projectId);
    if (res.data) {
      setBranches(res.data);
      setActiveBranchId((prev) => {
        if (prev) return prev;
        const main = res.data!.find((b) => b.name === 'main');
        return main?.id ?? res.data![0]?.id ?? null;
      });
    }
  }, [projectId]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    getPaperCommentSummary(projectId).then((res) => {
      if (res.data) setCommentSummary(res.data);
    });
  }, [projectId, versions.length]);

  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? null;
  const filteredVersions = activeBranchId
    ? versions.filter((v) => v.branch_id === activeBranchId)
    : versions;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    const res = await generatePaperTemplate(projectId);
    if (res.error) {
      setGenError(res.error);
    } else {
      onRefresh();
    }
    setGenerating(false);
  };

  const latestRealUploadId = filteredVersions.find((v) => v.is_generated === 0)?.id ?? null;

  const handleReviewChange = () => {
    onReviewChange?.();
    onRefresh();
    getPaperCommentSummary(projectId).then((res) => {
      if (res.data) setCommentSummary(res.data);
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <FiGitCommit className="text-primary-600" />
            Paper Version History
          </h2>
          <div className="text-sm text-neutral-500 mt-0.5">
            {loading ? (
              <ShimmerLine className="inline-block h-4 w-56 max-w-full align-middle" />
            ) : versions.length === 0
              ? allowUpload
                ? 'No versions yet — upload your draft or generate a template to get started.'
                : 'No versions uploaded yet.'
              : `${filteredVersions.length} version${filteredVersions.length !== 1 ? 's' : ''} · ${formatPaperStandard(paperStandard)} format`}
          </div>
        </div>

        {allowUpload && !loading ? (
          <div className="flex gap-2 flex-wrap">
            {versions.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <span className="flex items-center gap-1.5">
                    <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> Generating…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden />
                    Generate {formatPaperStandard(paperStandard)} Template
                  </span>
                )}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
              <FiUploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Upload New Version
            </Button>
            {activeBranch?.head_version_id ? (
              <Button variant="outline" size="sm" onClick={() => setNewBranchOpen(true)}>
                <FiGitBranch className="w-3.5 h-3.5 mr-1" />
                New Branch
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {genError && (
        <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg mb-4">{genError}</p>
      )}

      {!loading && branches.length > 1 ? (
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <FiGitBranch className="w-4 h-4" />
          </div>
          <div className="inline-flex rounded-md bg-neutral-100 p-1 gap-0.5 flex-wrap">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBranchId(b.id)}
                className={`px-3 py-1 text-xs rounded transition-colors font-mono ${
                  activeBranchId === b.id
                    ? 'bg-white shadow-sm font-medium text-neutral-800'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeReviewRequest && canRequestReview ? (
        <div className="mb-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
          Waiting for adviser review on{' '}
          <span className="font-semibold">version {activeReviewRequest.version_number}</span>
          {activeReviewRequest.note ? (
            <span className="block mt-1 text-warning-800">{activeReviewRequest.note}</span>
          ) : null}
        </div>
      ) : null}

      {activeReviewRequest && canCompleteReview ? (
        <div className="mb-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
          <span className="font-semibold">{activeReviewRequest.requester_name}</span> requested
          review on version {activeReviewRequest.version_number}.
          {activeReviewRequest.note ? (
            <span className="block mt-1 text-warning-800">{activeReviewRequest.note}</span>
          ) : null}
        </div>
      ) : null}

      {/* Timeline */}
      {loading ? (
        <PaperVersionTimelineSkeleton />
      ) : filteredVersions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-neutral-400">
          <FiFileText className="w-10 h-10" />
          <p className="text-sm">
            {versions.length > 0 ? 'No versions on this branch yet.' : 'No paper versions yet.'}
          </p>
        </div>
      ) : (
        <div>
          {filteredVersions.map((v, idx) => (
            <VersionCard
              key={v.id}
              version={v}
              isLatest={idx === 0}
              isFirst={idx === filteredVersions.length - 1}
              isLatestRealUpload={v.id === latestRealUploadId}
              projectId={projectId}
              isOpen={openVersionId === v.id}
              onToggle={() => setOpenVersionId((prev) => (prev === v.id ? null : v.id))}
              activeReviewRequest={activeReviewRequest}
              canRequestReview={canRequestReview}
              canCompleteReview={canCompleteReview}
              reviewRequestsDisabled={reviewRequestsDisabled}
              onReviewChange={handleReviewChange}
              commentCounts={commentSummary?.by_version?.[v.id]}
              getManuscriptReviewUrl={getManuscriptReviewUrl}
              manuscriptLinkLabel={manuscriptLinkLabel}
              isHeadCommit={v.id === activeBranch?.head_version_id && branches.length > 1}
              onMerge={
                v.id === activeBranch?.head_version_id && branches.length > 1 && activeBranch
                  ? () => setMergePickerOpen(true)
                  : undefined
              }
            />
          ))}
          {/* End of timeline dot */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-neutral-300 ml-2.5" />
            </div>
            <p className="text-xs text-neutral-400 mb-2 mt-0.5">Initial commit</p>
          </div>
        </div>
      )}

      {allowUpload ? (
        <UploadVersionModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSuccess={onRefresh}
          projectId={projectId}
          branchName={activeBranch?.name ?? 'main'}
        />
      ) : null}

      {activeBranch?.head_version_id ? (
        <NewBranchModal
          isOpen={newBranchOpen}
          onClose={() => setNewBranchOpen(false)}
          onSuccess={(newBranch) => {
            setNewBranchOpen(false);
            setBranches((prev) => [...prev, newBranch]);
            setActiveBranchId(newBranch.id);
          }}
          projectId={projectId}
          fromVersionId={activeBranch.head_version_id}
          fromBranchName={activeBranch.name}
          fromVersionNumber={activeBranch.head_version_number ?? 0}
        />
      ) : null}

      {activeBranch ? (
        <MergePickerModal
          isOpen={mergePickerOpen}
          onClose={() => setMergePickerOpen(false)}
          projectId={projectId}
          sourceBranch={activeBranch}
          branches={branches}
          router={router}
        />
      ) : null}
    </div>
  );
}
