import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

import { ACCOUNT_DEACTIVATED_DISPLAY_MESSAGE } from '@/lib/auth/accountDeactivated';

export default function DeactivatedAccountAlert({
  message = ACCOUNT_DEACTIVATED_DISPLAY_MESSAGE,
}: {
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-archivumRed/30 bg-archivumRed/10 px-4 py-3 text-sm text-eerieBlack"
    >
      <div className="flex gap-3">
        <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-archivumRed" aria-hidden />
        <div>
          <p className="font-semibold text-archivumRed">Account deactivated</p>
          <p className="mt-1 text-eerieBlack/90">{message}</p>
        </div>
      </div>
    </div>
  );
}
