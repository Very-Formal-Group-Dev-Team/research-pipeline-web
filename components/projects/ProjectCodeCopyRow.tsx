'use client';

import React, { useState } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';

import Button from '@/components/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { projectCodeDisplayClassName } from '@/lib/utils/formControls';

const COPY_FEEDBACK_MS = 2000;

export default function ProjectCodeCopyRow({
  projectCode,
  compact = false,
}: {
  projectCode: string;
  compact?: boolean;
}) {
  const { toasts, addToast, removeToast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(projectCode);
      setCopied(true);
      addToast('Project code copied to clipboard.', 'success', 3000);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      addToast('Could not copy project code. Please try again.', 'error');
    }
  }

  return (
    <>
      <div className="mt-4 flex min-w-0 items-center gap-2">
        <code
          className={`${projectCodeDisplayClassName}${compact ? ' !rounded-sm' : ''}`}
        >
          {projectCode}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex size-9 shrink-0 items-center justify-center !rounded-sm !border !p-0"
          onClick={() => void handleCopy()}
          aria-label={copied ? 'Copied to clipboard' : 'Copy project code'}
        >
          {copied ? (
            <FiCheck className="text-success-600" aria-hidden />
          ) : (
            <FiCopy aria-hidden />
          )}
        </Button>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
