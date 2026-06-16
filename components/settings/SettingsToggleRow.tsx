'use client';

import React from 'react';
import { Switch } from '@/components/shadcn/ui/switch';
import { settingsRowLabelClassName } from '@/components/settings/settingsUi';

export default function SettingsToggleRow({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className={settingsRowLabelClassName}>{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </li>
  );
}
