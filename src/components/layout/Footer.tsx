'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import CampusMartMark from '../common/CampusMartMark';
import {
  ShieldCheck,
  Truck,
  Clock,
  Heart,
  Award,
  ArrowUp,
  Zap,
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (pathname === '/login' || pathname === '/admin/login') {
    return null;
  }

  return (
    <footer className="bg-[#080808] text-neutral-400 text-xs border-t border-white/[0.08] pt-14 pb-8 relative overflow-hidden">
      {/* Subtle Fiery Orange Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Value Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pb-12 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] hover:border-[#FF6A00]/30 transition group">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-[#FF6A00]/15 to-[#FF2D16]/15 border border-[#FF6A00]/25 text-[#FF6A00] shrink-0 group-hover:scale-105 transition transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Room & Hostel Delivery</p>
              <p className="text-[11px] text-neutral-400">Direct to your hostel doorstep & gate</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] hover:border-[#FF6A00]/30 transition group">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-[#FF6A00]/15 to-[#FF2D16]/15 border border-[#FF6A00]/25 text-[#FF6A00] shrink-0 group-hover:scale-105 transition transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Weekday Dispatch</p>
              <p className="text-[11px] text-neutral-400">Monday–Friday orders; Weekend cart save</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] hover:border-[#FF6A00]/30 transition group">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-[#FF6A00]/15 to-[#FF2D16]/15 border border-[#FF6A00]/25 text-[#FF6A00] shrink-0 group-hover:scale-105 transition transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Cash on Delivery</p>
              <p className="text-[11px] text-neutral-400">Inspect order items at doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] hover:border-[#FF6A00]/30 transition group">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-[#FF6A00]/15 to-[#FF2D16]/15 border border-[#FF6A00]/25 text-[#FF6A00] shrink-0 group-hover:scale-105 transition transform">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Verified Student Prices</p>
              <p className="text-[11px] text-neutral-400">Authentic Flipkart & Amazon rates</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-10">
          {/* Col 1 */}
          <div className="col-span-2">
            <Link href="/" aria-label="CampusMart home" className="flex items-center gap-2.5 mb-3">
              <CampusMartMark size={36} className="w-8 h-8 shrink-0 drop-shadow-md" />
              <span className="text-lg font-black text-white tracking-tight">
                Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6A00] to-[#FF2D16]">Mart</span>
              </span>
            </Link>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm mb-4">
              CampusMart is the dedicated university online shopping marketplace. Engineered with dark futuristic glassmorphism, dedicated campus logistics, and 100% verified Flipkart & Amazon catalog inventory.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-[#121212] border border-white/10 text-[11px] font-mono text-emerald-400">
                Server Time: Asia/Kolkata
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[11px] font-bold text-[#FF8800]">
                ⚡ Campus Delivery
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Departments</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products?category=mobiles" className="hover:text-[#FF8800] transition">
                  Mobiles & Tablets
                </Link>
              </li>
              <li>
                <Link href="/products?category=laptops" className="hover:text-[#FF8800] transition">
                  Laptops & Computers
                </Link>
              </li>
              <li>
                <Link href="/products?category=audio" className="hover:text-[#FF8800] transition">
                  Audio & Wearables
                </Link>
              </li>
              <li>
                <Link href="/products?category=clothing" className="hover:text-[#FF8800] transition">
                  Clothing & Footwear
                </Link>
              </li>
              <li>
                <Link href="/products?category=books" className="hover:text-[#FF8800] transition">
                  Books & Reference
                </Link>
              </li>
              <li>
                <Link href="/products?category=stationery" className="hover:text-[#FF8800] transition">
                  Stationery & Kits
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Hostel Delivery Zones</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>Ramanujan Hall (Block 1-4)</li>
              <li>Sarabhai Hall (Block 5-8)</li>
              <li>Kalpana Chawla Girls Hostel</li>
              <li>Central Library & Reading Hall</li>
              <li>Main Campus Gate 1 & 2</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Account & Access</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="hover:text-[#FF8800] transition">
                  Student Account
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-[#FF8800] transition">
                  Track Delivery
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-[#FF8800] transition">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-[#FF8800] hover:text-[#FFA040] hover:underline transition font-bold">
                  Admin Dashboard 🔐
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <p>© 2026 CampusMart Enterprise. All rights reserved. University Campus Life & Logistics.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#FF8800] font-medium">Weekday Dispatch: Mon–Fri</span>
            <span>&bull;</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-neutral-400 hover:text-white transition"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
