'use client';

import React, { useState } from 'react';
import type { DashboardRole } from '@/lib/auth/roleAccess';
import {
  getRoleGuide,
  isFullRoleGuide,
  type RoleGuideVariant,
} from '@/lib/content/roleGuides';
import { FiChevronDown } from 'react-icons/fi';

export interface RoleGuidePanelProps {
  role: DashboardRole;
  variant?: RoleGuideVariant;
  highlighted?: boolean;
  defaultExpanded?: boolean;
  collapsible?: boolean;
}

const roleTitleClass = 'text-xl font-bold text-primary-700 md:text-2xl';
const sectionLabelClass = 'text-xs font-semibold uppercase tracking-wide text-neutral-500';
const bodyTextClass = 'text-sm leading-relaxed text-neutral-700 md:text-md';
const itemTitleClass = 'text-sm font-semibold text-primary-700 md:text-md';
const secondaryTextClass = 'text-sm leading-relaxed text-neutral-600 md:text-md';
const sectionGapClass = 'mt-2';
const bulletDotClass = 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full md:mt-2';

export default function RoleGuidePanel({
  role,
  variant = 'full',
  highlighted = false,
  defaultExpanded = true,
  collapsible = false,
}: RoleGuidePanelProps) {
  const guide = getRoleGuide(role, variant);
  const fullGuide = isFullRoleGuide(guide) ? guide : null;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const content = (
    <div className="space-y-6">
      <section>
        <h3 className={sectionLabelClass}>Role overview</h3>
        <p className={`${sectionGapClass} ${bodyTextClass}`}>{guide.overview}</p>
      </section>

      <section>
        <h3 className={sectionLabelClass}>Key tasks</h3>
        <ul className={`${sectionGapClass} space-y-2`}>
          {guide.keyTasks.map((task) => (
            <li key={task} className={`flex gap-2 ${bodyTextClass}`}>
              <span className={`${bulletDotClass} bg-archivumRed`} aria-hidden />
              <span>{task}</span>
            </li>
          ))}
        </ul>
      </section>

      {fullGuide ? (
        <>
          <section>
            <h3 className={sectionLabelClass}>Common workflows</h3>
            <div className={`${sectionGapClass} space-y-4`}>
              {fullGuide.workflows.map((workflow) => (
                <div key={workflow.title}>
                  <p className={itemTitleClass}>{workflow.title}</p>
                  <ol className={`mt-1.5 space-y-1.5 pl-5 list-decimal ${bodyTextClass}`}>
                    {workflow.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className={sectionLabelClass}>Capabilities</h3>
            <ul className={`${sectionGapClass} space-y-3`}>
              {fullGuide.capabilities.map((cap) => (
                <li key={cap.label}>
                  <p className={itemTitleClass}>{cap.label}</p>
                  <p className={`${secondaryTextClass} mt-0.5`}>{cap.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className={sectionLabelClass}>Good to know</h3>
            <ul className={`${sectionGapClass} space-y-2`}>
              {fullGuide.tips.map((tip) => (
                <li key={tip} className={`flex gap-2 ${bodyTextClass}`}>
                  <span className={`${bulletDotClass} bg-neutral-400`} aria-hidden />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section>
          <h3 className={sectionLabelClass}>Capabilities</h3>
          <ul className={`${sectionGapClass} space-y-3`}>
            {guide.capabilities.map((cap) => (
              <li key={cap.label}>
                <p className={itemTitleClass}>{cap.label}</p>
                <p className={`${secondaryTextClass} mt-0.5`}>{cap.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <div
        className={`rounded-lg bg-white p-6 shadow-sm ${
          highlighted ? 'ring-2 ring-archivumRed/30' : ''
        }`}
      >
        <h2 className={`${roleTitleClass} mb-6`}>{guide.label}</h2>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg bg-white shadow-sm overflow-hidden ${
        highlighted ? 'ring-2 ring-archivumRed/30' : 'border border-neutral-200'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left hover:bg-neutral-50 transition-colors"
        aria-expanded={expanded}
      >
        <span className={roleTitleClass}>{guide.label}</span>
        <FiChevronDown
          className={`shrink-0 text-neutral-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded ? (
        <div className="border-t border-neutral-100 px-6 pt-6 pb-6">{content}</div>
      ) : null}
    </div>
  );
}
