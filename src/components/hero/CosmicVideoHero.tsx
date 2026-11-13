'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStoreStatusStore } from '@/store/useStoreStatusStore';
import { useAuthStore } from '@/store/useAuthStore';
import WeekendCountdownTimer from '@/components/common/WeekendCountdownTimer';
import {
  Sparkles,
  ArrowRight,
  Search,
  Tag,
  Clock,
  ShieldCheck,
  Zap,
  User,
} from 'lucide-react';

export default function CosmicVideoHero() {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState('');
  const { status } = useStoreStatusStore();
  const { isAuthenticated } = useAuthStore();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearch.trim()) return;
    router.push(`/products?search=${encodeURIComponent(heroSearch.trim())}`);
  };

  return (
    <section className="relative w-full min-h-[90vh] lg:min-h-[94vh] flex items-center justify-center overflow-hidden bg-[#080808] text-white">
      {/* 1. Background Video Layer With Dark Fiery Overlays */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105 transform motion-safe:transition-transform duration-1000 opacity-80"
          src="/videos/hero-space.mp4"
        />

        {/* Ambient Dark Charcoal Overlays */}
        <div className="absolute inset-0 bg-[#080808]/75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-[#080808]/90" />
      </div>

      {/* 2. Fiery Ambient Gradient Lighting Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] bg-gradient-to-tr from-[#FF6A00]/20 to-[#FF2D16]/15 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-glow" />
      <div className="absolute -bottom-24 right-10 w-96 h-96 bg-[#FF6A00]/15 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/3 -left-24 w-80 h-80 bg-[#FF2D16]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* 3. Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col items-center text-center space-y-8">
        {/* Floating Capsule Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#151515]/80 border border-[#FF6A00]/30 backdrop-blur-xl text-neutral-200 text-xs sm:text-sm font-semibold shadow-lg shadow-[#FF6A00]/10">
          <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping" />
          <Zap className="w-4 h-4 text-[#FF8800]" />
          <span>CampusMart • Express Delivery</span>
        </div>

        {/* Main Hero Headline */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] drop-shadow-2xl">
            Power Your Campus Life With{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6A00] via-[#FFA040] to-[#FF2D16]">
              Instant Delivery
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-neutral-300 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-md">
            Textbooks, calculators, Apple & Samsung tech, dorm living essentials, study gear, and official university merch. Delivered directly to your hostel.
          </p>
        </div>

        {/* Two Primary Access Options: 1. Login or Create Acc | 2. Admin Login */}
        {!isAuthenticated && (
          <div className="w-full max-w-lg mx-auto pt-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Choose Access Option
            </div>
            <div className="p-1.5 rounded-2xl bg-[#121212]/90 border border-white/15 backdrop-blur-2xl shadow-2xl grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#FF6A00]/25 transition flex items-center justify-center gap-2 group"
              >
                <User className="w-4 h-4" />
                <span>Login or Create Acc</span>
              </Link>

              <Link
                href="/admin/login"
                className="py-3 px-3 sm:px-4 rounded-xl bg-[#181818] hover:bg-[#202020] text-white border border-white/10 hover:border-amber-400/40 font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 group"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admin Login</span>
              </Link>
            </div>
          </div>
        )}

        {/* Embedded Interactive Search Glass Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-2xl relative group"
        >
          <div className="relative flex items-center rounded-2xl bg-[#121212]/90 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/80 p-1.5 focus-within:border-[#FF6A00] focus-within:ring-4 focus-within:ring-[#FF6A00]/20 transition-all">
            <Search className="w-5 h-5 text-neutral-400 ml-3.5 shrink-0 group-focus-within:text-[#FF8800] transition" />
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder="Search scientific calculators, laptops, lab coats, hoodies, coffee..."
              className="w-full px-3 py-2.5 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] via-[#FF8800] to-[#FF2D16] hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-md shadow-[#FF6A00]/30 transition transform hover:scale-105 active:scale-95 shrink-0"
            >
              Explore
            </button>
          </div>
        </form>

        {/* Weekday Status Callout Pill */}
        {status && !status.isOpen ? (
          <div className="px-5 py-2.5 rounded-2xl bg-[#181105]/90 border border-[#FF8800]/40 backdrop-blur-xl text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF8800] shrink-0" />
              <span className="font-semibold">Weekend Browsing Active: Orders resume Monday!</span>
            </div>
            {status.nextOpenAt && (
              <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full text-xs font-mono font-bold">
                <span className="text-[#FF8800]">Opens in:</span>
                <WeekendCountdownTimer targetDateString={status.nextOpenAt} compact />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3.5 text-xs font-medium text-neutral-300">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121212]/80 border border-white/10 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-[#FF8800]" />
              <span>Campus Express Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121212]/80 border border-white/10 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121212]/80 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FFA040]" />
              <span>Free Delivery Above ₹99</span>
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            href="/products"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6A00] via-[#FF8800] to-[#FF2D16] hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-[#FF6A00]/30 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/products?sort=discount"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#151515]/90 hover:bg-[#1E1E1E] text-white border border-white/15 backdrop-blur-xl font-bold text-sm hover:border-[#FF6A00]/40 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4 text-[#FF8800]" />
            <span>Top Student Deals</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
