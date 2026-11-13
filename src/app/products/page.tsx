'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, Category } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import {
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Search,
  Star,
  X,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters state
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'default';
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [sortBy, setSortBy] = useState(currentSort);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(150000);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSortBy(searchParams.get('sort') || 'default');
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') {
          query.set('category', selectedCategory);
        }
        if (currentSearch) {
          query.set('search', currentSearch);
        }
        if (sortBy && sortBy !== 'default') {
          query.set('sort', sortBy);
        }
        if (minRating) {
          query.set('rating', minRating.toString());
        }
        if (inStockOnly) {
          query.set('inStockOnly', 'true');
        }
        if (priceRange < 150000) {
          query.set('maxPrice', priceRange.toString());
        }

        const res = await fetch(`/api/products?${query.toString()}&limit=100`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, currentSearch, sortBy, minRating, inStockOnly, priceRange]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (sortVal: string) => {
    setSortBy(sortVal);
    const params = new URLSearchParams(searchParams.toString());
    if (sortVal === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', sortVal);
    }
    router.push(`/products?${params.toString()}`);
  };

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSortBy('default');
    setMinRating(undefined);
    setInStockOnly(false);
    setPriceRange(150000);
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100 py-8 relative overflow-hidden">
      {/* Ambient Radial Fire Lighting */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-[#FF6A00]/05 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[30rem] h-[30rem] bg-[#FF2D16]/05 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Banner & Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5 font-medium">
              <span>Home</span>
              <span>/</span>
              <span className="text-[#FF8800] font-semibold capitalize">
                {selectedCategory === 'all' ? 'All Products' : selectedCategory.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight capitalize">
                {selectedCategory === 'all'
                  ? currentSearch
                    ? `Search results for "${currentSearch}"`
                    : 'Campus Marketplace Catalog'
                  : selectedCategory.replace('-', ' ')}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800] text-[10px] font-bold">
                <Zap className="w-3 h-3" /> Hostel Drop
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Showing {products.length} verified Flipkart & Amazon products curated for campus hostel life
            </p>
          </div>

          {/* View mode & Sort toolbar */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151515] border border-white/10 text-xs font-bold text-white hover:border-[#FF6A00]/40 transition"
            >
              <Filter className="w-4 h-4 text-[#FF8800]" />
              <span>Filters</span>
            </button>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 bg-[#121212] text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] transition"
              >
                <option value="default">Relevance & Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating (Highest)</option>
                <option value="discount">Biggest Discount %</option>
                <option value="newest">Fresh Arrivals</option>
              </select>
            </div>

            {/* Grid vs List toggle */}
            <div className="hidden sm:flex items-center rounded-xl border border-white/10 p-0.5 bg-[#121212]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white shadow-md shadow-[#FF6A00]/25'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white shadow-md shadow-[#FF6A00]/25'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout (Sidebar + Results) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block space-y-6">
            <div className="p-5 rounded-3xl bg-[#121212]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#FF8800]" />
                  <span>Filter Products</span>
                </span>
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-[#FF8800] hover:text-[#FFA040] hover:underline font-semibold transition"
                >
                  Reset
                </button>
              </div>

              {/* Category selection */}
              <div>
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5">
                  Categories
                </h4>
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      selectedCategory === 'all'
                        ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white font-bold shadow-md shadow-[#FF6A00]/25'
                        : 'text-neutral-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCategoryChange(c.slug)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                        selectedCategory === c.slug
                          ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white font-bold shadow-md shadow-[#FF6A00]/25'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] opacity-70 ml-1">({c.itemCount})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Max Slider */}
              <div className="pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  <span>Max Budget</span>
                  <span className="text-[#FF8800] font-mono">₹{priceRange.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="150000"
                  step="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-[#FF6A00] cursor-pointer bg-neutral-800"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                  <span>₹100</span>
                  <span>₹1,50,000</span>
                </div>
              </div>

              {/* Customer Rating Filter */}
              <div className="pt-2 border-t border-white/[0.08]">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5">
                  Rating Quality
                </h4>
                <div className="space-y-1.5">
                  {[4, 3].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? undefined : r)}
                      className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        minRating === r
                          ? 'bg-[#FF6A00]/15 border border-[#FF6A00]/40 text-[#FFA040]'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <span>{r}★ and above</span>
                      <div className="flex items-center text-amber-400 ml-auto">
                        {Array.from({ length: r }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* In stock toggle */}
              <div className="pt-2 border-t border-white/[0.08]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-[#FF6A00] focus:ring-[#FF6A00] w-4 h-4 accent-[#FF6A00]"
                  />
                  <span>In-Stock Campus Products Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="md:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-[#121212]/90 rounded-2xl border border-white/[0.08] p-4 space-y-3 animate-pulse"
                  >
                    <div className="w-full pt-[80%] bg-neutral-900 rounded-xl" />
                    <div className="h-4 bg-neutral-900 rounded w-3/4" />
                    <div className="h-4 bg-neutral-900 rounded w-1/2" />
                    <div className="h-8 bg-neutral-900 rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#121212]/90 border border-white/[0.08] backdrop-blur-xl space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] text-[#FF8800] mx-auto flex items-center justify-center border border-white/10 shadow-lg">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  No matching campus products found
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Try adjusting your search keywords, price filters, or category selection to discover available campus gear.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white font-bold text-xs hover:brightness-110 transition shadow-md shadow-[#FF6A00]/25"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl bg-[#121212]/90 border border-white/[0.08] flex flex-col sm:flex-row items-center gap-4 hover:border-[#FF6A00]/40 transition group"
                  >
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-28 h-28 rounded-xl object-cover shrink-0 bg-neutral-900 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[#FF8800]">
                        {prod.category}
                      </span>
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-[#FFA040] transition">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{prod.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-base font-black text-white">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                        {prod.mrp > prod.price && (
                          <span className="text-xs text-neutral-500 line-through">
                            ₹{prod.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#FF6A00]">{prod.discountPercent}% OFF</span>
                      </div>
                    </div>
                    <div className="shrink-0 w-full sm:w-auto">
                      <ProductCard product={prod} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Mobile Filters Slide-over / Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white">Filters</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-300 mb-2">Category</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleCategoryChange('all');
                      setMobileFilterOpen(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold ${
                      selectedCategory === 'all'
                        ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white shadow-md'
                        : 'bg-[#1A1A1A] text-neutral-300'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        handleCategoryChange(c.slug);
                        setMobileFilterOpen(false);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold truncate ${
                        selectedCategory === c.slug
                          ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white shadow-md'
                          : 'bg-[#1A1A1A] text-neutral-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white font-bold text-sm shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#FF6A00]/20 border-t-[#FF6A00] animate-spin" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
