'use client';

import React, { useEffect, useState } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Shown below the title and above the header divider */
  description?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'schedule' | 'full';
  /** Tighter header/body padding and smaller title — for short confirmation dialogs */
  dense?: boolean;
  /** Override default title typography */
  titleClassName?: string;
  /** Extra classes on the modal panel (e.g. max-width) */
  panelClassName?: string;
  /** Extra classes on the body/content wrapper below the header */
  contentClassName?: string;
  /** Extra classes on the header block */
  headerClassName?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const sizeStyles = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  /** Coordinator schedule/edit forms: 32rem content + 3rem horizontal padding */
  schedule: 'w-full max-w-[35rem]',
  full: 'max-w-full mx-4',
};

export default function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  description,
  size = 'md',
  dense = false,
  titleClassName,
  panelClassName = '',
  contentClassName = '',
  headerClassName = '',
  closeOnOverlayClick = true,
  showCloseButton = true 
}: ModalProps) {
  const headerPadding = dense ? 'p-4' : 'p-6';
  const contentPadding = dense ? 'p-4' : 'p-6';
  const titleClass =
    titleClassName ??
    (dense ? 'text-lg font-semibold text-primary-700' : 'text-2xl font-semibold text-primary-700');
  const closeIconClass = dense ? 'w-5 h-5' : 'w-6 h-6';
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldRender]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'animate-fade-in'
        }`}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-hard ${sizeStyles[size]} w-full mx-4 transition-all duration-200 ${
          isClosing ? 'opacity-0 scale-95 translate-y-4' : 'animate-slide-up'
        } ${panelClassName}`}
      >
        {/* Header */}
        {(title || description || showCloseButton) && (
          <div className={`border-b border-neutral-200 ${headerPadding} ${headerClassName}`.trim()}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {title ? <h2 className={titleClass}>{title}</h2> : null}
                {description ? (
                  <div className={`text-sm text-neutral-600 ${title ? 'mt-1.5' : ''}`}>{description}</div>
                ) : null}
              </div>
              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 text-neutral-500 transition-colors hover:text-neutral-700"
                  aria-label="Close"
                >
                  <svg className={closeIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className={`${contentPadding} ${contentClassName}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-end gap-3 border-t border-neutral-200 mt-6 pt-4 ${className}`}>
      {children}
    </div>
  );
}
