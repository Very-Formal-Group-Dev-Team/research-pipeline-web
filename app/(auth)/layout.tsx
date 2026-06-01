import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-6 sm:px-8 md:px-24 bg-deepSpaceBlue">
      <div className="w-full max-w-[448px]">
        {children}
      </div>
    </div>
  );
}
