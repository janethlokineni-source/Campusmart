'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BellOff,
  BellRing,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  LogIn,
  RotateCcw,
  Sparkles,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertsStore } from '@/store/useAlertsStore';

export default function MyPriceAlertsPage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, checkAuth } = useAuthStore();
  const {
    alerts,
    loadingAlerts,
    alertsError,
    autoEnableOnWishlist,
    setAutoEnableOnWishlist,
    fetchAlerts,
    updateAlert,
    removeAlert,
  } = useAlertsStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchAlerts(true);
    }
  }, [isAuthenticated, fetchAlerts]);

  const handleSaveTarget = async (alertId: string) => {
    setActionMsg(null);
    let parsedTarget: number | null = null;
    if (targetInput.trim().length > 0) {
      const n = Number(targetInput.trim());
      if (!Number.isFinite(n) || n <= 0) {
        setActionMsg('Please enter a valid target price greater than ₹0.');
        return;
      }
      parsedTarget = Math.round(n);
    }

    setSavingId(alertId);
    const res = await updateAlert(alertId, { targetPrice: parsedTarget });
    setSavingId(null);
    if (res.ok) {
      setEditingId(null);
    } else if (res.error) {
      setActionMsg(res.error);
    }
  };

  const handleToggleActive = async (alertId: string, currentActive: boolean) => {
    setSavingId(alertId);
    await updateAlert(alertId, { active: !currentActive });
    setSavingId(null);
  };

  const handleDelete = async (alertId: string) => {
    setSavingId(alertId);
    await removeAlert(alertId);
    setSavingId(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-[60vh] bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] bg-[#080808] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800] flex items-center justify-center">
          <BellRing className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">Sign In to View Price Alerts</h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
          Track price drops on textbooks, calculators, dorm gear, and gadgets 7 days a week.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold shadow-lg shadow-[#FF6A00]/25"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to CampusMart</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="space-y-1">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Account</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <BellRing className="w-6 h-6 text-[#FF8800]" />
              <span>My Price Drop Alerts</span>
            </h1>
            <p className="text-xs text-neutral-400">
              Active 7 days a week &bull; Get in-app &amp; email alerts whenever watched items drop
            </p>
          </div>

          <label className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs font-semibold text-neutral-200 cursor-pointer shrink-0">
            <span>Auto-enable when wishlisting</span>
            <input
              type="checkbox"
              checked={autoEnableOnWishlist}
              onChange={(e) => setAutoEnableOnWishlist(e.target.checked)}
              aria-label="Auto-enable price alerts when wishlisting products"
              className="accent-[#FF6A00] w-4 h-4"
            />
          </label>
        </div>

        {actionMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between">
            <span>{actionMsg}</span>
            <button
              type="button"
              onClick={() => setActionMsg(null)}
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading / Error / Empty / List States */}
        {loadingAlerts && alerts.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-neutral-400">
            <Loader2 className="w-7 h-7 text-[#FF6A00] animate-spin" />
            <p className="text-xs">Loading your watched CampusMart items...</p>
          </div>
        ) : alertsError ? (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-bold text-white">{alertsError}</p>
            <button
              type="button"
              onClick={() => void fetchAlerts(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 px-4 rounded-3xl bg-[#121212] border border-white/[0.08] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800] mx-auto flex items-center justify-center">
              <BellRing className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">No Watched Products Yet</h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Tap the bell icon on any product card or product page — or save an item to your wishlist — to watch its price.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold"
            >
              <span>Browse Campus Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const prod = alert.product;
              const currentPrice = prod?.price ?? alert.priceWhenAdded;
              const dropped = alert.priceDiff > 0;
              const isEditing = editingId === alert.id;
              const isBusy = savingId === alert.id;

              return (
                <div
                  key={alert.id}
                  className="p-4 sm:p-5 rounded-3xl bg-[#121212]/90 border border-white/[0.08] hover:border-white/20 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={prod?.images[0] || '/placeholder.png'}
                      alt={prod?.name || 'Product'}
                      className="w-20 h-20 rounded-2xl object-cover bg-neutral-900 border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-[#FF8800]">
                          {prod?.brand || 'CampusMart'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            alert.active
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                              : 'bg-neutral-800 border border-white/10 text-neutral-400'
                          }`}
                        >
                          {alert.active ? 'Active' : 'Paused'}
                        </span>
                        {alert.isLowestIn30Days && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Lowest 30d
                          </span>
                        )}
                        {dropped && alert.priceDiffPercent > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[#FFA040] text-[10px] font-bold inline-flex items-center gap-1">
                            <TrendingDown className="w-2.5 h-2.5" />
                            Dropped {alert.priceDiffPercent}% (Save ₹{alert.priceDiff.toLocaleString('en-IN')})
                          </span>
                        )}
                      </div>

                      {prod ? (
                        <Link
                          href={`/products/${prod.slug}`}
                          className="text-sm font-bold text-white hover:text-[#FF8800] transition line-clamp-2 inline-flex items-center gap-1.5"
                        >
                          <span>{prod.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        </Link>
                      ) : (
                        <p className="text-sm font-bold text-neutral-400">
                          Unavailable Product ({alert.productId})
                        </p>
                      )}

                      {/* Prices Breakdown */}
                      <div className="flex items-center gap-4 flex-wrap text-xs">
                        <div>
                          <span className="text-neutral-500">Current: </span>
                          <span className="font-mono font-black text-white">
                            ₹{currentPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">When added: </span>
                          <span className="font-mono text-neutral-300">
                            ₹{alert.priceWhenAdded.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Target: </span>
                          {isEditing ? (
                            <span className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value)}
                                placeholder="Any drop"
                                aria-label="Target price in rupees"
                                className="w-24 px-2 py-1 rounded-lg bg-[#1A1A1A] border border-[#FF6A00]/50 text-xs text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleSaveTarget(alert.id)}
                                aria-label="Save target price"
                                className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                aria-label="Cancel edit"
                                className="p-1 rounded-lg bg-white/10 text-neutral-300 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-[#FF8800]">
                              {alert.targetPrice !== undefined
                                ? `≤ ₹${alert.targetPrice.toLocaleString('en-IN')}`
                                : 'Any drop'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setEditingId(alert.id);
                        setTargetInput(
                          alert.targetPrice !== undefined ? String(alert.targetPrice) : ''
                        );
                      }}
                      aria-label={`Edit target price for ${prod?.name || alert.productId}`}
                      className="px-3 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] border border-white/10 text-xs font-semibold text-neutral-200 inline-flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FF8800]" />
                      <span>Edit Target</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleToggleActive(alert.id, alert.active)}
                      aria-label={alert.active ? 'Pause alert' : 'Resume alert'}
                      className="px-3 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] border border-white/10 text-xs font-semibold text-neutral-200 inline-flex items-center gap-1.5 transition"
                    >
                      {alert.active ? (
                        <>
                          <BellOff className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Resume</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleDelete(alert.id)}
                      aria-label={`Remove alert for ${prod?.name || alert.productId}`}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-600/30 border border-rose-500/25 text-rose-300 transition"
                      title="Remove Alert"
                    >
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

