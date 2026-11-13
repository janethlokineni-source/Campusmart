'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink, Loader2, Tag } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertsStore } from '@/store/useAlertsStore';

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    loadingNotifications,
    notificationsError,
    fetchNotifications,
    markNotificationRead,
  } = useAlertsStore();

  const [open, setOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!hasMounted || !isAuthenticated) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            void fetchNotifications();
          }
        }}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        title="Price Drop & Order Notifications"
        className="p-2 sm:p-2.5 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.06] transition flex items-center justify-center border border-transparent hover:border-white/10 relative"
      >
        <Bell className="w-5 h-5 hover:text-[#FF8800] transition-colors" />
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-[#FF6A00]/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications dropdown"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#121212]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 overflow-hidden z-50"
        >
          <div className="px-4 py-3 bg-[#0A0A0A]/90 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-white">Notifications</h3>
              <p className="text-[10px] text-neutral-400">
                {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markNotificationRead(undefined, true)}
                className="text-[11px] font-bold text-[#FF8800] hover:underline inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
            {loadingNotifications && notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="w-5 h-5 text-[#FF6A00] animate-spin" />
                <span>Checking notifications...</span>
              </div>
            ) : notificationsError ? (
              <div className="p-4 text-xs text-rose-300 text-center">
                {notificationsError}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1.5">
                <Bell className="w-7 h-7 text-neutral-600 mx-auto" />
                <p className="text-xs font-bold text-neutral-300">No notifications yet</p>
                <p className="text-[11px] text-neutral-500">
                  Enable price alerts on products to get notified when prices drop.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 transition ${
                    notif.read ? 'bg-transparent opacity-75' : 'bg-[#FF6A00]/[0.06]'
                  } hover:bg-white/[0.04]`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        notif.type === 'price_drop'
                          ? 'bg-[#FF6A00]/20 text-[#FF8800]'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#FF6A00] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-snug">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-neutral-500">
                          {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => void markNotificationRead(notif.id, false)}
                              className="text-[10px] text-neutral-400 hover:text-white font-semibold"
                            >
                              Mark read
                            </button>
                          )}
                          {notif.productSlug && (
                            <Link
                              href={`/products/${notif.productSlug}`}
                              onClick={() => {
                                if (!notif.read) void markNotificationRead(notif.id, false);
                                setOpen(false);
                              }}
                              className="text-[10px] font-bold text-[#FF8800] hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-[#0A0A0A] border-t border-white/10 text-center">
            <Link
              href="/account/alerts"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-[#FF8800] hover:underline"
            >
              Manage My Price Alerts &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

