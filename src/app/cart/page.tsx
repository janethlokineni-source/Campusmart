'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useStoreStatusStore } from '@/store/useStoreStatusStore';
import WeekendCountdownTimer from '@/components/common/WeekendCountdownTimer';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Tag,
  Clock,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const {
    items,
    savedForLater,
    updateQuantity,
    removeItem,
    moveToSavedForLater,
    moveToCart,
    removeFromSavedForLater,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getMrpTotal,
    getTotalDiscount,
    getDeliveryFee,
    getPlatformFee,
    getFinalTotal,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { status } = useStoreStatusStore();
  const isStoreOpen = status ? status.isOpen : true;

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getSubtotal();
  const mrpTotal = getMrpTotal();
  const discount = getTotalDiscount();
  const deliveryFee = getDeliveryFee();
  const platformFee = getPlatformFee();
  const finalTotal = getFinalTotal();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        applyCoupon(data.coupon, data.discount);
        setCouponInput('');
      } else {
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#FF6A00]/20 border-t-[#FF6A00] animate-spin" />
      </div>
    );
  }

  if (items.length === 0 && savedForLater.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#080808] flex flex-col items-center justify-center px-4 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-[#121212] border border-white/10 text-[#FF8800] mx-auto flex items-center justify-center shadow-xl shadow-black/60">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white">Your Campus Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          Explore scientific calculators, textbooks, tech gear, hostel dorm lighting, and campus essentials to fill your cart.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#FF6A00]/25 transition"
        >
          <span>Explore Campus Store</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100 py-8 relative overflow-hidden">
      {/* Ambient Radial Fire Glow */}
      <div className="absolute top-20 right-10 w-[30rem] h-[30rem] bg-[#FF6A00]/05 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Top Weekend Banner if closed */}
        {!isStoreOpen && status && (
          <div className="p-4 sm:p-5 rounded-3xl bg-[#181105]/95 border border-[#FF8800]/40 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FF8800]/20 text-[#FF8800] border border-[#FF8800]/30 shrink-0 mt-0.5">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-amber-300">
                      Weekend Ordering Schedule Active
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#FF8800]/20 text-[#FFA040] text-[10px] font-bold border border-[#FF8800]/30">
                      Safe Cart Storage
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                    {status.message} Your cart items and discounts are securely preserved.
                    Checkout unlocks automatically on Monday morning with priority campus delivery!
                  </p>
                </div>
              </div>

              {status.nextOpenAt && (
                <div className="bg-black/60 p-3 rounded-2xl border border-white/10 shadow-sm shrink-0 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Ordering Resumes In
                  </span>
                  <WeekendCountdownTimer targetDateString={status.nextOpenAt} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cart Title & Item Count */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Shopping Cart</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {items.reduce((sum, i) => sum + i.quantity, 0)} items in your campus bag &bull; Hostel Drop
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-[#FF8800] hover:text-[#FFA040] hover:underline flex items-center gap-1 transition"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid: Cart Items List + Order Summary Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Items */}
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-3">
              {items.map(({ product, quantity, selectedOption }) => (
                <div
                  key={product.id}
                  className="p-4 rounded-3xl bg-[#121212]/90 border border-white/[0.08] shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-[#FF6A00]/40 transition group"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 rounded-2xl object-cover bg-neutral-900 border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8800]">
                        {product.brand}
                      </span>
                      <Link href={`/products/${product.slug}`}>
                        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#FFA040] transition">
                          {product.name}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-white">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.mrp > product.price && (
                          <span className="text-xs text-neutral-500 line-through">
                            ₹{product.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#FF6A00]">
                          {product.discountPercent}% OFF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.08]">
                    {/* Quantity Counter */}
                    <div className="flex items-center border border-white/10 rounded-xl bg-[#151515]">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1.5 hover:bg-white/10 rounded-l-xl text-neutral-300 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="p-1.5 hover:bg-white/10 rounded-r-xl text-neutral-300 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-black text-white min-w-[70px] text-right font-mono">
                      ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveToSavedForLater(product.id)}
                        className="p-2 text-neutral-400 hover:text-[#FFA040] rounded-xl hover:bg-white/[0.04] transition"
                        title="Save for Later"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="p-2 text-neutral-400 hover:text-rose-400 rounded-xl hover:bg-white/[0.04] transition"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Saved for later section */}
            {savedForLater.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/[0.08] space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-[#FF8800]" />
                  <span>Saved For Later ({savedForLater.length})</span>
                </h3>
                <div className="space-y-3">
                  {savedForLater.map(({ product }) => (
                    <div
                      key={product.id}
                      className="p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover bg-neutral-900 shrink-0 border border-white/10"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">
                            {product.name}
                          </h4>
                          <span className="text-xs font-bold text-[#FF8800]">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => moveToCart(product.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold hover:brightness-110 transition shadow-sm"
                        >
                          Move to Cart
                        </button>
                        <button
                          onClick={() => removeFromSavedForLater(product.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coupon Box */}
            <div className="p-5 rounded-3xl bg-[#121212]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#FF8800]" />
                <span>Campus Discount Coupon</span>
              </h3>

              {appliedCoupon ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-emerald-300">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      You saved ₹{couponDiscount}!
                    </p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-rose-400 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. CAMPUSFIRST, HOSTEL50"
                      className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-[#181818] text-xs font-mono uppercase text-white focus:outline-none focus:border-[#FF6A00] transition placeholder-neutral-500"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold hover:brightness-110 transition shadow-sm"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-rose-400 font-medium">{couponError}</p>}
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span>Try:</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('CAMPUSFIRST')}
                      className="underline text-[#FF8800] hover:text-[#FFA040]"
                    >
                      CAMPUSFIRST
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('HOSTEL50')}
                      className="underline text-[#FF8800] hover:text-[#FFA040]"
                    >
                      HOSTEL50
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Price Breakdown Card */}
            <div className="p-6 rounded-3xl bg-[#121212]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white pb-3 border-b border-white/[0.08]">
                Price Breakdown
              </h3>

              <div className="space-y-2.5 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span className="font-mono">₹{mrpTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Product Discounts</span>
                  <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Hostel Delivery Fee</span>
                  <span className="font-mono">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase">Free</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Campus Platform Fee</span>
                  <span className="font-mono">₹{platformFee}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-black text-white">Total Amount</span>
                  <p className="text-[10px] text-neutral-400">Cash on Delivery at hostel gate</p>
                </div>
                <span className="text-2xl font-black text-white font-mono">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* CHECKOUT ACTION BUTTON */}
              {isStoreOpen ? (
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-[#FF6A00]/25 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to Campus Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#1C1C1C] text-neutral-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-white/5"
                    title="Checkout disabled on weekends. Orders resume Monday!"
                  >
                    <Clock className="w-4 h-4 text-[#FF8800]" />
                    <span>Checkout Closed (Resumes Mon)</span>
                  </button>
                  <p className="text-[11px] text-center text-amber-300 font-medium">
                    Add more items to cart anytime. Checkout opens automatically on Monday!
                  </p>
                </div>
              )}

              <div className="pt-2 text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Safe & Verified University Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
