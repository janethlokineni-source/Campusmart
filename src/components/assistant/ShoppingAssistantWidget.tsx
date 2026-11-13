'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Check,
  ExternalLink,
  Loader2,
  RotateCcw,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  AssistantProductCardItem,
  AssistantStreamEvent,
  ChatMessage,
  Product,
} from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useStoreStatusStore } from '@/store/useStoreStatusStore';

const QUICK_CHIPS = [
  'Under ₹200',
  'Exam essentials',
  'Hostel snacks',
  'Best rated',
  'New arrivals',
] as const;

function toStoreProduct(card: AssistantProductCardItem): Product {
  return {
    id: card.id,
    name: card.name,
    slug: card.slug,
    description: `${card.brand} • ${card.category}`,
    price: card.price,
    mrp: card.mrp,
    discountPercent: card.discountPercent,
    category: card.category,
    brand: card.brand,
    stock: card.stock,
    images: card.image ? [card.image] : [],
    specs: {},
    rating: card.rating,
    reviewCount: card.reviewCount,
    tags: [],
    createdAt: new Date().toISOString(),
  };
}

export default function ShoppingAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const addItemToCart = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const wishlistItems = useWishlistStore((s) => s.items);
  const storeStatus = useStoreStatusStore((s) => s.status);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const loadHistory = useCallback(async () => {
    if (hasLoadedHistory) return;
    setLoadingHistory(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/assistant', { method: 'GET' });
      const data = (await res.json()) as {
        success?: boolean;
        messages?: ChatMessage[];
        error?: string;
      };
      if (res.ok && data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setHasLoadedHistory(true);
      }
    } catch {
      setErrorMsg('Could not load previous chat history.');
    } finally {
      setLoadingHistory(false);
    }
  }, [hasLoadedHistory]);

  useEffect(() => {
    if (isOpen) {
      void loadHistory();
      setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [isOpen, loadHistory]);

  const handleAddCardToCart = (card: AssistantProductCardItem) => {
    if (card.stock <= 0) return;
    addItemToCart(toStoreProduct(card), 1);
    setAddedIds((prev) => ({ ...prev, [card.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [card.id]: false }));
    }, 1800);
  };

  const handleClearChat = async () => {
    if (isStreaming || clearing) return;
    setClearing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/assistant', { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
      } else {
        setErrorMsg('Unable to clear chat right now.');
      }
    } catch {
      setErrorMsg('Network error while clearing chat.');
    } finally {
      setClearing(false);
    }
  };

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isStreaming) return;

    setErrorMsg(null);
    setInput('');
    setIsStreaming(true);

    const userMessage: ChatMessage = {
      id: `local-u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const tempAssistantId = `local-a-${Date.now()}`;
    const placeholderAssistant: ChatMessage = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, placeholderAssistant]);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          wishlistProductIds: wishlistItems.map((item) => item.id).slice(0, 30),
          cartProductIds: cartItems.map((item) => item.product.id).slice(0, 30),
        }),
      });

      if (!response.ok || !response.body) {
        let errText = 'Assistant is temporarily unavailable. Please try again.';
        try {
          const errPayload = (await response.json()) as { error?: string };
          if (errPayload.error) errText = errPayload.error;
        } catch {
          // ignore non-json error body
        }
        setErrorMsg(errText);
        setMessages((prev) => prev.filter((m) => m.id !== tempAssistantId));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          try {
            const evt = JSON.parse(cleanLine) as AssistantStreamEvent;
            if (evt.type === 'delta') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantId ? { ...m, content: m.content + evt.text } : m
                )
              );
            } else if (evt.type === 'products') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantId
                    ? { ...m, products: evt.products, bundleTotal: evt.bundleTotal }
                    : m
                )
              );
            } else if (evt.type === 'done') {
              setMessages((prev) =>
                prev.map((m) => (m.id === tempAssistantId ? evt.message : m))
              );
            } else if (evt.type === 'error') {
              setErrorMsg(evt.error);
            }
          } catch {
            // Skip malformed NDJSON chunk
          }
        }
      }
    } catch {
      setErrorMsg('Connection interrupted. Please try your question again.');
      setMessages((prev) => prev.filter((m) => m.id !== tempAssistantId));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      {/* Floating Chat Trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open CampusMart AI Shopping Assistant"
            className="fixed bottom-5 right-5 z-40 group flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white shadow-2xl shadow-[#FF6A00]/35 border border-white/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-black/25">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
            </span>
            <div className="text-left">
              <span className="block text-xs font-black tracking-tight leading-none">
                Campus AI
              </span>
              <span className="block text-[10px] text-white/85 font-medium mt-0.5">
                Budget Finder
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Responsive Chat Drawer / Mobile Full-Screen Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="CampusMart AI Shopping Assistant"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[420px] sm:h-[640px] sm:max-h-[86vh] flex flex-col bg-[#0A0A0A]/95 backdrop-blur-2xl sm:rounded-3xl border border-white/15 shadow-2xl shadow-black/90 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-[#121212]/95 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FF2D16] flex items-center justify-center text-white shadow-md shadow-[#FF6A00]/30 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-black text-white truncate">
                      CampusMart AI
                    </h2>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase">
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {storeStatus && !storeStatus.isOpen
                      ? 'Weekend browse mode • Checkout opens Monday'
                      : 'In-stock picks tailored to your budget'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleClearChat()}
                  disabled={clearing || isStreaming || messages.length === 0}
                  aria-label="Clear chat"
                  title="Clear chat"
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Clear chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-14 space-y-2 text-neutral-400">
                  <Loader2 className="w-6 h-6 text-[#FF6A00] animate-spin" />
                  <p className="text-xs">Loading your CampusMart chat...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#131313] border border-white/10 space-y-3 text-center my-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 text-[#FF8800] mx-auto flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      Need something on campus?
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Tell me your budget and what you&apos;re looking for — e.g.{' '}
                      <span className="text-neutral-200 font-semibold">
                        &quot;I have ₹500, need stationery for exams&quot;
                      </span>{' '}
                      or{' '}
                      <span className="text-neutral-200 font-semibold">
                        &quot;gift under ₹300&quot;
                      </span>
                      .
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isTypingPlaceholder =
                    !isUser && isStreaming && msg.content.length === 0 && !msg.products;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white rounded-br-sm font-medium'
                            : 'bg-[#151515] border border-white/10 text-neutral-200 rounded-bl-sm'
                        }`}
                      >
                        {isTypingPlaceholder ? (
                          <div className="flex items-center gap-1.5 py-1 px-1" aria-label="Assistant typing">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8800] animate-bounce [animation-delay:-0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8800] animate-bounce [animation-delay:-0.1s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8800] animate-bounce" />
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* Compact In-Chat Product Cards */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="w-full space-y-2 pt-0.5">
                          {msg.products.map((prod) => {
                            const isAdded = Boolean(addedIds[prod.id]);
                            const inStock = prod.stock > 0;
                            return (
                              <div
                                key={`${msg.id}-${prod.id}`}
                                className="p-2.5 rounded-2xl bg-[#121212] border border-white/10 hover:border-[#FF6A00]/40 transition flex gap-3 items-start"
                              >
                                <img
                                  src={prod.image || '/placeholder.png'}
                                  alt={prod.name}
                                  className="w-16 h-16 rounded-xl object-cover bg-neutral-900 border border-white/10 shrink-0"
                                />
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold uppercase text-[#FF8800] truncate">
                                      {prod.brand}
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 text-amber-300 text-[10px] font-bold shrink-0">
                                      <Star className="w-2.5 h-2.5 fill-current" />
                                      {prod.rating}
                                    </span>
                                  </div>

                                  <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                                    {prod.name}
                                  </p>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-white font-mono">
                                      ₹{prod.price.toLocaleString('en-IN')}
                                    </span>
                                    {prod.mrp > prod.price && (
                                      <span className="text-[10px] text-neutral-500 line-through">
                                        ₹{prod.mrp.toLocaleString('en-IN')}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[10px] font-bold ${
                                        inStock ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {inStock
                                        ? prod.stock <= 5
                                          ? `Only ${prod.stock} left`
                                          : 'In Stock'
                                        : 'Out of Stock'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleAddCardToCart(prod)}
                                      disabled={!inStock}
                                      aria-label={`Add ${prod.name} to cart`}
                                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                                        isAdded
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white disabled:opacity-40'
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>Added</span>
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingCart className="w-3 h-3" />
                                          <span>Add to cart</span>
                                        </>
                                      )}
                                    </button>
                                    <Link
                                      href={`/products/${prod.slug}`}
                                      onClick={() => setIsOpen(false)}
                                      className="py-1.5 px-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] border border-white/10 text-neutral-200 text-[11px] font-semibold inline-flex items-center gap-1 transition shrink-0"
                                    >
                                      <span>View product</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {msg.bundleTotal !== undefined && msg.products.length > 1 && (
                            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                              <span className="text-emerald-300 font-semibold">
                                Bundle Total ({msg.products.length} items)
                              </span>
                              <span className="font-mono font-black text-emerald-300">
                                ₹{msg.bundleTotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg(null)}
                    aria-label="Dismiss error"
                    className="text-rose-300 hover:text-white shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 border-t border-white/[0.06] bg-[#0D0D0D] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => void sendMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-[#181818] hover:bg-[#FF6A00]/20 border border-white/10 hover:border-[#FF6A00]/40 text-neutral-300 hover:text-white text-[11px] font-semibold whitespace-nowrap transition disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Composer Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-[#101010] border-t border-white/10 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask budget, exam gear, snacks..."
                aria-label="Ask CampusMart AI Shopping Assistant"
                disabled={isStreaming}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/25 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] hover:brightness-110 text-white disabled:opacity-40 disabled:pointer-events-none transition shadow-md shadow-[#FF6A00]/25"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

