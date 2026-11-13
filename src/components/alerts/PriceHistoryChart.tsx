'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { ProductPriceHistorySummary } from '@/types';

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number;
  compact?: boolean;
}

export default function PriceHistoryChart({
  productId,
  currentPrice,
  compact = false,
}: PriceHistoryChartProps) {
  const [days, setDays] = useState<30 | 90>(30);
  const [summary, setSummary] = useState<ProductPriceHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(productId)}/price-history?days=${days}`
      );
      const data = (await res.json()) as {
        success?: boolean;
        history?: ProductPriceHistorySummary;
        error?: string;
      };
      if (!res.ok || !data.success || !data.history) {
        setError(data.error || 'Could not load price history.');
        return;
      }
      setSummary(data.history);
    } catch {
      setError('Network error while loading price trend.');
    } finally {
      setLoading(false);
    }
  }, [productId, days]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, currentPrice]);

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] flex items-center justify-center gap-2 text-xs text-neutral-400 h-44">
        <Loader2 className="w-4 h-4 text-[#FF6A00] animate-spin" />
        <span>Loading {days}-day price history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void loadHistory()}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 font-semibold inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!summary || summary.points.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] text-xs text-neutral-400 text-center">
        No price changes recorded yet for this product.
      </div>
    );
  }

  const points = summary.points;
  const prices = points.map((p) => p.price);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const padding = Math.max(1, Math.round((rawMax - rawMin) * 0.15) || Math.round(rawMax * 0.05) || 1);
  const minVal = Math.max(0, rawMin - padding);
  const maxVal = rawMax + padding;
  const range = Math.max(1, maxVal - minVal);

  const width = 440;
  const height = compact ? 110 : 140;
  const padX = 16;
  const padY = 14;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = points.map((pt, idx) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (idx / (points.length - 1)) * innerW;
    const y = padY + (1 - (pt.price - minVal) / range) * innerH;
    return { x, y, pt };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(height - padY).toFixed(
          1
        )} L ${coords[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`
      : '';

  const activePoint =
    hoveredIdx !== null && coords[hoveredIdx]
      ? coords[hoveredIdx].pt
      : points[points.length - 1];

  return (
    <div className="p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] space-y-3">
      {/* Header & Range Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#FF8800]" />
              <span>Price History</span>
            </h4>
            {summary.isLowestIn30Days && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Lowest price in 30 days
              </span>
            )}
            {summary.hasRecentDrop && summary.dropPercentFromPeak > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[#FFA040] text-[10px] font-bold">
                Price dropped {summary.dropPercentFromPeak}% OFF
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400">
            {new Date(activePoint.changedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            :{' '}
            <span className="font-mono font-bold text-white">
              ₹{activePoint.price.toLocaleString('en-IN')}
            </span>
          </p>
        </div>

        <div
          role="group"
          aria-label="Price history date range"
          className="inline-flex rounded-xl bg-[#1A1A1A] p-0.5 border border-white/10 text-[11px] font-bold"
        >
          {([30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setHoveredIdx(null);
                setDays(d);
              }}
              aria-pressed={days === d}
              className={`px-2.5 py-1 rounded-lg transition ${
                days === d
                  ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* SVG Mini Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Price trend over the last ${days} days from ₹${rawMin} to ₹${rawMax}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id={`priceFill-${productId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF6A00" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Subtle baseline grid */}
          <line
            x1={padX}
            y1={padY}
            x2={width - padX}
            y2={padY}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={height - padY}
            x2={width - padX}
            y2={height - padY}
            stroke="rgba(255,255,255,0.08)"
          />

          <path d={areaPath} fill={`url(#priceFill-${productId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="#FF8800"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coords.map((c, idx) => {
            const isSelected = hoveredIdx === idx || (hoveredIdx === null && idx === coords.length - 1);
            return (
              <g key={c.pt.id}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? 5 : 3.2}
                  fill={isSelected ? '#FF6A00' : '#FFA040'}
                  stroke="#080808"
                  strokeWidth="1.5"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={12}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`₹${c.pt.price} on ${new Date(c.pt.changedAt).toLocaleDateString('en-IN')}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  className="cursor-pointer outline-none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Min / Max / Current Footer */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
        <div>
          <span className="text-neutral-500 block">{days}D Low</span>
          <span className="font-mono font-bold text-emerald-400">
            ₹{(days === 30 ? summary.minPrice30d : summary.minPrice90d).toLocaleString('en-IN')}
          </span>
        </div>
        <div>
          <span className="text-neutral-500 block">{days}D High</span>
          <span className="font-mono font-bold text-neutral-300">
            ₹{(days === 30 ? summary.maxPrice30d : summary.maxPrice90d).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-neutral-500 block">Current</span>
          <span className="font-mono font-bold text-[#FF8800]">
            ₹{summary.currentPrice.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}

