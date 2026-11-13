'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { Product, ProductPriceHistorySummary, Review } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useStoreStatusStore } from '@/store/useStoreStatusStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import ProductCard from '@/components/product/ProductCard';
import WeekendCountdownTimer from '@/components/common/WeekendCountdownTimer';
import PriceAlertButton from '@/components/alerts/PriceAlertButton';
import {
  Star,
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Box,
  Check,
  Plus,
  Minus,
  AlertCircle,
  MessageSquare,
  Sparkles,
  TrendingDown,
} from 'lucide-react';

const PriceHistoryChart = dynamic(
  () => import('@/components/alerts/PriceHistoryChart'),
  { ssr: false }
);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [priceSummary, setPriceSummary] = useState<ProductPriceHistorySummary | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { status } = useStoreStatusStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    alerts,
    enableAlert,
    autoEnableOnWishlist,
    setAutoEnableOnWishlist,
  } = useAlertsStore();

  const isStoreOpen = status ? status.isOpen : true;

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
          setRelated(data.related || []);

          // fetch reviews
          const revRes = await fetch(`/api/reviews?productId=${data.product.id}`);
          const revData = await revRes.json();
          if (revData.success) {
            setReviews(revData.reviews || []);
          }

          // fetch 30-day price history summary for badges
          const histRes = await fetch(
            `/api/products/${encodeURIComponent(data.product.id)}/price-history?days=30`
          );
          const histData = (await histRes.json()) as {
            success?: boolean;
            history?: ProductPriceHistorySummary;
          };
          if (histData.success && histData.history) {
            setPriceSummary(histData.history);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#FF6A00]/20 border-t-[#FF6A00] animate-spin mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] bg-[#080808] flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-bold text-white">Product not found</h2>
        <p className="text-sm text-neutral-400 mt-2">The product you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => router.push('/products')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white font-bold text-xs shadow-md shadow-[#FF6A00]/25"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isStoreOpen) return;
    addItem(product, quantity);
    router.push('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: newRating,
          comment: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setReviews([data.review, ...reviews]);
        setShowReviewModal(false);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-100 py-8 relative overflow-hidden">
      {/* Ambient Radial Fire Glow */}
      <div className="absolute top-1/4 right-10 w-[35rem] h-[35rem] bg-[#FF6A00]/05 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Weekend Notice Alert if store is closed */}
        {!isStoreOpen && status && (
          <div className="p-4 rounded-2xl bg-[#181105]/95 border border-[#FF8800]/40 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#FF8800]/20 text-[#FF8800] shrink-0 border border-[#FF8800]/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-300">
                  Weekend Store Schedule Active
                </p>
                <p className="text-xs text-neutral-300">
                  You can browse, save wishlists, and add this item to your cart. Checkout resumes on Monday!
                </p>
              </div>
            </div>
            {status.nextOpenAt && (
              <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                <span className="text-xs text-neutral-400">Opens in:</span>
                <WeekendCountdownTimer targetDateString={status.nextOpenAt} compact />
              </div>
            )}
          </div>
        )}

        {/* Main Product Showcase: Left Gallery + Right Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Visual Media Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-[#121212]/90 border border-white/[0.08] pt-[80%] shadow-2xl group">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
            </div>

            {/* Thumbnails strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-[#FF6A00] ring-4 ring-[#FF6A00]/20 scale-105'
                      : 'border-white/10 hover:border-white/30 bg-[#121212]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Pricing, Specs, Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span className="font-bold uppercase tracking-wider text-[#FF8800] text-[11px]">
                  {product.brand}
                </span>
                <button
                  onClick={() => {
                    const addingToWishlist = !isWishlisted;
                    toggleItem(product);
                    if (
                      addingToWishlist &&
                      isAuthenticated &&
                      autoEnableOnWishlist &&
                      !alerts.some((a) => a.productId === product.id)
                    ) {
                      void enableAlert(product.id);
                    }
                  }}
                  className={`p-2.5 rounded-full border transition ${
                    isWishlisted
                      ? 'bg-[#FF2D16] border-[#FF2D16] text-white shadow-md shadow-[#FF2D16]/40'
                      : 'border-white/10 text-neutral-300 hover:text-[#FF2D16] hover:border-[#FF2D16]/40 bg-[#151515]'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                  aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {product.name}
              </h1>

              {/* Ratings Bar */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 bg-[#121212] border border-white/10 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-bold">
                  <span>{product.rating}</span>
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                </div>
                <span className="text-xs text-neutral-400">
                  {product.reviewCount} Ratings & {reviews.length} Verified Student Reviews
                </span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-5 rounded-3xl bg-[#121212]/90 border border-white/[0.08] backdrop-blur-xl space-y-2.5 shadow-xl">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.mrp > product.price && (
                  <span className="text-sm text-neutral-500 line-through">
                    M.R.P.: ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                )}
                {product.discountPercent > 0 && (
                  <span className="text-sm font-bold text-[#FF6A00]">
                    {product.discountPercent}% OFF
                  </span>
                )}
              </div>
              {product.mrp > product.price && (
                <p className="text-xs text-emerald-400 font-semibold">
                  You Save: ₹{(product.mrp - product.price).toLocaleString('en-IN')} ({product.discountPercent}% off verified Flipkart/Amazon rate)
                </p>
              )}

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Special Campus Subsidized Price</span>
              </div>

              {(priceSummary?.isLowestIn30Days || priceSummary?.hasRecentDrop) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {priceSummary.isLowestIn30Days && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      Lowest price in 30 days
                    </span>
                  )}
                  {priceSummary.hasRecentDrop && priceSummary.dropPercentFromPeak > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[#FFA040] text-[11px] font-bold">
                      <TrendingDown className="w-3 h-3" />
                      Price dropped &bull; {priceSummary.dropPercentFromPeak}% OFF
                    </span>
                  )}
                </div>
              )}

              <p className="text-[11px] text-neutral-400">
                Free delivery on orders above ₹99. Cash on Delivery available at your hostel doorstep.
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              {product.stock > 0 ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  In Stock &bull; {product.stock} units ready in Campus Store
                </span>
              ) : (
                <span className="text-rose-500">Currently Sold Out on Campus</span>
              )}
            </div>

            {/* Quantity Selector & Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-neutral-300">Quantity:</span>
                <div className="flex items-center border border-white/10 rounded-xl bg-[#151515]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white/10 rounded-l-xl text-neutral-300 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3.5 text-xs font-bold text-white font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-white/10 rounded-r-xl text-neutral-300 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A00]/25 hover:scale-105 active:scale-95 transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{addedNotice ? 'Added to Cart!' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0 || !isStoreOpen}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                    !isStoreOpen
                      ? 'bg-[#1C1C1C] text-neutral-500 cursor-not-allowed border border-white/5'
                      : 'bg-[#151515] hover:bg-[#1E1E1E] text-white border border-white/15 hover:border-[#FF6A00]/40 hover:scale-105 active:scale-95'
                  }`}
                  title={
                    !isStoreOpen
                      ? 'Ordering is closed on weekends. Add item to cart to order on Monday!'
                      : 'Order immediately'
                  }
                >
                  <Sparkles className="w-4 h-4 text-[#FF8800]" />
                  <span>{!isStoreOpen ? 'Weekend Saved' : 'Buy Now'}</span>
                </button>
              </div>
            </div>

            {/* Value Props & Hostel Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.08] text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF6A00] shrink-0" />
                <span>Hostel Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Same-Day Replacement</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#FF2D16] shrink-0" />
                <span>Hostel Gate Handover</span>
              </div>
            </div>

            {/* Price Drop Alert Toggle + Auto Wishlist Alert Option */}
            <div className="space-y-2.5">
              <PriceAlertButton product={product} variant="full" />
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#111111] border border-white/[0.06] text-[11px] text-neutral-400 cursor-pointer">
                <span>Auto-enable price alerts when saving to Wishlist</span>
                <input
                  type="checkbox"
                  checked={autoEnableOnWishlist}
                  onChange={(e) => setAutoEnableOnWishlist(e.target.checked)}
                  className="rounded accent-[#FF6A00]"
                />
              </label>
            </div>

            {/* Lazy-Loaded Price History Mini-Chart */}
            <PriceHistoryChart productId={product.id} currentPrice={product.price} />
          </div>
        </div>

        {/* Description & Technical Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 border-t border-white/[0.08]">
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-lg font-bold text-white">Product Overview</h3>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {product.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-[#151515] border border-white/10 text-neutral-300 text-xs font-medium"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Specs Table */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-lg font-bold text-white">Technical Specifications</h3>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden text-xs bg-[#121212]/90">
              {Object.entries(product.specs || {}).map(([key, value], idx) => (
                <div
                  key={key}
                  className={`flex py-2.5 px-4 ${
                    idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                  }`}
                >
                  <span className="w-1/2 font-semibold text-neutral-400">{key}</span>
                  <span className="w-1/2 font-medium text-neutral-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ratings & Reviews Section */}
        <div className="pt-8 border-t border-white/[0.08] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Student Ratings & Reviews</h3>
              <p className="text-xs text-neutral-400">Verified campus buyers only</p>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FFA040] text-xs font-bold hover:brightness-110 transition shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">No reviews yet for this product. Be the first to share your experience!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-[#121212]/90 border border-white/[0.08] space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6A00] to-[#FF2D16] text-white font-bold text-xs flex items-center justify-center">
                        {rev.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{rev.userName}</p>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] text-emerald-400 font-medium">✓ Verified Campus Purchase</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#1A1A1A] border border-white/10 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-bold">
                      <span>{rev.rating}</span>
                      <Star className="w-3 h-3 fill-current text-amber-400" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products Strip */}
        {related.length > 0 && (
          <div className="pt-8 border-t border-white/[0.08] space-y-6">
            <h3 className="text-xl font-bold text-white">Related Campus Items</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}

        {/* Review Submission Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Rate & Review Product</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`p-1.5 rounded-lg transition ${
                          star <= newRating ? 'text-amber-400' : 'text-neutral-600'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs font-bold ml-2 text-neutral-300">
                      {newRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Review Comment
                  </label>
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="How was the product quality, delivery, and experience on campus?"
                    className="w-full p-3 rounded-xl border border-white/10 bg-[#181818] text-xs text-white focus:outline-none focus:border-[#FF6A00] transition placeholder-neutral-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white text-xs font-bold shadow-md shadow-[#FF6A00]/25 hover:brightness-110 transition"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
