'use client';

import React from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

interface LoginButtonProps {
  type?: 'submit' | 'button';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function LoginButton({
  type = 'submit',
  loading = false,
  disabled = false,
  onClick,
  children = 'Login',
}: LoginButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="relative w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide text-white transition-all duration-300 ease-out transform active:scale-[0.98] hover:scale-[1.015] hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none group overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FF6A00 0%, #FF8800 50%, #FF2D16 100%)',
        boxShadow:
          '0 12px 30px -6px rgba(255, 106, 0, 0.45), 0 0 20px rgba(255, 106, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
      }}
    >
      {/* Light sweep hover shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Button Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span className="font-semibold tracking-wide">Logging in...</span>
          </>
        ) : (
          <>
            <span className="font-bold tracking-wide">{children}</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-200" />
          </>
        )}
      </div>
    </button>
  );
}

