'use client';

import React, { useState } from 'react';
import { FiRotateCcw, FiSave } from 'react-icons/fi';
import Button from '@/components/Button';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { useSettingsPreferences } from '@/components/settings/SettingsPreferencesContext';

const PREFERENCE_SECTIONS = new Set(['notifications', 'appearance', 'calendar']);

/** Matches the Schedule button on coordinator/events. */
export const settingsHeaderButtonClassName =
  'shrink-0 px-4 py-2 text-base hover:shadow-none active:shadow-none';

export function SettingsSaveStatus({ activeSection }: { activeSection: string }) {
  const { isDirty } = useSettingsPreferences();

  if (!PREFERENCE_SECTIONS.has(activeSection) || !isDirty) {
    return null;
  }

  return <p className="mt-1 text-sm text-neutral-500">You have unsaved changes.</p>;
}

export default function SettingsHeaderActions({ activeSection }: { activeSection: string }) {
  const { isDirty, isSaving, isResetting, isLoading, saveChanges, resetToDefaults } =
    useSettingsPreferences();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  if (!PREFERENCE_SECTIONS.has(activeSection)) {
    return null;
  }

  const handleConfirmReset = async () => {
    setResetConfirmOpen(false);
    await resetToDefaults();
  };

  return (
    <>
      <div className="flex shrink-0 flex-nowrap gap-2 pb-0.5 sm:pb-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`${settingsHeaderButtonClassName} coordinator-btn-secondary hover:bg-oxfordBlue/10`}
          onClick={() => setResetConfirmOpen(true)}
          disabled={isLoading || isSaving || isResetting}
        >
          <FiRotateCcw className="mr-1" />
          {isResetting ? 'Resetting…' : 'Reset to default'}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className={`${settingsHeaderButtonClassName} hover:bg-primary-600 active:bg-primary-700`}
          onClick={saveChanges}
          disabled={!isDirty || isLoading || isSaving || isResetting}
        >
          <FiSave className="mr-1" />
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset settings to defaults?"
        description="This will restore appearance, calendar, and notification preferences to their default values."
        size="sm"
      >
        <ModalFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setResetConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void handleConfirmReset()}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting…' : 'Reset to default'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
