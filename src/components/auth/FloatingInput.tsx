'use client';

import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingInputProps {
  id: string;
  type?: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

export default function FloatingInput({
  id,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  required = false,
  disabled = false,
  autoComplete,
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      {/* Label with floating/active animation */}
      <label
        htmlFor={id}
        className={`block text-xs font-semibold tracking-wide transition-all duration-200 ${
          isFocused ? 'text-[#FFA040]' : 'text-neutral-300'
        }`}
      >
        {label}
      </label>

      {/* Input Shell */}
      <div
        className={`relative flex items-center w-full rounded-2xl transition-all duration-200 border ${
          error
            ? 'border-rose-500/60 bg-rose-950/20'
            : isFocused
            ? 'border-[#FF6A00] bg-[#181818] ring-2 ring-[#FF6A00]/25 shadow-[0_0_20px_rgba(255,106,0,0.2)]'
            : 'border-white/10 bg-[#141414]/90 hover:border-white/20'
        }`}
      >
        {Icon && (
          <div className="pl-4 pr-1 text-[#FF8800] pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4 transition-colors duration-200" />
          </div>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full py-3.5 pr-4 text-sm bg-transparent text-white placeholder-neutral-500 focus:outline-none transition-colors ${
            Icon ? 'pl-2.5' : 'pl-4'
          }`}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-[11px] text-rose-400 font-medium tracking-wide animate-fadeIn pl-1">
          {error}
        </p>
      )}
    </div>
  );
}

