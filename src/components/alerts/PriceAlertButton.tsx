'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, BellOff, BellRing, Check, Loader2, LogIn, X } from 'lucide-react';
import { Product } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertsStore } from '@/store/useAlertsStore';

interface PriceAlertButtonProps {
  product: Product;
  variant?: 'icon' | 'full';
}

export default function PriceAlertButton({
  product,
  variant = 'icon',
}: PriceAlertButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { alerts, fetchAlerts, enableAlert, updateAlert, removeAlert } =
    useAlertsStore();

  const [showPopover, setShowPopover] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchAlerts();
    }
  }, [isAuthenticated, fetchAlerts]);

  useEffect(() => {
    if (!showPopover) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPopover(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showPopover]);

  const existingAlert = alerts.find((a) => a.productId === product.id);
  const isActive = Boolean(existingAlert?.active);

  const openEditor = () => {
    setErrorMsg(null);
    setFeedback(null);
    setTargetInput(
      existingAlert?.targetPrice !== undefined
        ? String(existingAlert.targetPrice)
        : ''
    );
    setShowPopover((prev) => !prev);
  };

  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setErrorMsg(null);
    setFeedback(null);

    let parsedTarget: number | undefined;
    if (targetInput.trim().length > 0) {
      const n = Number(targetInput.trim());
      if (!Number.isFinite(n) || n <= 0) {
        setErrorMsg('Enter a valid target price above ₹0.');
        return;
      }
      parsedTarget = Math.round(n);
    }

    setSubmitting(true);
    try {
      if (existingAlert) {
        const res = await updateAlert(existingAlert.id, {
          active: true,
          targetPrice: parsedTarget ?? null,
        });
        if (!res.ok) {
          setErrorMsg(res.error || 'Failed to update alert.');
          return;
        }
      } else {
        const res = await enableAlert(product.id, parsedTarget);
        if (!res.ok) {
          setErrorMsg(res.error || 'Failed to enable alert.');
          return;
        }
      }
      setFeedback('Alert saved!');
      setTimeout(() => {
        setFeedback(null);
        setShowPopover(false);
      }, 900);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTurnOffOrRemove = async () => {
    if (!existingAlert || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const ok = await removeAlert(existingAlert.id);
      if (!ok) {
        setErrorMsg('Could not remove alert.');
      } else {
        setShowPopover(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <div
        ref={containerRef}
        className="relative pointer-events-auto"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          onClick={openEditor}
          aria-label={
            isActive
              ? `Price alert active for ${product.name}`
              : `Notify me on price drop for ${product.name}`
          }
          title={isActive ? 'Price alert active (click to edit)' : 'Notify me on price drop'}
          className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-md border ${
            isActive
              ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-[#FF6A00]/40'
              : 'bg-[#0D0D0D]/80 border-white/10 text-neutral-300 hover:text-[#FF8800] hover:border-[#FF6A00]/40 hover:bg-[#181818]'
          }`}
        >
          {isActive ? (
            <BellRing className="w-3.5 h-3.5" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
        </button>

        {showPopover && (
          <div
            role="dialog"
            aria-label="Price Drop Alert Settings"
            className="absolute right-0 top-full mt-2 w-64 p-3.5 rounded-2xl bg-[#121212] border border-white/15 shadow-2xl z-40 space-y-2.5 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-[#FF8800]" />
                Price Drop Alert
              </span>
              <button
                type="button"
                onClick={() => setShowPopover(false)}
                aria-label="Close alert popup"
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Log in to get notified by email &amp; in-app alerts when this price drops.
                </p>
                <Link
                  href="/login"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 hover:brightness-110 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In for Alerts</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSaveAlert} className="space-y-2">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                    Alert me when it goes below ₹ (optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder={`e.g. ${Math.max(1, Math.round(product.price * 0.9))}`}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                {errorMsg && (
                  <p className="text-[10px] text-rose-400 font-medium">{errorMsg}</p>
                )}
                {feedback && (
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {feedback}
                  </p>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>{isActive ? 'Update Alert' : 'Notify Me'}</span>
                    )}
                  </button>
                  {existingAlert && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleTurnOffOrRemove()}
                      aria-label="Turn off alert"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-300 border border-white/10"
                      title="Remove Alert"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full inline panel for Product Detail Page
  return (
    <div
      ref={containerRef}
      className="p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] space-y-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border ${
              isActive
                ? 'bg-[#FF6A00]/20 border-[#FF6A00]/40 text-[#FF8800]'
                : 'bg-white/5 border-white/10 text-neutral-300'
            }`}
          >
            {isActive ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              {isActive ? 'Price Drop Alert Active' : 'Notify Me on Price Drop'}
            </p>
            <p className="text-[11px] text-neutral-400">
              {existingAlert?.targetPrice
                ? `Target price: ₹${existingAlert.targetPrice.toLocaleString('en-IN')}`
                : 'Works 7 days a week via In-App & Email'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openEditor}
          aria-expanded={showPopover}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
            isActive
              ? 'bg-[#FF6A00]/15 border-[#FF6A00]/40 text-[#FFA040] hover:bg-[#FF6A00]/25'
              : 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
          }`}
        >
          {showPopover ? 'Close' : isActive ? 'Edit Alert' : 'Set Price Alert'}
        </button>
      </div>

      {showPopover && (
        <div className="pt-2 border-t border-white/[0.08]">
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181818] p-3 rounded-xl border border-white/10">
              <p className="text-xs text-neutral-300">
                Sign in with your student account to track price drops on this item.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSaveAlert} className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label
                    htmlFor={`target-price-${product.id}`}
                    className="block text-[11px] font-semibold text-neutral-400 mb-1"
                  >
                    Alert me when it goes below ₹ (leave blank for any drop)
                  </label>
                  <input
                    id={`target-price-${product.id}`}
                    type="number"
                    min={1}
                    placeholder={`Current ₹${product.price} — e.g. ₹${Math.max(1, Math.round(product.price * 0.9))}`}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isActive ? 'Save Changes' : 'Enable Alert'}</span>
                  </button>
                  {existingAlert && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleTurnOffOrRemove()}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-neutral-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      <span>Turn Off</span>
                    </button>
                  )}
                </div>
              </div>
              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
              {feedback && (
                <p className="text-xs text-emerald-400 font-semibold">{feedback}</p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

