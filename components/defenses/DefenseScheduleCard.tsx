'use client';

import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

import DefenseCardExpandContent from '@/components/defenses/DefenseCardExpandContent';
import CoordinatorScheduleCard from '@/components/coordinator/CoordinatorScheduleCard';
import type { Defense } from '@/lib/api/defenses';
import { defenseStatusBadge } from '@/lib/defenses/display';

export interface DefenseScheduleCardProps {
  defense: Defense;
  showProposedBy?: boolean;
}

export default function DefenseScheduleCard({
  defense,
  showProposedBy = false,
}: DefenseScheduleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const badge = defenseStatusBadge(defense.status);
  const startTime = defense.start_time || defense.scheduled_at || '';

  return (
    <CoordinatorScheduleCard
      title={defense.project_title}
      startTime={startTime}
      endTime={defense.end_time}
      modality={defense.modality}
      proposedBy={showProposedBy ? defense.created_by_name : undefined}
      defenseType={defense.defense_type}
      status={defense.status}
      statusLabel={badge.label}
      statusVariant={badge.variant}
      onToggleExpand={() => setExpanded((open) => !open)}
      trailing={
        expanded ? (
          <FiChevronUp className="text-neutral-400" aria-hidden />
        ) : (
          <FiChevronDown className="text-neutral-400" aria-hidden />
        )
      }
      expanded={expanded}
      expandContent={<DefenseCardExpandContent defense={defense} />}
    />
  );
}
