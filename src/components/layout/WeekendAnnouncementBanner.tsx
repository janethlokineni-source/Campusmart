'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStoreStatusStore } from '@/store/useStoreStatusStore';
import { useAuthStore } from '@/store/useAuthStore';
import WeekendCountdownTimer from '../common/WeekendCountdownTimer';
import { Calendar, ShoppingBag, X } from 'lucide-react';

export default function WeekendAnnouncementBanner() {
  const pathname = usePathname();
  const { status } = useStoreStatusStore();
  const { isAuthenticated } = useAuthStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (
    pathname === '/login' ||
    pathname === '/admin/login' ||
    !status ||
    status.isOpen ||
    isDismissed
  ) {
    return null;
  }

  return (
    <div className="relative z-50 bg-[#120B04]/95 border-b border-[#FF8800]/30 text-amber-200 backdrop-blur-xl shadow-lg text-xs sm:text-sm py-2 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left Notice */}
        <div className="flex items-center gap-2 text-center md:text-left">
          <div className="p-1 rounded-full bg-[#FF8800]/20 text-[#FF8800] shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#FFA040]">Weekend Ordering Notice:</span>{' '}
            <span className="text-neutral-300">{status.message}</span>
            <span className="hidden lg:inline ml-2 text-neutral-400 font-medium">
              (Items stay safely saved in your cart!)
            </span>
          </div>
        </div>

        {/* Right Countdown & Action */}
        <div className="flex items-center gap-3">
          {status.nextOpenAt && (
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 text-xs font-medium">
              <span className="text-[#FF8800]">Opens in:</span>
              <WeekendCountdownTimer targetDateString={status.nextOpenAt} compact />
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1 bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FFA040] px-2.5 py-1 rounded-full text-xs font-semibold">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart Active</span>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
