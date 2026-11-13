'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import { Heart, Trash2, ShoppingCart, ArrowRight, BellRing } from 'lucide-react';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const { autoEnableOnWishlist, setAutoEnableOnWishlist } = useAlertsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center animate-pulse">
          <Heart className="w-8 h-8" />
        </div>
        <p className="text-xs text-slate-400">Loading your campus wishlist...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Your Campus Wishlist is Empty</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
          Tap the heart icon on any textbooks, dorm essentials, or campus gear to save them for later.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Campus Wishlist</h1>
          <p className="text-xs text-gray-500">{items.length} items saved for study or hostel living</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="inline-flex items-center gap-2 text-xs text-neutral-300 bg-[#141414] border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer">
            <BellRing className="w-3.5 h-3.5 text-[#FF8800]" />
            <span>Auto price alerts on wishlist</span>
            <input
              type="checkbox"
              checked={autoEnableOnWishlist}
              onChange={(e) => setAutoEnableOnWishlist(e.target.checked)}
              className="accent-[#FF6A00]"
            />
          </label>
          <Link
            href="/account/alerts"
            className="text-xs font-bold text-[#FF8800] hover:underline"
          >
            My Alerts &rarr;
          </Link>
          <button
            onClick={clearWishlist}
            className="text-xs text-rose-500 font-bold hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {items.map((prod) => (
          <div
            key={prod.id}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col justify-between shadow-sm hover:shadow-xl transition"
          >
            <div>
              <div className="relative pt-[80%] rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-900 mb-3">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition"
                />
                <button
                  onClick={() => removeItem(prod.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-rose-500 hover:bg-white shadow-md transition"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                {prod.brand}
              </span>
              <Link href={`/products/${prod.slug}`}>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 hover:underline">
                  {prod.name}
                </h3>
              </Link>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-gray-900 dark:text-white">
                  ₹{prod.price}
                </span>
                {prod.mrp > prod.price && (
                  <span className="text-xs text-gray-400 line-through">₹{prod.mrp}</span>
                )}
              </div>

              <button
                onClick={() => {
                  addItem(prod, 1);
                  removeItem(prod.id);
                }}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Move to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

