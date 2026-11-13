'use client';

import React, { Suspense } from 'react';
import LoginPage from '@/components/auth/LoginPage';
import { Loader2 } from 'lucide-react';

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] text-[#FF6A00]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
