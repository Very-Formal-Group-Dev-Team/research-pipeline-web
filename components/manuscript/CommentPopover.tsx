'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiMessageSquare, FiX } from 'react-icons/fi';
import Button from '@/components/Button';
import Card, { CardTitle } from '@/components/ui/Card';
import { formControlFocusGlowClassName } from '@/lib/utils/formControls';

const MARGIN = 12;
const GAP = 8;

interface Bounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

interface CommentPopoverProps {
  anchorRect: DOMRect;
  boundaryRef?: React.RefObject<HTMLElement | null>;
  quote: string;
  body: string;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
  commentPlaceholder?: string;
}

function getClampBounds(boundaryEl?: HTMLElement | null): Bounds {
  const viewport: Bounds = {
    top: MARGIN,
    left: MARGIN,
    right: window.innerWidth - MARGIN,
    bottom: window.innerHeight - MARGIN,
  };

  if (!boundaryEl) return viewport;

  const boundary = boundaryEl.getBoundingClientRect();
  return {
    top: Math.max(viewport.top, boundary.top + MARGIN),
    left: Math.max(viewport.left, boundary.left + MARGIN),
    right: Math.min(viewport.right, boundary.right - MARGIN),
    bottom: Math.min(viewport.bottom, boundary.bottom - MARGIN),
  };
}

function computePopoverPosition(
  anchorRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  bounds: Bounds,
): { top: number; left: number; maxHeight: number } {
  const availableHeight = bounds.bottom - bounds.top;
  const maxHeight = Math.max(200, availableHeight);

  let top = anchorRect.bottom + GAP;
  const spaceBelow = bounds.bottom - top;
  const spaceAbove = anchorRect.top - GAP - bounds.top;

  if (popoverHeight > spaceBelow && spaceAbove >= spaceBelow) {
    top = anchorRect.top - GAP - Math.min(popoverHeight, maxHeight);
  }

  if (top + popoverHeight > bounds.bottom) {
    top = bounds.bottom - Math.min(popoverHeight, maxHeight);
  }

  top = Math.max(bounds.top, top);

  let left = anchorRect.left;
  left = Math.max(bounds.left, Math.min(left, bounds.right - popoverWidth));

  return {
    top,
    left,
    maxHeight: Math.max(200, bounds.bottom - top),
  };
}

export default function CommentPopover({
  anchorRect,
  boundaryRef,
  quote,
  body,
  onBodyChange,
  onSubmit,
  onCancel,
  submitting = false,
  commentPlaceholder = 'Leave a comment…',
}: CommentPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const el = popoverRef.current;
      if (!el) return;

      const bounds = getClampBounds(boundaryRef?.current);
      setPosition(
        computePopoverPosition(anchorRect, el.offsetWidth, el.offsetHeight, bounds),
      );
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRect, boundaryRef, quote, body]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[100] w-80"
      style={{
        top: position?.top ?? anchorRect.bottom + GAP,
        left: position?.left ?? Math.max(MARGIN, anchorRect.left),
        maxHeight: position?.maxHeight,
        visibility: position ? 'visible' : 'hidden',
      }}
    >
      <Card
        padding="none"
        shadow="soft"
        hoverShadow={false}
        className="flex max-h-full flex-col overflow-hidden !rounded-sm"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="mb-3 flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FiMessageSquare className="h-4 w-4 text-primary-500" />
            Add comment
          </CardTitle>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Cancel comment"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 border-l-2 border-amber-300 pl-2 text-xs italic text-neutral-500 line-clamp-3">
          &ldquo;{quote}&rdquo;
        </p>

        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={3}
          autoFocus
          placeholder={commentPlaceholder}
          className={`w-full resize-none rounded-sm border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600 ${formControlFocusGlowClassName}`}
        />
        </div>

        <div className="flex shrink-0 justify-end gap-2 bg-white px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
          <Button variant="outline" size="sm" className="!rounded-sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" className="!rounded-sm" onClick={onSubmit} disabled={submitting || !body.trim()}>
            {submitting ? 'Posting…' : 'Comment'}
          </Button>
        </div>
      </Card>
    </div>,
    document.body,
  );
}
