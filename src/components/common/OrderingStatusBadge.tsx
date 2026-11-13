'use client';

import React, { useEffect } from 'react';
import { useStoreStatusStore } from '@/store/useStoreStatusStore';
import { Calendar } from 'lucide-react';

export default function OrderingStatusBadge() {
  const { status, fetchStatus } = useStoreStatusStore();

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!status) return null;

  if (status.isOpen) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121212] border border-emerald-500/30 text-[11px] font-medium text-emerald-300 shadow-sm transition hover:scale-105">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Campus Delivery Live</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181105] border border-[#FF8800]/40 text-[11px] font-medium text-amber-300 shadow-sm transition">
      <Calendar className="w-3 h-3 text-[#FF8800]" />
      <span>Orders Resume Monday</span>
    </div>
  );
}
