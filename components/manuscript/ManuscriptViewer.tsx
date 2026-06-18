'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import type { DiffResult } from '@/lib/api/paperVersions';
import type { PaperComment, TextQuoteSelector } from '@/lib/api/paperComments';
import {
  applyDiffHighlights,
  buildTextNodeIndex,
  buildTextQuoteSelector,
  offsetFromRange,
  resolveAnchorInText,
  wrapTextRange,
} from '@/lib/manuscript/textAnchors';
import { isDocxFileName, observeDocxPreviewResize, renderDocxPreview, scaleDocxPreviewToFit, HTML_PREVIEW_MOBILE_CLASS, DOCX_PREVIEW_SCROLL_CLASS } from '@/lib/manuscript/docxPreview';

export interface ManuscriptSelection {
  anchor: ReturnType<typeof buildTextQuoteSelector>;
  rect: DOMRect;
}

interface ManuscriptViewerProps {
  diff: DiffResult | null;
  mode: 'current' | 'previous';
  showDiff?: boolean;
  comments?: PaperComment[];
  selectedCommentId?: string | null;
  pendingAnchor?: TextQuoteSelector | null;
  canSelect?: boolean;
  loading?: boolean;
  className?: string;
  projectId: string;
  versionId: string;
  fileName?: string;
  isMergeCommit?: boolean;
  onSelection?: (selection: ManuscriptSelection) => void;
  onCommentClick?: (commentId: string) => void;
  viewerRef?: React.RefObject<HTMLDivElement | null>;
}

function commentHighlightClass(status: PaperComment['status'], isSelected: boolean): string {
  const base = 'cursor-pointer rounded-sm px-0.5';
  if (isSelected) return `${base} bg-amber-300 ring-2 ring-amber-500`;
  if (status === 'resolved') return `${base} bg-neutral-200 text-neutral-600`;
  if (status === 'needs_revision') return `${base} bg-orange-200 text-orange-900 underline decoration-orange-500`;
  return `${base} bg-amber-100 text-amber-900 underline decoration-amber-400`;
}

function unwrapCommentMarks(container: HTMLElement) {
  container.querySelectorAll('mark[data-comment-id]').forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });
}

function unwrapPendingMarks(container: HTMLElement) {
  container.querySelectorAll('mark[data-pending-selection]').forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });
}

function applyCommentHighlights(
  container: HTMLElement,
  comments: PaperComment[],
  selectedCommentId: string | null,
  pendingAnchor?: TextQuoteSelector | null,
) {
  unwrapCommentMarks(container);
  unwrapPendingMarks(container);

  const { fullText } = buildTextNodeIndex(container);
  const highlightable = comments
    .filter((c) => c.anchor && c.anchor_status !== 'orphaned')
    .map((comment) => {
      const resolved = comment.anchor ? resolveAnchorInText(fullText, comment.anchor) : null;
      return { comment, resolved };
    })
    .filter((entry) => entry.resolved != null)
    .sort((a, b) => (b.resolved?.start ?? 0) - (a.resolved?.start ?? 0));

  for (const { comment, resolved } of highlightable) {
    if (!resolved) continue;
    wrapTextRange(
      container,
      resolved.start,
      resolved.end,
      commentHighlightClass(comment.status, comment.id === selectedCommentId),
      { commentId: comment.id },
    );
  }

  if (pendingAnchor) {
    const resolved = resolveAnchorInText(fullText, pendingAnchor);
    if (resolved) {
      wrapTextRange(
        container,
        resolved.start,
        resolved.end,
        'rounded-sm bg-amber-300 px-0.5 ring-2 ring-amber-500',
        { pendingSelection: 'true' },
      );
    }
  }
}

