import React from 'react';

export interface CardIconHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  /** Tailwind color class for the icon, e.g. text-archivumRed */
  iconClassName?: string;
  className?: string;
}

export default function CardIconHeader({
  title,
  description,
  icon,
  iconClassName = 'text-archivumRed',
  className = 'mb-4',
}: CardIconHeaderProps) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`.trim()}>
      <div className={`flex-shrink-0 ${iconClassName}`}>{icon}</div>
      <div className="min-w-0">
        <h3 className="font-serif text-xl font-semibold text-eerieBlack">{title}</h3>
        {description ? (
          <p className="font-sans text-sm text-neutral-600 mt-0.5">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
