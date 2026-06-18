'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiMinus,
  FiPlus,
} from 'react-icons/fi';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import ManuscriptViewer, { type ManuscriptSelection } from '@/components/manuscript/ManuscriptViewer';
import CommentSidebar from '@/components/manuscript/CommentSidebar';
import CommentPopover from '@/components/manuscript/CommentPopover';
import { getPaperVersionDiff, getPaperVersions, type PaperVersion } from '@/lib/api/paperVersions';
import {
  createPaperComment,
  getPaperComments,
  reopenPaperComment,
  requestPaperCommentRevision,
  resolvePaperComment,
  type PaperComment,
} from '@/lib/api/paperComments';
import {
  completePaperReviewRequest,
  getProjectReviewRequest,
  type PaperReviewRequest,
} from '@/lib/api/paperReviews';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { isDocxFileName } from '@/lib/manuscript/docxPreview';

const PAGE_TITLE_CLASS =
  'font-serif text-2xl font-bold leading-tight text-primary-700 sm:text-3xl';

/** Tall enough to show roughly one US Letter page in the scroll viewport. */
const DOCUMENT_VIEWER_HEIGHT_CLASS = 'h-[min(1200px,calc(100vh-10rem))]';

export interface ManuscriptReviewPageProps {
  role: 'student' | 'adviser';
  projectId: string;
  versionId: string;
  backUrl: string;
  backLabel?: string;
  canComment?: boolean;
  canCompleteReview?: boolean;
}

interface CompleteReviewConflict {
  requiresConfirmation: boolean;
  commentCounts?: {
    open: number;
    needs_revision: number;
    resolved: number;
  };
}