export default function ManuscriptViewer({
  diff,
  mode,
  showDiff = false,
  comments = [],
  selectedCommentId = null,
  pendingAnchor = null,
  canSelect = false,
  loading = false,
  className,
  projectId,
  versionId,
  fileName,
  isMergeCommit = false,
  onSelection,
  onCommentClick,
  viewerRef,
}: ManuscriptViewerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [docxReady, setDocxReady] = useState(false);

  const isDocx = isDocxFileName(fileName) && !isMergeCommit;

  const applyHtmlOverlays = useCallback(
    (container: HTMLElement) => {
      if (showDiff && diff?.changes && diff.changes.length > 0) {
        applyDiffHighlights(container, diff.changes, mode);
      }
      applyCommentHighlights(container, comments, selectedCommentId, pendingAnchor);
    },
    [comments, selectedCommentId, pendingAnchor, diff, mode, showDiff],
  );

  const rescaleDocx = useCallback(() => {
    if (!viewportRef.current || !scrollRef.current) return;
    scaleDocxPreviewToFit(viewportRef.current, scrollRef.current);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !diff?.supported || loading) return;

    let cancelled = false;

    if (isDocx) {
      const loadDocx = async () => {
        setRendering(true);
        setRenderError(null);
        setDocxReady(false);
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
          setDocxReady(true);
          applyHtmlOverlays(container);
        } catch {
          if (!cancelled) {
            setRenderError('Failed to render document');
            container.innerHTML =
              '<div class="text-sm text-error-600 bg-error-50 p-3 rounded">Failed to render document</div>';
          }
        } finally {
          if (!cancelled) setRendering(false);
        }
      };

      void loadDocx();
      return () => {
        cancelled = true;
        resizeCleanupRef.current?.();
        resizeCleanupRef.current = null;
      };
    }

    setDocxReady(false);
    const html = mode === 'current' ? diff.currentHtml : diff.previousHtml;
    if (!html) {
      container.innerHTML =
        '<div class="text-sm text-neutral-500 italic">Rendered view not available for this file type.</div>';
      return;
    }

    container.innerHTML = html;
    applyHtmlOverlays(container);
  }, [diff, mode, isDocx, projectId, versionId, loading, rescaleDocx, applyHtmlOverlays]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading || !diff?.supported) return;

    if (isDocx) {
      if (!docxReady) return;
      rescaleDocx();
      applyCommentHighlights(container, comments, selectedCommentId, pendingAnchor);
      return;
    }

    const html = mode === 'current' ? diff.currentHtml : diff.previousHtml;
    if (!html) return;
    container.innerHTML = html;
    applyHtmlOverlays(container);
  }, [comments, selectedCommentId, pendingAnchor, showDiff, applyHtmlOverlays, isDocx, loading, diff, mode, docxReady, rescaleDocx]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onCommentClick) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const mark = target?.closest('mark[data-comment-id]') as HTMLElement | null;
      if (mark?.dataset.commentId) {
        onCommentClick(mark.dataset.commentId);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [onCommentClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !canSelect || !onSelection) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      const { nodes, fullText } = buildTextNodeIndex(container);
      const offsets = offsetFromRange(range, nodes);
      if (!offsets || offsets.end <= offsets.start) return;

      const anchor = buildTextQuoteSelector(fullText, offsets.start, offsets.end);
      if (!anchor.exact.trim()) return;

      const rect = range.getBoundingClientRect();
      onSelection({ anchor, rect });
      selection.removeAllRanges();
    };

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [canSelect, onSelection]);

  const showSpinner = loading || rendering;

  return (
    <div
      ref={viewerRef}
      className={`relative min-h-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50/40 ${className ?? 'h-[min(1200px,calc(100vh-10rem))]'}`}
    >
      {showSpinner ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/80 text-sm text-neutral-400">
          <FiRefreshCw className="w-4 h-4 animate-spin" />
          {loading ? 'Loading manuscript…' : 'Rendering document…'}
        </div>
      ) : null}
      {renderError ? (
        <p className="absolute left-3 right-3 top-3 z-10 text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">
          {renderError}
        </p>
      ) : null}
      <div
        ref={scrollRef}
        className={`h-full min-w-0 ${DOCX_PREVIEW_SCROLL_CLASS} ${showSpinner ? 'invisible' : ''}`}
      >
        <div
          ref={containerRef}
          className={`w-full min-w-0 ${HTML_PREVIEW_MOBILE_CLASS} ${canSelect ? 'select-text' : ''}`}
        />
      </div>
    </div>
  );
}
