'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'bg-white border border-neutral-200 text-neutral-800 shadow-medium',
          description: 'text-neutral-600',
          actionButton: 'bg-primary-500 text-white',
          cancelButton: 'bg-neutral-100 text-neutral-700',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
