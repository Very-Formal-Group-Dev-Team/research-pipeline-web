import React, { useState } from 'react';
import Image from 'next/image';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

function resolveImageSrc(src?: string): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  const normalizedPath = src.startsWith('/') ? src : `/${src}`;
  return new URL(normalizedPath, `${API_ORIGIN}/`).toString();
}

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const statusStyles = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
};

function getInitials(name: string): string {
  const names = name.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ src, alt, name, size = 'md', className = '', status }: AvatarProps) {
  const displayName = alt || name || 'User';
  const initials = name ? getInitials(name) : '?';
  const resolvedSrc = resolveImageSrc(src);
  const isUploadAsset = resolvedSrc?.includes('/uploads/');
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeStyles[size]}
          rounded-full overflow-hidden
          bg-accent-200 text-accent-700
          flex items-center justify-center
          font-semibold
        `}
      >
        {resolvedSrc && !imgError ? (
          isUploadAsset ? (
            <img
              src={resolvedSrc}
              alt={displayName}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <Image
              src={resolvedSrc}
              alt={displayName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )
        ) : (
          <span>{initials}</span>
        )}
      </div>
      
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}
            rounded-full border-2 border-white
            ${statusStyles[status]}
          `}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ children, max = 5, className = '' }: { children: React.ReactNode; max?: number; className?: string }) {
  const childrenArray = React.Children.toArray(children);
  const displayChildren = childrenArray.slice(0, max);
  const remaining = childrenArray.length - max;

  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {displayChildren}
      {remaining > 0 && (
        <div className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-sm font-medium text-neutral-700">
          +{remaining}
        </div>
      )}
    </div>
  );
}
