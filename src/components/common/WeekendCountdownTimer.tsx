'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface WeekendCountdownTimerProps {
  targetDateString: string;
  className?: string;
  compact?: boolean;
}

export default function WeekendCountdownTimer({
  targetDateString,
  className = '',
  compact = false,
}: WeekendCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    function calculate() {
      if (!targetDateString) return;
      const target = new Date(targetDateString).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDateString]);

  if (timeLeft.isPast || !targetDateString) {
    return (
      <span className="text-emerald-500 font-semibold text-xs flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> Opening any moment!
      </span>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 text-xs font-mono font-medium ${className}`}>
        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {pad(timeLeft.hours)}h:{pad(timeLeft.minutes)}m:{pad(timeLeft.seconds)}s
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-col items-center justify-center bg-slate-900/80 text-white rounded-lg px-2.5 py-1.5 min-w-[44px] border border-white/10 shadow-sm">
        <span className="text-sm md:text-base font-bold font-mono text-amber-400">
          {pad(timeLeft.days * 24 + timeLeft.hours)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-gray-400">Hours</span>
      </div>
      <span className="font-bold text-gray-400 text-sm">:</span>
      <div className="flex flex-col items-center justify-center bg-slate-900/80 text-white rounded-lg px-2.5 py-1.5 min-w-[44px] border border-white/10 shadow-sm">
        <span className="text-sm md:text-base font-bold font-mono text-amber-400">
          {pad(timeLeft.minutes)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-gray-400">Mins</span>
      </div>
      <span className="font-bold text-gray-400 text-sm">:</span>
      <div className="flex flex-col items-center justify-center bg-slate-900/80 text-white rounded-lg px-2.5 py-1.5 min-w-[44px] border border-white/10 shadow-sm">
        <span className="text-sm md:text-base font-bold font-mono text-emerald-400">
          {pad(timeLeft.seconds)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-gray-400">Secs</span>
      </div>
    </div>
  );
}

