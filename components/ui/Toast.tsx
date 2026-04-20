'use client';

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const typeStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: {
    bg: 'bg-success-500',
    icon: '✓',
  },
  error: {
    bg: 'bg-error-500',
    icon: '✕',
  },
  warning: {
    bg: 'bg-warning-500',
    icon: '⚠',
  },
  info: {
    bg: 'bg-accent-500',
    icon: 'ℹ',
  },
};

export function Toast({ id, message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 mb-3
        bg-white border-l-4 rounded-lg shadow-medium
        transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${typeStyles[type].bg.replace('bg-', 'border-')}
      `}
    >
      <div className={`w-6 h-6 rounded-full ${typeStyles[type].bg} text-white flex items-center justify-center font-bold text-sm`}>
        {typeStyles[type].icon}
      </div>
      <p className="flex-1 text-sm text-neutral-900">{message}</p>
      <button
        onClick={handleClose}
        className="text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Hook for managing toasts
let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (message: string, type: ToastType = 'info', duration = 5000) => {
    const id = `toast-${toastId++}`;
    setToasts((prev) => [...prev, { id, message, type, duration, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}
