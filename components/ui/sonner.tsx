'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const toastBase =
  '!rounded-xl !border !bg-white !px-4 !py-3 !shadow-lg !text-sm !text-neutral-800 dark:!bg-neutral-800 dark:!text-neutral-100';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      richColors={false}
      toastOptions={{
        classNames: {
          toast: toastBase,
          title: 'font-medium',
          description: '!text-neutral-600 dark:!text-neutral-400',
          success:
            '!border-success-300 [&_[data-icon]]:!text-success-500 dark:!border-success-600',
          error: '!border-error-300 [&_[data-icon]]:!text-error-500 dark:!border-error-600',
          warning:
            '!border-warning-300 [&_[data-icon]]:!text-warning-500 dark:!border-warning-600',
          info: '!border-primary-300 [&_[data-icon]]:!text-primary-500 dark:!border-primary-600',
          default:
            '!border-neutral-200 [&_[data-icon]]:!text-primary-500 dark:!border-neutral-600',
          actionButton:
            '!rounded-lg !bg-primary-500 !text-white hover:!bg-primary-600',
          cancelButton:
            '!rounded-lg !bg-neutral-100 !text-neutral-700 dark:!bg-neutral-700 dark:!text-neutral-200',
          closeButton:
            '!border-neutral-200 !bg-white !text-neutral-500 hover:!text-neutral-700 dark:!bg-neutral-800 dark:!border-neutral-600 dark:!text-neutral-400',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
