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
        width={compact ? 36 : 40}
        height={compact ? 36 : 40}
        className={`flex-shrink-0 object-contain ${compact ? 'h-9 w-9' : 'h-10 w-10'}`}
        priority
      />
      {!compact && (
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate font-serif text-3xl leading-none text-snow">Archivum</p>
        </div>
      )}
    </>
  );
}
