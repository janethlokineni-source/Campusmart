'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import PriceAlertButton from '@/components/alerts/PriceAlertButton';
import { Heart, Star, ShoppingCart, Check, Zap, TrendingDown } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    alerts,
    enableAlert,
    autoEnableOnWishlist,
    priceBadges,
    fetchPriceBadges,
  } = useAlertsStore();
  const isWishlisted = isInWishlist(product.id);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    void fetchPriceBadges();
  }, [fetchPriceBadges]);

  const badge = priceBadges[product.id];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const adding = !isWishlisted;
    toggleItem(product);
    if (
      adding &&
      isAuthenticated &&
      autoEnableOnWishlist &&
      !alerts.some((a) => a.productId === product.id)
    ) {
      void enableAlert(product.id);
    }
  };

  return (
    <div
      className={`group relative bg-[#121212]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden hover:border-[#FF6A00]/40 hover:shadow-2xl hover:shadow-[#FF6A00]/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ${className}`}
    >
      {/* Top Left Price Drop Badge */}
      {badge && (badge.hasRecentDrop || badge.isLowestIn30Days) && (
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none flex flex-col gap-1">
          {badge.isLowestIn30Days ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-md">
              Lowest 30d
            </span>
          ) : badge.hasRecentDrop && badge.dropPercent > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-[#FF6A00]/90 backdrop-blur-md text-white text-[10px] font-bold shadow-md inline-flex items-center gap-0.5">
              <TrendingDown className="w-2.5 h-2.5" />
              -{badge.dropPercent}%
            </span>
          ) : null}
        </div>
      )}

      {/* Top Action Bar (Price Alert + Wishlist) */}
      <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none flex items-center gap-1.5">
        <PriceAlertButton product={product} variant="icon" />
        <button
          onClick={handleWishlist}
          className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-md pointer-events-auto border ${
            isWishlisted
              ? 'bg-[#FF2D16] text-white border-[#FF2D16]'
              : 'bg-[#0D0D0D]/80 border-white/10 text-neutral-300 hover:text-[#FF2D16] hover:border-[#FF2D16]/40 hover:bg-[#181818]'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Image Link */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative pt-[78%] bg-[#080808] overflow-hidden"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            if (product.images[1]) {
              (e.currentTarget as HTMLImageElement).src = product.images[1];
            }
          }}
        />
        {/* Subtle dark gradient overlay at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
      </Link>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[#FF8800] text-[10px]">
              {product.brand}
            </span>
            {product.rating > 0 && (
              <div className="flex items-center gap-1 bg-[#0A0A0A] border border-white/10 text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
                <span>{product.rating}</span>
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span className="text-neutral-500 font-normal">({product.reviewCount})</span>
              </div>
            )}
          </div>

          <Link href={`/products/${product.slug}`} className="block group-hover:text-[#FFA040] transition">
            <h3 className="text-sm font-semibold text-neutral-100 line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-white">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-neutral-500 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {product.discountPercent > 0 && (
                <span className="text-[11px] font-bold text-[#FF6A00]">
                  {product.discountPercent}% OFF
                </span>
              )}
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> Hostel Drop
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : product.stock === 0
                ? 'bg-[#1C1C1C] text-neutral-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white shadow-[#FF6A00]/25 hover:scale-105'
            }`}
            title={product.stock === 0 ? 'Out of Stock' : 'Add item to campus cart'}
            aria-label={product.stock === 0 ? 'Out of Stock' : 'Add item to cart'}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 animate-bounce" />
                <span>Added!</span>
              </>
            ) : product.stock === 0 ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden xs:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
