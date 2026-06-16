'use client';

import React from 'react';
import Card, { CardTitle } from '@/components/ui/Card';
import ThemeToggle from '@/components/settings/ThemeToggle';
import { settingsSectionIntroClassName } from '@/components/settings/settingsUi';

export default function AppearanceSection() {
  return (
    <Card>
      <CardTitle className="mb-2 text-primary-700">Appearance</CardTitle>
      <p className={`mb-4 ${settingsSectionIntroClassName}`}>
        Choose how Archivum looks on your device. Save changes to apply your selection.
      </p>
      <ThemeToggle />
    </Card>
  );
}
