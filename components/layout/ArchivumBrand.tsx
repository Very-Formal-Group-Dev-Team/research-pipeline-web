'use client';

import Image from 'next/image';

export interface ArchivumBrandProps {
  compact?: boolean;
}

export default function ArchivumBrand({ compact = false }: ArchivumBrandProps) {
  return (
    <>
      <Image
        src="/archivum.svg"
        alt="Archivum"
        width={compact ? 40 : 44}
        height={compact ? 40 : 44}
        className={`flex-shrink-0 object-contain ${compact ? 'h-10 w-10' : 'h-11 w-11'}`}
        priority
      />
      {!compact && (
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate font-serif text-2xl leading-tight text-snow">Archivum</p>
          <p className="truncate font-sans text-xs font-light leading-snug text-white/75">
            Research Portal
          </p>
        </div>
      )}
    </>
  );
}
