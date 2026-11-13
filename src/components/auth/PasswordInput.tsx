'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

export default function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      {/* Label */}
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
        {/* Left Lock Icon */}
        <div className="pl-4 pr-1 text-[#FF8800] pointer-events-none flex items-center justify-center">
          <Lock className="w-4 h-4" />
        </div>

        {/* Input Field */}
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full py-3.5 pl-2.5 pr-12 text-sm bg-transparent text-white placeholder-neutral-500 focus:outline-none transition-colors"
        />

        {/* Eye Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 p-1 rounded-lg text-neutral-400 hover:text-[#FFA040] transition-colors focus:outline-none focus:ring-1 focus:ring-[#FF6A00]/40"
          title={showPassword ? 'Hide password' : 'Show password'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 transition-transform active:scale-90" />
          ) : (
            <Eye className="w-4 h-4 transition-transform active:scale-90" />
          )}
        </button>
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

