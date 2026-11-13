'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import OrderingStatusBadge from '../common/OrderingStatusBadge';
import CampusMartMark from '../common/CampusMartMark';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Package,
  Layers,
  ChevronDown,
  Sparkles,
  Zap,
  BellRing,
} from 'lucide-react';
import { Product } from '@/types';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((s) => s.getCartCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    setHasMounted(true);
    checkAuth();
  }, [checkAuth]);

  // Autocomplete fetch on search input
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.products || []);
        }
      } catch (err) {
        // ignore
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Hide on standalone login / admin login
  if (pathname === '/login' || pathname === '/admin/login') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-[#0D0D0D]/85 backdrop-blur-2xl border-b border-white/[0.08] text-white transition-colors">
      {/* Top Subtle Amber Ambient Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#FF6A00]/70 to-[#FF2D16]/70" />

      {/* Main Top Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Logo */}
          <Link href="/" aria-label="CampusMart home" className="flex items-center gap-3 shrink-0 group">
            <CampusMartMark
              size={48}
              className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 drop-shadow-lg transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6A00] via-[#FFA040] to-[#FF2D16]">Mart</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800] uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium hidden sm:block -mt-0.5">
                University Campus Marketplace
              </span>
            </div>
          </Link>

          {/* Weekday ordering indicator badge */}
          <OrderingStatusBadge />

          {/* Global Search Bar */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search electronics, textbooks, calculators, dorm essentials..."
                className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-white/10 bg-[#151515]/90 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] transition backdrop-blur-md"
              />
              <Search className="w-4 h-4 text-[#FF8800] absolute left-3.5 top-3.5" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white text-xs font-bold transition shadow-md shadow-[#FF6A00]/25 active:scale-95"
              >
                Find
              </button>
            </form>

            {/* Autocomplete Popup */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                <div className="p-2 border-b border-white/10 flex items-center justify-between text-xs text-neutral-400 px-3">
                  <span className="font-semibold text-neutral-200">Suggested Products</span>
                  <span>{suggestions.length} matches</span>
                </div>
                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {suggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/products/${item.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 p-3 hover:bg-white/[0.04] transition"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-11 h-11 rounded-lg object-cover bg-neutral-900 shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-200 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-[#FF8800]">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] line-through text-neutral-500">
                            ₹{item.mrp.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/products?search=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setShowSuggestions(false)}
                  className="block text-center py-2.5 text-xs font-bold text-[#FF6A00] bg-[#0A0A0A] hover:bg-neutral-900 transition hover:underline"
                >
                  View all results for &quot;{searchQuery}&quot; &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Price Drop & Order Notifications */}
            <NotificationBell />

            {/* Wishlist */}
            <div className="relative">
              <Link
                href="/wishlist"
                className="p-2 sm:p-2.5 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.06] transition flex items-center justify-center border border-transparent hover:border-white/10"
                title="Wishlist"
              >
                <Heart className="w-5 h-5 hover:text-[#FF2D16] transition-colors" />
              </Link>
              {hasMounted && wishlistCount > 0 && (
                <span className="pointer-events-none absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF2D16] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md shadow-[#FF2D16]/50">
                  {wishlistCount}
                </span>
              )}
            </div>

            {/* Cart with Fiery Orange Glow Badge */}
            <Link
              id="header-cart-icon"
              href="/cart"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-neutral-200 hover:border-[#FF6A00]/40 hover:bg-[#202020] transition relative group shadow-sm"
            >
              <ShoppingCart className="w-5 h-5 text-[#FF6A00] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">Cart</span>
              <span
                className={`w-5 h-5 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold items-center justify-center shadow-md shadow-[#FF6A00]/40 ${
                  hasMounted && cartCount > 0 ? 'inline-flex' : 'hidden'
                }`}
              >
                {hasMounted ? cartCount : 0}
              </span>
            </Link>

            {/* User Account / Dropdown */}
            <div ref={userDropdownRef} className="relative min-w-[70px] flex justify-end" suppressHydrationWarning>
              {hasMounted && isAuthenticated && user ? (
                (() => {
                  const userCleanName =
                    user?.name && !user.name.toLowerCase().includes('google')
                      ? user.name
                      : user?.email?.toLowerCase().includes('janethlokineni')
                      ? 'Janeth Lokineni'
                      : user?.email
                      ? user.email.split('@')[0].replace(/[\._\-0-9]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                      : 'User';

                  return (
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white transition"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold flex items-center justify-center shadow-inner">
                        {userCleanName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold max-w-[85px] truncate hidden md:inline">
                        {userCleanName.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
                    </button>
                  );
                })()
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white text-xs font-bold transition shadow-md shadow-[#FF6A00]/25 border border-white/10 active:scale-95"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* User Dropdown Menu */}
              {userDropdownOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#121212]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                  <div className="p-3 bg-[#0A0A0A]/80 border-b border-white/10">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.name && !user.name.toLowerCase().includes('google')
                        ? user.name
                        : user?.email?.toLowerCase().includes('janethlokineni')
                        ? 'Janeth Lokineni'
                        : user.name}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {user.email}
                    </p>
                    {user.role === 'admin' && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800] text-[10px] font-bold">
                        Store Admin
                      </span>
                    )}
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-white/[0.06] transition"
                    >
                      <UserIcon className="w-4 h-4 text-[#FF8800]" />
                      <span>My Profile & Addresses</span>
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-white/[0.06] transition"
                    >
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span>Order History & Tracking</span>
                    </Link>

                    <Link
                      href="/account/alerts"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-white/[0.06] transition"
                    >
                      <BellRing className="w-4 h-4 text-[#FF8800]" />
                      <span>My Price Alerts</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#FF8800] hover:bg-[#FF6A00]/10 transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#FF8800]" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                        router.push('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-neutral-300 md:hidden hover:bg-white/10"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category Strip Bar (Dark Charcoal Style) */}
      <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/[0.05] overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6 py-2.5 text-xs font-semibold whitespace-nowrap">
          <div className="flex items-center gap-6">
            <Link
              href="/products"
              className="text-white hover:text-[#FF8800] transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>All Products</span>
            </Link>

            <Link
              href="/products?category=mobiles"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Mobiles & Tablets
            </Link>

            <Link
              href="/products?category=laptops"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Laptops & Computers
            </Link>

            <Link
              href="/products?category=audio"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Audio & Wearables
            </Link>

            <Link
              href="/products?category=clothing"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Fashion & Footwear
            </Link>

            <Link
              href="/products?category=home-kitchen"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Home & Kitchen
            </Link>

            <Link
              href="/products?category=beauty-grooming"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Beauty & Grooming
            </Link>

            <Link
              href="/products?category=groceries"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Daily Groceries
            </Link>

            <Link
              href="/products?category=books"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Books & Reference
            </Link>

            <Link
              href="/products?category=stationery"
              className="text-neutral-400 hover:text-[#FF8800] transition"
            >
              Stationery & Tools
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-neutral-400 font-normal">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-ping" />
              <Zap className="w-3.5 h-3.5 text-[#FF8800]" />
              <span>Campus Delivery</span>
            </span>
            <span>&bull;</span>
            <span className="text-[#FF8800] font-semibold">Free Delivery &gt; ₹99</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D0D0D] border-b border-white/10 p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#151515] text-white text-sm focus:outline-none focus:border-[#FF6A00]"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#1A1A1A] text-neutral-200 hover:bg-[#222222]"
            >
              All Categories
            </Link>
            <Link
              href="/products?sort=discount"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800]"
            >
              🔥 Deals of the Day
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#1A1A1A] text-neutral-200 hover:bg-[#222222]"
            >
              Track Orders
            </Link>
            <Link
              href="/account/alerts"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#1A1A1A] text-neutral-200 hover:bg-[#222222]"
            >
              My Price Alerts
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#1A1A1A] text-neutral-200 hover:bg-[#222222]"
            >
              Wishlist {hasMounted && wishlistCount > 0 ? `(${wishlistCount})` : ''}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
