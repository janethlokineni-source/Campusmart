'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product, Category } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import CosmicVideoHero from '@/components/hero/CosmicVideoHero';
import LoginPage from '@/components/auth/LoginPage';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  Laptop,
  BookOpen,
  PenTool,
  Home as HomeIcon,
  Shirt,
  Smartphone,
  Headphones,
  ShoppingBag,
  Award,
  Zap,
  Flame,
  Loader2,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, any> = {
  mobiles: Smartphone,
  laptops: Laptop,
  audio: Headphones,
  electronics: Laptop,
  clothing: Shirt,
  'home-kitchen': HomeIcon,
  'beauty-grooming': Sparkles,
  groceries: ShoppingBag,
  stationery: PenTool,
  books: BookOpen,
  dorm: HomeIcon,
  'campus-merch': Award,
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [clothingFilter, setClothingFilter] = useState<'all' | 'streetwear' | 'formal' | 'denim' | 'ethnic' | 'active'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products?limit=100'),
          fetch('/api/categories'),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.success) setProducts(prodData.products || []);
        if (catData.success) setCategories(catData.categories || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const dealProducts = products.filter((p) => p.discountPercent >= 40).slice(0, 4);
  const allClothing = products.filter((p) => p.category === 'clothing');
  const clothingProducts = allClothing.filter((p) => {
    if (clothingFilter === 'all') return true;
    if (clothingFilter === 'streetwear') return p.tags.includes('hoodie') || p.tags.includes('jacket') || p.tags.includes('streetwear') || p.tags.includes('oversized') || p.tags.includes('crop top');
    if (clothingFilter === 'formal') return p.tags.includes('formal') || p.tags.includes('blazer') || p.tags.includes('lab coat') || p.tags.includes('placement');
    if (clothingFilter === 'denim') return p.tags.includes('jeans') || p.tags.includes('cargo') || p.tags.includes('denim');
    if (clothingFilter === 'ethnic') return p.tags.includes('ethnic') || p.tags.includes('fest') || p.tags.includes('kurta') || p.tags.includes('kurti');
    if (clothingFilter === 'active') return p.tags.includes('gym') || p.tags.includes('sports') || p.tags.includes('pyjama') || p.tags.includes('loungewear') || p.tags.includes('shorts');
    return true;
  }).slice(0, 8);
  const trendingProducts = products.filter((p) => p.badge === 'Trending' || p.badge === 'Campus Choice').slice(0, 4);
  const bestSellers = products.filter((p) => p.badge === 'Best Seller').slice(0, 4);

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100 space-y-16 sm:space-y-24 pb-24 relative overflow-hidden">
      {/* Ambient Radial Fire Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[45rem] h-[30rem] bg-gradient-to-tr from-[#FF6A00]/10 via-[#FF2D16]/5 to-transparent rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute top-2/3 right-0 w-[35rem] h-[35rem] bg-[#FF6A00]/05 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* 1. HERO EXPERIENCE WITH MATTER & VIDEO */}
      <CosmicVideoHero />

      {/* 2. Campus Category Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
              <span className="text-xs font-bold text-[#FF8800] uppercase tracking-widest">
                Explore The Fleet
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campus Departments
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Curated for engineering labs, exam prep, dorm living, and university apparel
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-[#FF8800] hover:text-[#FFA040] transition flex items-center gap-1.5"
          >
            <span>All Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const IconComponent = CATEGORY_ICON_MAP[cat.slug] || Laptop;
            return (
              <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                <div className="p-5 rounded-2xl bg-[#121212]/90 border border-white/[0.08] hover:border-[#FF6A00]/40 flex flex-col items-center text-center h-full group hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#FF6A00]/10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6A00]/15 to-[#FF2D16]/15 border border-[#FF6A00]/25 text-[#FF6A00] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-[#FF6A00] group-hover:to-[#FF2D16] group-hover:text-white transition-all transform shadow-md">
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-[#FFA040] transition">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-neutral-500 mt-1">
                    {cat.itemCount || 6}+ items ready
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Promo Banners (Dark Charcoal with Fiery Accents) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Promo 1 */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1A1208]/90 via-[#121212]/95 to-[#1A0A0A]/90 border border-[#FF6A00]/30 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-[#FF6A00]/60 transition">
            <div className="relative z-10 space-y-2">
              <span className="px-2.5 py-1 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[10px] font-bold uppercase tracking-wider text-[#FFA040]">
                Welcome To Campus
              </span>
              <h3 className="text-2xl font-black">Flat 20% OFF</h3>
              <p className="text-xs text-neutral-300">
                Use code <span className="font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded text-[#FF8800] border border-white/10">CAMPUSFIRST</span> on orders &gt; ₹99
              </p>
            </div>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8800] group-hover:text-white transition"
            >
              <span>Explore Tech & Study Supplies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Promo 2 */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#121212]/95 via-[#16120E]/90 to-[#121212]/95 border border-white/15 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-[#FF8800]/40 transition">
            <div className="relative z-10 space-y-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Hostel Wing Saver
              </span>
              <h3 className="text-2xl font-black">Flat ₹30 OFF</h3>
              <p className="text-xs text-neutral-300">
                Use code <span className="font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded text-amber-300 border border-white/10">HOSTEL50</span> on orders &gt; ₹99
              </p>
            </div>
            <Link
              href="/products?category=dorm"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 group-hover:text-white transition"
            >
              <span>Explore Dorm Living</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Promo 3 */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#180A0A]/90 via-[#121212]/95 to-[#160E08]/90 border border-[#FF2D16]/30 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-[#FF2D16]/60 transition">
            <div className="relative z-10 space-y-2">
              <span className="px-2.5 py-1 rounded-full bg-[#FF2D16]/20 border border-[#FF2D16]/40 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                Semester Prep Specials
              </span>
              <h3 className="text-2xl font-black">Up to 75% OFF</h3>
              <p className="text-xs text-neutral-300">
                Student budget prices from ₹49: notebooks, scientific calculators & tech gear
              </p>
            </div>
            <Link
              href="/products?category=stationery"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 group-hover:text-white transition"
            >
              <span>Explore Academic Kits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Campus Clothing & Apparel Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#181108]/95 via-[#121212]/95 to-[#180A0A]/95 border border-[#FF6A00]/30 overflow-hidden mb-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6A00]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800] text-xs font-bold uppercase tracking-wider">
                <Shirt className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Complete Campus Wardrobe • Authentic Quality</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Authentic Campus Clothing
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Placement shirts, blazers, baggy jeans, jackets, heavy hoodies, ethnic fest kurtas, cargos, and gym activewear at verified rates.
              </p>
            </div>
            <Link
              href="/products?category=clothing"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#FF6A00]/30 transition transform hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
            >
              <span>Explore All {allClothing.length || 26} Styles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sub-Category Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-4 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Fits', count: allClothing.length || 26 },
            { id: 'streetwear', label: 'Streetwear & Hoodies' },
            { id: 'formal', label: 'Placement Formals & Suits' },
            { id: 'denim', label: 'Jeans & Cargos' },
            { id: 'ethnic', label: 'Ethnic Fest Kurtas' },
            { id: 'active', label: 'Gym & Hostel Loungewear' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setClothingFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all border ${
                clothingFilter === tab.id
                  ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white border-transparent shadow-md shadow-[#FF6A00]/25'
                  : 'bg-[#121212]/90 hover:bg-[#1A1A1A] text-neutral-300 border-white/10 hover:border-[#FF6A00]/40'
              }`}
            >
              {tab.label} {tab.count ? `(${tab.count})` : ''}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {clothingProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 5. Lightning Campus Deals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FF2D16] text-white shadow-lg shadow-[#FF6A00]/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Lightning Campus Deals
              </h2>
              <p className="text-xs text-neutral-400">Subsidized student prices for this week</p>
            </div>
          </div>
          <Link
            href="/products?sort=discount"
            className="text-xs sm:text-sm font-bold text-[#FF8800] hover:text-[#FFA040] transition flex items-center gap-1"
          >
            <span>See More Deals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {dealProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 6. Trending on Campus */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#FF6A00]/20 to-[#FF2D16]/20 border border-[#FF6A00]/40 text-[#FF8800] shadow-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Trending on Campus
              </h2>
              <p className="text-xs text-neutral-400">Most requested gear by university batchmates</p>
            </div>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-[#FF8800] hover:text-[#FFA040] transition flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {trendingProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 7. Campus Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Campus Best Sellers
            </h2>
            <p className="text-xs text-neutral-400">Everyday essentials rated 4.8★ and higher</p>
          </div>
          <Link
            href="/products?sort=rating"
            className="text-xs sm:text-sm font-bold text-[#FF8800] hover:text-[#FFA040] transition flex items-center gap-1"
          >
            <span>Top Rated</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
