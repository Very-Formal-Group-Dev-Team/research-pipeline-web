'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export interface UndoActionToastConfig {
  message: string;
  actionLabel?: string;
  durationMs?: number;
  onUndo: () => void | Promise<void>;
}

export interface UndoActionToastProps extends UndoActionToastConfig {
  open: boolean;
  onDismiss: () => void;
}

export function UndoActionToast({
  open,
  message,
  actionLabel = 'Revert',
  durationMs = 8000,
  onUndo,
  onDismiss,
}: UndoActionToastProps) {
  const animationName = useId().replace(/:/g, '');
  const [visible, setVisible] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    window.setTimeout(() => onDismiss(), 280);
  }, [onDismiss]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      setUndoing(false);
      dismissedRef.current = false;
      return;
    }

    dismissedRef.current = false;
    setUndoing(false);
    const enterTimer = window.setTimeout(() => setVisible(true), 10);
    const exitTimer = window.setTimeout(() => dismiss(), durationMs);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
    };
  }, [open, durationMs, dismiss]);

  const handleUndo = async () => {
    if (undoing) return;
    setUndoing(true);
    try {
      await onUndo();
    } finally {
      setUndoing(false);
      dismiss();
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes ${animationName} {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: ${RING_CIRCUMFERENCE}; }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-[100] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg">
          <div className="relative h-10 w-10 shrink-0" aria-hidden>
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-neutral-200"
              />
              <circle
                cx="20"
                cy="20"
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-primary-500"
                strokeDasharray={RING_CIRCUMFERENCE}
                style={{
                  animation: `${animationName} ${durationMs}ms linear forwards`,
                }}
              />
            </svg>
          </div>
          <p className="min-w-0 flex-1 text-sm text-neutral-800">{message}</p>
          <button
            type="button"
            onClick={() => void handleUndo()}
            disabled={undoing}
            className="shrink-0 rounded-lg border border-primary-500 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-60"
          >
            {undoing ? 'Reverting…' : actionLabel}
          </button>
        </div>
      </div>
    </>
  );
}

let undoToastCounter = 0;

export function useUndoActionToast() {
  const [toast, setToast] = useState<(UndoActionToastConfig & { id: string }) | null>(null);

  const showUndoToast = useCallback((config: UndoActionToastConfig) => {
    undoToastCounter += 1;
    setToast({ ...config, id: `undo-toast-${undoToastCounter}` });
  }, []);

  const dismissUndoToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showUndoToast, dismissUndoToast };
}

export function UndoActionToastHost({
  toast,
  onDismiss,
}: {
  toast: (UndoActionToastConfig & { id: string }) | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  return (
    <UndoActionToast
      key={toast.id}
      open
      message={toast.message}
      actionLabel={toast.actionLabel}
      durationMs={toast.durationMs}
      onUndo={toast.onUndo}
      onDismiss={onDismiss}
    />
  );
}