export default function ManuscriptReviewPage({
  role,
  projectId,
  versionId,
  backUrl,
  backLabel = 'Back to project',
  canComment = false,
  canCompleteReview = false,
}: ManuscriptReviewPageProps) {
  const router = useRouter();
  const dashboardLabel = role === 'adviser' ? 'Adviser' : 'Student';
  const { user, handleLogout } = useDashboardUser(dashboardLabel);

  const [version, setVersion] = useState<PaperVersion | null>(null);
  const [diff, setDiff] = useState<Awaited<ReturnType<typeof getPaperVersionDiff>>['data']>(null);
  const [comments, setComments] = useState<PaperComment[]>([]);
  const [reviewRequest, setReviewRequest] = useState<PaperReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [renderSide, setRenderSide] = useState<'current' | 'previous'>('current');
  const [showDiff, setShowDiff] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<ManuscriptSelection | null>(null);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [completeConflict, setCompleteConflict] = useState<CompleteReviewConflict | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const [sidebarPanelHeight, setSidebarPanelHeight] = useState<number | null>(null);

  const isFirstVersion = useMemo(() => version?.version_number === 1, [version]);
  const isReviewTarget = reviewRequest?.paper_version_id === versionId;
  const isMergeCommit = version?.tag === 'merge';
  const isDocx = isDocxFileName(version?.file_name) && !isMergeCommit;

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    const res = await getPaperComments(projectId, versionId);
    if (res.data) setComments(res.data);
    setCommentsLoading(false);
  }, [projectId, versionId]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    const [versionsRes, diffRes, reviewRes] = await Promise.all([
      getPaperVersions(projectId),
      getPaperVersionDiff(projectId, versionId),
      getProjectReviewRequest(projectId),
    ]);

    const found = versionsRes.data?.find((v) => v.id === versionId) || null;
    if (!found) {
      toast.error('Version not found');
      router.push(backUrl);
      return;
    }

    setVersion(found);
    setDiff(diffRes.data || null);
    setReviewRequest(reviewRes.data || null);
    setLoading(false);
    await loadComments();
  }, [projectId, versionId, backUrl, router, loadComments]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!sidebarOpen) {
      setSidebarPanelHeight(null);
      return;
    }

    const el = previewCardRef.current;
    if (!el) return;

    const updateHeight = () => {
      setSidebarPanelHeight(el.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sidebarOpen, loading, version, diff, showDiff, renderSide, isFirstVersion, isDocx]);

  const handleCreateComment = async () => {
    if (!pendingSelection || !newCommentBody.trim()) return;
    setCommentSubmitting(true);
    const res = await createPaperComment(projectId, {
      versionId,
      anchor: pendingSelection.anchor,
      body: newCommentBody.trim(),
    });
    setCommentSubmitting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Comment added');
    setPendingSelection(null);
    setNewCommentBody('');
    await loadComments();
  };

  const handleResolve = async (commentId: string) => {
    const res = await resolvePaperComment(projectId, commentId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Comment resolved');
    await loadComments();
  };

  const handleRequestRevision = async (commentId: string) => {
    const res = await requestPaperCommentRevision(projectId, commentId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Revision requested');
    await loadComments();
  };

  const handleReopen = async (commentId: string) => {
    const res = await reopenPaperComment(projectId, commentId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Comment reopened');
    await loadComments();
  };

  const handleReply = async (parentId: string, body: string) => {
    const parent = comments.find((c) => c.id === parentId);
    if (!parent?.anchor) {
      toast.error('Cannot reply to this comment');
      return;
    }
    const res = await createPaperComment(projectId, {
      versionId,
      anchor: parent.anchor,
      body,
      parentId,
    });
    if (res.error) {
      toast.error(res.error);
      throw new Error(res.error);
    }
    toast.success('Reply posted');
    await loadComments();
  };

  const runCompleteReview = async (force = false) => {
    setCompleteLoading(true);
    const res = await completePaperReviewRequest(projectId, force);
    setCompleteLoading(false);

    if (res.status === 409 && res.data) {
      const conflict = res.data as CompleteReviewConflict;
      if (conflict.requiresConfirmation) {
        setCompleteConflict(conflict);
        setCompleteConfirmOpen(true);
        return;
      }
    }

    if (res.error) {
      toast.error(res.error);
      return;
    }

    setCompleteConfirmOpen(false);
    setCompleteConflict(null);
    toast.success('Marked as reviewed');
    const reviewRes = await getProjectReviewRequest(projectId);
    setReviewRequest(reviewRes.data || null);
  };

  const commentCounts = useMemo(() => {
    const parents = comments.filter((c) => !c.parent_id);
    return {
      open: parents.filter((c) => c.status === 'open').length,
      needs_revision: parents.filter((c) => c.status === 'needs_revision').length,
      resolved: parents.filter((c) => c.status === 'resolved').length,
      total: parents.length,
    };
  }, [comments]);

  if (!user) return null;

  return (
    <DashboardLayout role={role} user={user} onLogout={handleLogout}>
      <div className="project-detail-forms space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className={PAGE_TITLE_CLASS}>Comments</h1>
            {version ? (
              <p className="mt-1 font-sans text-sm text-neutral-600">
                Version {version.version_number}
                <span className="mx-1.5 text-neutral-400" aria-hidden>
                  ·
                </span>
                <span className="break-words">{version.commit_message}</span>
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
            {isReviewTarget ? <Badge variant="warning">Review requested</Badge> : null}
            {canCompleteReview && isReviewTarget ? (
              <Button
                variant="primary"
                size="sm"
                loading={completeLoading}
                onClick={() => runCompleteReview(false)}
              >
                <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                Mark reviewed
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-sm text-primary-700 hover:bg-primary-50"
              leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
              onClick={() => router.push(backUrl)}
            >
              {backLabel}
            </Button>
          </div>
        </header>

        {isReviewTarget && canCompleteReview ? (
          <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-900">
            Review summary: {commentCounts.open} open, {commentCounts.needs_revision} need revision,{' '}
            {commentCounts.resolved} resolved.
          </div>
        ) : null}

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div
            ref={previewCardRef}
            className={`min-w-0 ${sidebarOpen ? 'xl:flex-[3]' : 'flex-1'}`}
          >
          <Card
            className="flex min-w-0 flex-col overflow-hidden"
            padding="none"
          >
            <div className="px-4 pt-4 pb-0 sm:px-6 sm:pt-5 sm:pb-0">
              <CardHeader className="mb-0 border-b-0 pb-0">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <FiFileText className="shrink-0 text-2xl text-primary-500" aria-hidden />
                    <button
                      type="button"
                      onClick={() => setSidebarOpen((open) => !open)}
                      className="hidden xl:inline-flex shrink-0 flex-nowrap items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                      aria-expanded={sidebarOpen}
                    >
                      {sidebarOpen ? (
                        <>
                          <FiChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="whitespace-nowrap">Hide comments</span>
                        </>
                      ) : (
                        <>
                          <FiChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="whitespace-nowrap">Show comments ({commentCounts.total})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <CardTitle>Document preview</CardTitle>
                  <CardDescription className="mt-1">
                    {canComment
                      ? role === 'student'
                        ? 'Select text to add a comment or reply to adviser feedback.'
                        : 'Select text in the document to leave inline feedback.'
                      : 'Review comments on this version.'}
                  </CardDescription>

                  {!isFirstVersion && (diff?.previousHtml || (!isDocx && diff?.changes)) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {!isFirstVersion && diff?.previousHtml && !isDocx ? (
                        <div className="inline-flex rounded-md bg-neutral-100 p-1">
                          <button
                            type="button"
                            onClick={() => setRenderSide('current')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              renderSide === 'current'
                                ? 'bg-white shadow-sm font-medium text-neutral-800'
                                : 'text-neutral-600 hover:text-neutral-800'
                            }`}
                          >
                            Current
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenderSide('previous')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              renderSide === 'previous'
                                ? 'bg-white shadow-sm font-medium text-neutral-800'
                                : 'text-neutral-600 hover:text-neutral-800'
                            }`}
                          >
                            Previous
                          </button>
                        </div>
                      ) : null}

                      {!isDocx && !isFirstVersion ? (
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-neutral-600">
                          <input
                            type="checkbox"
                            checked={showDiff}
                            onChange={(e) => setShowDiff(e.target.checked)}
                            className="rounded border-neutral-300"
                          />
                          Show changes
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {diff?.stats && !isFirstVersion ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-success-700 font-medium">
                      <FiPlus className="w-3.5 h-3.5" />{diff.stats.addedWords}
                    </span>
                    <span className="flex items-center gap-1 text-error-700 font-medium">
                      <FiMinus className="w-3.5 h-3.5" />{diff.stats.removedWords}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {diff.stats.previousWords} → {diff.stats.currentWords} words
                    </span>
                    {!isDocx && showDiff ? (
                      <>
                        <span className="text-neutral-300" aria-hidden>
                          ·
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span className="inline-block h-3 w-3 rounded border border-success-300 bg-success-100" />
                          Added
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span className="inline-block h-3 w-3 rounded border border-error-300 bg-error-100" />
                          Removed
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </CardHeader>
            </div>

            <div className="flex flex-1 flex-col px-2 pb-4 pt-0 sm:px-6 sm:pb-6">
              <ManuscriptViewer
                diff={diff}
                mode={isFirstVersion ? 'current' : renderSide}
                showDiff={showDiff && !isFirstVersion && !isDocx}
                comments={comments}
                selectedCommentId={selectedCommentId}
                pendingAnchor={pendingSelection?.anchor ?? null}
                canSelect={canComment}
                loading={loading}
                projectId={projectId}
                versionId={versionId}
                fileName={version?.file_name}
                isMergeCommit={isMergeCommit}
                className={`${DOCUMENT_VIEWER_HEIGHT_CLASS} shrink-0`}
                viewerRef={viewerRef}
                onSelection={setPendingSelection}
                onCommentClick={setSelectedCommentId}
              />
            </div>
          </Card>
          </div>

          <div
            className={`flex w-full min-h-0 shrink-0 flex-col overflow-hidden max-h-[min(520px,70vh)] xl:max-h-none xl:w-96 ${
              sidebarPanelHeight ? 'xl:h-[var(--sidebar-height)]' : ''
            } ${sidebarOpen ? '' : 'xl:hidden'}`}
            style={
              sidebarPanelHeight
                ? ({ '--sidebar-height': `${sidebarPanelHeight}px` } as React.CSSProperties)
                : undefined
            }
          >
            <CommentSidebar
              comments={comments}
              loading={commentsLoading}
              selectedCommentId={selectedCommentId}
              canResolve={role === 'adviser'}
              canRequestRevision={role === 'adviser'}
              canReply
              onSelectComment={setSelectedCommentId}
              onResolve={handleResolve}
              onRequestRevision={handleRequestRevision}
              onReopen={handleReopen}
              onReply={handleReply}
              onClose={() => setSidebarOpen(false)}
              className="h-full min-h-0"
            />
          </div>
        </div>
      </div>

      {pendingSelection ? (
        <CommentPopover
          anchorRect={pendingSelection.rect}
          boundaryRef={viewerRef}
          quote={pendingSelection.anchor.exact}
          body={newCommentBody}
          commentPlaceholder={
            role === 'student'
              ? 'Add a note for your adviser…'
              : 'Leave feedback for the student…'
          }
          onBodyChange={setNewCommentBody}
          onSubmit={handleCreateComment}
          onCancel={() => {
            setPendingSelection(null);
            setNewCommentBody('');
          }}
          submitting={commentSubmitting}
        />
      ) : null}

      <Modal
        isOpen={completeConfirmOpen}
        onClose={() => {
          if (completeLoading) return;
          setCompleteConfirmOpen(false);
        }}
        title="Unresolved comments"
      >
        <p className="text-sm text-neutral-700">
          This version still has {completeConflict?.commentCounts?.open ?? 0} open and{' '}
          {completeConflict?.commentCounts?.needs_revision ?? 0} revision-requested comments. Mark
          the review complete anyway?
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setCompleteConfirmOpen(false)}
            disabled={completeLoading}
          >
            Cancel
          </Button>
          <Button variant="primary" loading={completeLoading} onClick={() => runCompleteReview(true)}>
            Complete anyway
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
