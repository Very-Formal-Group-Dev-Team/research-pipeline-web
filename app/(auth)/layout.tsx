import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-ui min-h-screen flex items-center justify-center py-8 px-4 sm:py-12 sm:px-6 md:py-16 md:px-12 lg:px-24 bg-deepSpaceBlue">
      <div className="w-full max-w-[448px] mx-auto">
        {children}
      </div>
    </div>
  );
}
