import { z } from 'zod';
import {
  AssistantProductCardItem,
  Category,
  Order,
  Product,
  StoreStatus,
} from '@/types';
import { DataStore } from '@/lib/dataStore';
import { isOrderingOpen } from '@/lib/storeStatus';

// =========================
// Validation & Safety Schemas
// =========================
export const AssistantRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message for the CampusMart assistant.')
    .max(500, 'Message is too long (maximum 500 characters).'),
  wishlistProductIds: z.array(z.string().max(80)).max(50).optional(),
  cartProductIds: z.array(z.string().max(80)).max(50).optional(),
});

export const SearchProductsArgsSchema = z.object({
  query: z.string().trim().max(160).optional(),
  maxPrice: z.number().finite().nonnegative().optional(),
  minPrice: z.number().finite().nonnegative().optional(),
  category: z.string().trim().max(60).optional(),
  sortBy: z.enum(['relevance', 'price-low', 'price-high', 'rating', 'discount', 'newest']).optional(),
  limit: z.number().int().min(1).max(8).optional(),
});

export const GetProductDetailsArgsSchema = z.object({
  productId: z.string().trim().min(1).max(120),
});

export type SearchProductsArgs = z.infer<typeof SearchProductsArgsSchema>;
export type GetProductDetailsArgs = z.infer<typeof GetProductDetailsArgsSchema>;

// =========================
// Sanitization & Rate Limiter
// =========================
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

interface RateLimitEntry {
  timestamps: number[];
}

declare global {
  // eslint-disable-next-line no-var
  var campusMartAssistantRateLimit: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore: Map<string, RateLimitEntry> =
  global.campusMartAssistantRateLimit ?? new Map<string, RateLimitEntry>();
global.campusMartAssistantRateLimit = rateLimitStore;

export function checkAssistantRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const entry = rateLimitStore.get(identifier) ?? { timestamps: [] };
  const recent = entry.timestamps.filter((ts) => ts > windowStart);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestInWindow = recent[0] ?? now;
    const resetInSeconds = Math.max(1, Math.ceil((oldestInWindow + RATE_LIMIT_WINDOW_MS - now) / 1000));
    rateLimitStore.set(identifier, { timestamps: recent });
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  recent.push(now);
  rateLimitStore.set(identifier, { timestamps: recent });
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - recent.length),
    resetInSeconds: 60,
  };
}

export function sanitizeUserMessage(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

export function toAssistantProductCard(product: Product): AssistantProductCardItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    mrp: product.mrp,
    discountPercent: product.discountPercent,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    category: product.category,
    brand: product.brand,
    image: product.images[0] || '',
  };
}

// =========================
// Database Tool Executors
// =========================
const SYNONYM_MAP: Record<string, string[]> = {
  exam: ['calculator', 'pen', 'notebook', 'drafting', 'book', 'study', 'casio', 'parker'],
  exams: ['calculator', 'pen', 'notebook', 'drafting', 'book', 'study', 'casio', 'parker'],
  stationery: ['pen', 'calculator', 'notebook', 'pencil', 'parker', 'casio', 'classmate'],
  snack: ['maggi', 'noodles', 'lays', 'bingo', 'kurkure', 'oreo', 'biscuit', 'coffee', 'kitkat', 'chips'],
  snacks: ['maggi', 'noodles', 'lays', 'bingo', 'kurkure', 'oreo', 'biscuit', 'coffee', 'kitkat', 'chips'],
  hostel: ['maggi', 'coffee', 'flask', 'bulb', 'kettle', 'lamp', 'noodles', 'snack'],
  dorm: ['flask', 'bulb', 'light', 'lamp', 'kettle', 'cooktop', 'laundry', 'stand'],
  gift: ['pen', 'perfume', 'watch', 'headphones', 'earbuds', 'flask', 'book', 'habits', 'mug', 'ferrero', 'chocolate', 'silk'],
  cheap: ['maggi', 'coffee', 'pen', 'notebook', 'chips'],
  study: ['calculator', 'pen', 'book', 'lamp', 'coffee', 'notebook'],
  earphones: ['airpods', 'buds', 'headphones', 'earbuds', 'sony', 'boat'],
  headphones: ['headphones', 'airpods', 'sony', 'earbuds', 'audio'],
  phone: ['iphone', 'samsung', 'oneplus', 'pixel', 'realme', 'xiaomi', 'redmi', 'nothing'],
  mobile: ['iphone', 'samsung', 'oneplus', 'pixel', 'realme', 'xiaomi', 'redmi', 'nothing'],
  coffee: ['nescafe', 'coffee', 'flask'],
};

const STOP_WORDS = new Set([
  'i',
  'have',
  'need',
  'want',
  'for',
  'a',
  'an',
  'the',
  'to',
  'my',
  'me',
  'under',
  'below',
  'less',
  'than',
  'within',
  'around',
  'about',
  'above',
  'over',
  'budget',
  'rupees',
  'rs',
  'inr',
  'campusmart',
  'please',
  'show',
  'find',
  'recommend',
  'suggest',
  'good',
  'best',
  'rated',
  'rating',
  'top',
  'highest',
  'new',
  'newest',
  'arrival',
  'arrivals',
  'latest',
  'essentials',
  'night',
  'cheap',
  'items',
  'products',
  'stuff',
  'things',
  'can',
  'you',
  'get',
  'with',
  'in',
  'on',
  'and',
  'or',
]);

function extractSearchTerms(query: string): string[] {
  const cleaned = query
    .toLowerCase()
    .replace(/₹/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ');
  const tokens = cleaned
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));

  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    const synonyms = SYNONYM_MAP[token];
    if (synonyms) {
      for (const s of synonyms) {
        expanded.add(s);
      }
    }
  }
  return Array.from(expanded);
}

export async function toolSearchProducts(
  rawArgs: SearchProductsArgs
): Promise<{
  products: AssistantProductCardItem[];
  totalMatched: number;
  constraints: SearchProductsArgs;
}> {
  const args = SearchProductsArgsSchema.parse(rawArgs);
  const { products: allProducts } = await DataStore.getProducts({
    inStockOnly: true,
    category: args.category && args.category !== 'all' ? args.category : undefined,
    minPrice: args.minPrice,
    maxPrice: args.maxPrice,
    sort: args.sortBy === 'relevance' ? undefined : args.sortBy,
    limit: 500,
  });

  // Safety invariant: never recommend out-of-stock or budget-violating products
  let filtered = allProducts.filter((p) => {
    if (p.stock <= 0) return false;
    if (args.minPrice !== undefined && p.price < args.minPrice) return false;
    if (args.maxPrice !== undefined && p.price > args.maxPrice) return false;
    return true;
  });

  const queryText = args.query?.trim() || '';
  if (queryText.length > 0) {
    const terms = extractSearchTerms(queryText);
    if (terms.length > 0) {
      const scored = filtered
        .map((product) => {
          const haystack = `${product.name} ${product.brand} ${product.category} ${product.description} ${product.tags.join(' ')}`.toLowerCase();
          let score = 0;
          for (const term of terms) {
            if (product.name.toLowerCase().includes(term)) score += 4;
            else if (product.category.toLowerCase().includes(term)) score += 3;
            else if (product.brand.toLowerCase().includes(term)) score += 2;
            else if (haystack.includes(term)) score += 1;
          }
          return { product, score };
        })
        .filter((entry) => entry.score > 0);

      if (scored.length > 0) {
        if (!args.sortBy || args.sortBy === 'relevance') {
          scored.sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);
        }
        filtered = scored.map((entry) => entry.product);
      } else if (!args.category) {
        filtered = [];
      }
    }
  }

  if (args.sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (args.sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (args.sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  } else if (args.sortBy === 'discount') {
    filtered.sort((a, b) => b.discountPercent - a.discountPercent);
  } else if (args.sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const limit = args.limit ?? 5;
  return {
    products: filtered.slice(0, limit).map(toAssistantProductCard),
    totalMatched: filtered.length,
    constraints: args,
  };
}

export async function toolGetProductDetails(rawArgs: GetProductDetailsArgs): Promise<{
  found: boolean;
  product?: Product & { inStock: boolean };
}> {
  const args = GetProductDetailsArgsSchema.parse(rawArgs);
  const product = await DataStore.getProductByIdOrSlug(args.productId);
  if (!product) {
    return { found: false };
  }
  return {
    found: true,
    product: {
      ...product,
      inStock: product.stock > 0,
    },
  };
}

export async function toolGetCategories(): Promise<{
  categories: Array<{ name: string; slug: string; description: string; itemCount: number }>;
}> {
  const categories: Category[] = await DataStore.getCategories();
  return {
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      itemCount: c.itemCount,
    })),
  };
}

// =========================
// Off-Topic & Prompt Helpers
// =========================
const SHOPPING_KEYWORDS = [
  'buy',
  'price',
  'budget',
  'under',
  'below',
  'above',
  'cheap',
  'affordable',
  'order',
  'checkout',
  'cart',
  'delivery',
  'hostel',
  'weekend',
  'monday',
  'saturday',
  'sunday',
  'cod',
  'product',
  'category',
  'categories',
  'gift',
  'exam',
  'stationery',
  'snack',
  'snacks',
  'food',
  'coffee',
  'maggi',
  'phone',
  'mobile',
  'laptop',
  'headphone',
  'earbuds',
  'airpods',
  'shoe',
  'sneaker',
  'shirt',
  'jacket',
  'book',
  'novel',
  'pen',
  'calculator',
  'dorm',
  'lamp',
  'flask',
  'trimmer',
  'rated',
  'rating',
  'new',
  'arrival',
  'arrivals',
  'discount',
  'deal',
  'campus',
  'campusmart',
  'stock',
  'recommend',
  'suggest',
  'find',
  'search',
  'help',
  'hi',
  'hello',
  'hey',
  'thanks',
  'thank',
  '₹',
  'rs',
  'inr',
];

const SHOPPING_KEYWORD_REGEXES: RegExp[] = SHOPPING_KEYWORDS.map((kw) =>
  kw === '₹' ? /₹/ : new RegExp(`\\b${kw}\\b`, 'i')
);

const OFF_TOPIC_PATTERNS = [
  /\b(write code|write a .*script|python script|javascript function|leetcode|solve this equation|debug my code|homework essay|essay on)\b/i,
  /\b(president|prime minister|election|politics|stock market tips|crypto trading|bitcoin prediction)\b/i,
  /\b(medical diagnosis|prescribe medicine|legal advice|horoscope|weather forecast)\b/i,
];

const STRICT_COMMERCE_INTENT_REGEX = /\b(buy|price|budget|under|below|shop|store|cart|checkout|order|product|products|catalog|campusmart)\b/i;

export function isOffTopicRequest(message: string): boolean {
  const lower = message.toLowerCase();
  if (OFF_TOPIC_PATTERNS.some((re) => re.test(message)) && !STRICT_COMMERCE_INTENT_REGEX.test(lower)) {
    return true;
  }
  const hasShoppingSignal = SHOPPING_KEYWORD_REGEXES.some((re) => re.test(lower));
  if (hasShoppingSignal) return false;
  if (OFF_TOPIC_PATTERNS.some((re) => re.test(message))) return true;
  // Short greetings or generic shopping queries stay allowed; long non-shopping questions get declined cleanly
  if (lower.split(/\s+/).length >= 8 && !/\b(shop|store|item|need|want|looking|suggest|gift|buy)\b/i.test(lower)) {
    return true;
  }
  return false;
}

export interface AssistantPersonalization {
  userName?: string;
  recentOrders: Order[];
  wishlistItems: Product[];
  cartItems: Product[];
}

export interface AssistantContext {
  storeStatus: StoreStatus;
  personalization: AssistantPersonalization;
}

export interface AssistantResult {
  reply: string;
  products: AssistantProductCardItem[];
  bundleTotal?: number;
  provider: string;
  fallbackUsed: boolean;
}

function buildSystemPrompt(context: AssistantContext): string {
  const { storeStatus, personalization } = context;
  const orderHistorySummary =
    personalization.recentOrders.length > 0
      ? personalization.recentOrders
          .slice(0, 3)
          .map((o) => `${o.orderNumber}: ${o.items.map((i) => i.name).join(', ')}`)
          .join(' | ')
      : 'None yet';

  const wishlistSummary =
    personalization.wishlistItems.length > 0
      ? personalization.wishlistItems.map((p) => `${p.name} (₹${p.price})`).join(', ')
      : 'Empty';

  const cartSummary =
    personalization.cartItems.length > 0
      ? personalization.cartItems.map((p) => `${p.name} (₹${p.price})`).join(', ')
      : 'Empty';

  return `You are CampusMart AI, a friendly, concise shopping assistant for college students on CampusMart (single-store campus marketplace, COD-first, hostel/gate delivery).

LIVE STORE SCHEDULE STATUS:
- Today (${storeStatus.currentDay}, timezone ${storeStatus.timezone}): Ordering open = ${storeStatus.isOpen ? 'YES (Mon-Fri ordering active)' : 'NO (Weekend / Browse-Only Mode)'}.
- Business rule: Checkout and placing orders ONLY work Monday to Friday. On Saturday/Sunday, users can still browse, use wishlists/price alerts, and add items to cart ("You can add to cart now; checkout opens Monday").

STRICT RULES:
1. NEVER invent, guess, or recall product names, IDs, prices, ratings, or stock levels from memory. Always call \`searchProducts\`, \`getProductDetails\`, or \`getCategories\` first.
2. NEVER recommend out-of-stock products (\`stock <= 0\`).
3. Strictly respect the user's budget (\`price <= maxPrice\`). When suggesting a bundle of 2+ items for a budget, ensure the bundle sum fits the budget and state the exact bundle total in ₹.
4. Product cards render automatically in the UI from the tool results, so keep your prose short, warm, and crisp — do not print bulky plain-text catalogs; briefly explain why these picks fit and mention the bundle total if suggesting multiple items.
5. If no products match within budget or category, say so clearly and call \`searchProducts\` with relaxed filters to offer the closest in-stock alternatives.
6. Stay strictly on topic (CampusMart shopping, products, budgets, orders, weekday/weekend rules). Politely refuse unrelated requests (coding homework, politics, medical/legal advice, etc.).
7. If checkout/ordering/weekend status comes up while the store is closed on Sat/Sun, always tell the user: "You can add to cart now; checkout opens Monday."

USER CONTEXT:
- Name: ${personalization.userName || 'Guest Student'}
- Current Cart: ${cartSummary}
- Wishlist: ${wishlistSummary}
- Past Orders: ${orderHistorySummary}`;
}

// =========================
// Deterministic Query Parser & Smart Fallback
// =========================
function parseBudgetFromText(message: string): {
  maxPrice?: number;
  minPrice?: number;
  category?: string;
  sortBy?: SearchProductsArgs['sortBy'];
  isBundleIntent: boolean;
  isScheduleQuestion: boolean;
} {
  const lower = message.toLowerCase();

  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  const maxMatch =
    lower.match(/(?:under|below|less than|within|max|upto|up to|budget(?:\s+of|\s+is)?|have|for)\s*(?:₹|rs\.?|inr)?\s*(\d{2,6})/i) ||
    lower.match(/(?:₹|rs\.?|inr)\s*(\d{2,6})\s*(?:budget|or less|max|only)/i) ||
    lower.match(/^(?:₹|rs\.?|inr)\s*(\d{2,6})$/i);

  if (maxMatch) {
    maxPrice = Number(maxMatch[1]);
  } else {
    const standaloneRupee = lower.match(/(?:₹|rs\.?)\s*(\d{2,6})/i);
    if (standaloneRupee) {
      maxPrice = Number(standaloneRupee[1]);
    }
  }

  const minMatch = lower.match(/(?:above|over|more than|min|minimum)\s*(?:₹|rs\.?|inr)?\s*(\d{2,6})/i);
  if (minMatch) {
    minPrice = Number(minMatch[1]);
  }

  let category: string | undefined;
  if (/\b(stationery|pen|calculator|notebook|drafting)\b/i.test(lower)) category = 'stationery';
  else if (/\b(snack|snacks|groceries|noodle|maggi|coffee|biscuit|chips|hostel night|late night)\b/i.test(lower))
    category = 'groceries';
  else if (/\b(book|books|novel|exam guide|jntu|textbook|clrs)\b/i.test(lower)) category = 'books';
  else if (/\b(mobile|phone|smartphone|iphone|samsung|pixel|oneplus|xiaomi)\b/i.test(lower)) category = 'mobiles';
  else if (/\b(laptop|macbook|computer|monitor|keyboard)\b/i.test(lower)) category = 'laptops';
  else if (/\b(audio|headphone|headphones|earbuds|airpods|speaker|watch|smartwatch)\b/i.test(lower))
    category = 'audio';
  else if (/\b(shoe|shoes|sneaker|sneakers|footwear)\b/i.test(lower)) category = 'footwear';
  else if (/\b(shirt|jacket|hoodie|jeans|t-shirt|clothing|fashion|apparel)\b/i.test(lower))
    category = 'clothing';
  else if (/\b(dorm|bulb|flask|laundry|induction|study lamp)\b/i.test(lower)) category = 'dorm';
  else if (/\b(kitchen|mixer|air fryer|kettle)\b/i.test(lower)) category = 'home-kitchen';
  else if (/\b(trimmer|grooming|dryer|serum|beauty|protein)\b/i.test(lower)) category = 'beauty-grooming';

  let sortBy: SearchProductsArgs['sortBy'] = 'relevance';
  if (/\b(best rated|top rated|highest rated|best)\b/i.test(lower)) sortBy = 'rating';
  else if (/\b(new|newest|latest|arrival|arrivals)\b/i.test(lower)) sortBy = 'newest';
  else if (/\b(cheap|cheapest|lowest|budget)\b/i.test(lower)) sortBy = 'price-low';
  else if (/\b(discount|deal|offer|off)\b/i.test(lower)) sortBy = 'discount';

  const isBundleIntent = /\b(essentials|combo|bundle|kit|snacks|items|for exams|for a hostel night)\b/i.test(lower);
  const isScheduleQuestion =
    /\b(weekend|saturday|sunday|checkout|open|closed|when can i order|place order|deliver)\b/i.test(lower);

  return { maxPrice, minPrice, category, sortBy, isBundleIntent, isScheduleQuestion };
}

function selectBundleWithinBudget(
  candidates: AssistantProductCardItem[],
  budget: number,
  maxItems = 3
): { picked: AssistantProductCardItem[]; bundleTotal: number } {
  const picked: AssistantProductCardItem[] = [];
  let runningTotal = 0;

  // Pick diverse highest-utility items whose sum stays <= budget
  const sorted = [...candidates].sort((a, b) => b.rating - a.rating || a.price - b.price);
  for (const item of sorted) {
    if (picked.length >= maxItems) break;
    if (item.price <= budget && runningTotal + item.price <= budget) {
      picked.push(item);
      runningTotal += item.price;
    }
  }

  // If greedy by rating missed smaller items that allow 2+ picks, try price-ascending bundle
  if (picked.length <= 1) {
    const cheapFirst: AssistantProductCardItem[] = [];
    let cheapSum = 0;
    const asc = [...candidates].sort((a, b) => a.price - b.price);
    for (const item of asc) {
      if (cheapFirst.length >= maxItems) break;
      if (cheapSum + item.price <= budget) {
        cheapFirst.push(item);
        cheapSum += item.price;
      }
    }
    if (cheapFirst.length > picked.length) {
      return { picked: cheapFirst, bundleTotal: cheapSum };
    }
  }

  return { picked, bundleTotal: runningTotal };
}

export async function runFallbackAssistant(
  userMessage: string,
  context: AssistantContext
): Promise<AssistantResult> {
  if (isOffTopicRequest(userMessage)) {
    return {
      reply:
        "I'm CampusMart AI, so I can only help with CampusMart shopping — finding textbooks, stationery, hostel snacks, electronics, checking prices within your budget, or explaining campus delivery schedules. Ask me for something to shop for!",
      products: [],
      provider: 'campusmart-fallback',
      fallbackUsed: true,
    };
  }

  const parsed = parseBudgetFromText(userMessage);
  const lower = userMessage.toLowerCase();

  // Check if query asks purely about weekend / checkout hours
  if (
    parsed.isScheduleQuestion &&
    !parsed.category &&
    parsed.maxPrice === undefined &&
    !/\b(find|suggest|recommend|buy|snack|stationery|book|phone|laptop|gift)\b/i.test(lower)
  ) {
    const statusNote = context.storeStatus.isOpen
      ? `CampusMart checkout is **OPEN right now** (${context.storeStatus.currentDay}). Orders work Monday to Friday with hostel doorstep delivery (Cash on Delivery available). On weekends (Saturday & Sunday), you can add to cart now; checkout opens Monday.`
      : `CampusMart is currently in Weekend Browse-Only Mode (${context.storeStatus.currentDay}). **You can add to cart now; checkout opens Monday.** Checkout operates Monday through Friday.`;
    return {
      reply: statusNote,
      products: [],
      provider: 'campusmart-fallback',
      fallbackUsed: true,
    };
  }

  // Execute real database search
  let searchRes = await toolSearchProducts({
    query: userMessage,
    category: parsed.category,
    maxPrice: parsed.maxPrice,
    minPrice: parsed.minPrice,
    sortBy: parsed.sortBy,
    limit: 8,
  });

  // Prioritize items not already in user's cart if multiple exist
  const cartIds = new Set(context.personalization.cartItems.map((c) => c.id));
  if (searchRes.products.length > 3 && cartIds.size > 0) {
    const fresh = searchRes.products.filter((p) => !cartIds.has(p.id));
    if (fresh.length >= 2) {
      searchRes = { ...searchRes, products: fresh };
    }
  }

  let selectedProducts = searchRes.products.slice(0, 4);
  let bundleTotal: number | undefined;
  let relaxedAlternativeUsed = false;

  if (selectedProducts.length === 0) {
    // Try same category without budget constraint OR broader catalog search within budget
    if (parsed.category && parsed.maxPrice !== undefined) {
      const catNoBudget = await toolSearchProducts({
        category: parsed.category,
        sortBy: 'price-low',
        limit: 4,
      });
      if (catNoBudget.products.length > 0) {
        selectedProducts = catNoBudget.products.slice(0, 3);
        relaxedAlternativeUsed = true;
      }
    }

    if (selectedProducts.length === 0 && parsed.maxPrice !== undefined) {
      const budgetOnly = await toolSearchProducts({
        maxPrice: parsed.maxPrice,
        sortBy: 'rating',
        limit: 4,
      });
      if (budgetOnly.products.length > 0) {
        selectedProducts = budgetOnly.products;
        relaxedAlternativeUsed = true;
      }
    }

    if (selectedProducts.length === 0) {
      const closestOverall = await toolSearchProducts({
        sortBy: parsed.maxPrice !== undefined ? 'price-low' : 'rating',
        limit: 4,
      });
      selectedProducts = closestOverall.products;
      relaxedAlternativeUsed = true;
    }
  } else if (parsed.maxPrice !== undefined) {
    if (parsed.isBundleIntent || selectedProducts.length >= 2) {
      const bundle = selectBundleWithinBudget(searchRes.products, parsed.maxPrice, 3);
      if (bundle.picked.length > 0) {
        selectedProducts = bundle.picked;
        bundleTotal = bundle.bundleTotal;
      }
    }
  }

  const lines: string[] = [];
  if (selectedProducts.length === 0) {
    lines.push("I couldn't find any in-stock items matching that right now. Try browsing All Products or adjusting your budget!");
  } else if (relaxedAlternativeUsed && parsed.maxPrice !== undefined) {
    const cheapestPrice = Math.min(...selectedProducts.map((p) => p.price));
    if (cheapestPrice > parsed.maxPrice) {
      lines.push(
        `No in-stock items in that exact category matched **₹${parsed.maxPrice}**, so here are the closest affordable in-stock alternatives (starting at **₹${cheapestPrice.toLocaleString('en-IN')}**):`
      );
    } else {
      lines.push(
        `I couldn't find an exact match for that phrase, so here are top in-stock CampusMart picks within **₹${parsed.maxPrice.toLocaleString('en-IN')}**:`
      );
    }
  } else if (parsed.maxPrice !== undefined && selectedProducts.length > 1 && bundleTotal !== undefined) {
    lines.push(
      `Here ${selectedProducts.length === 1 ? 'is a top in-stock pick' : `are ${selectedProducts.length} in-stock CampusMart picks`} fitting your **₹${parsed.maxPrice.toLocaleString('en-IN')}** budget — **Bundle Total: ₹${bundleTotal.toLocaleString('en-IN')}**:`
    );
  } else if (parsed.maxPrice !== undefined) {
    lines.push(
      `Here ${selectedProducts.length === 1 ? 'is the best in-stock option' : `are ${selectedProducts.length} in-stock picks`} under **₹${parsed.maxPrice.toLocaleString('en-IN')}**:`
    );
  } else {
    lines.push(
      `Here are ${selectedProducts.length} popular in-stock CampusMart picks for you:`
    );
  }

  if (!context.storeStatus.isOpen || parsed.isScheduleQuestion) {
    lines.push('Note: Checkout is closed on weekends — you can add to cart now; checkout opens Monday.');
  }

  return {
    reply: lines.join('\n\n'),
    products: selectedProducts,
    bundleTotal,
    provider: 'campusmart-fallback',
    fallbackUsed: true,
  };
}

// =========================
// Provider-Agnostic LLM Orchestrator (OpenAI-Compatible & Gemini)
// =========================
interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: OpenAIToolCall[];
}

interface OpenAICompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
    };
  }>;
}

interface GeminiFunctionCall {
  name: string;
  args?: Record<string, unknown>;
}

interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

async function executeNamedTool(
  name: string,
  rawArgs: Record<string, unknown>,
  collectedProducts: Map<string, AssistantProductCardItem>
): Promise<Record<string, unknown>> {
  if (name === 'searchProducts') {
    const parsed = SearchProductsArgsSchema.safeParse(rawArgs);
    if (!parsed.success) {
      return { error: 'Invalid search parameters', issues: parsed.error.issues };
    }
    const result = await toolSearchProducts(parsed.data);
    for (const item of result.products) {
      collectedProducts.set(item.id, item);
    }
    return result;
  }

  if (name === 'getProductDetails') {
    const parsed = GetProductDetailsArgsSchema.safeParse(rawArgs);
    if (!parsed.success) {
      return { error: 'Invalid productId', issues: parsed.error.issues };
    }
    const result = await toolGetProductDetails(parsed.data);
    if (result.found && result.product && result.product.stock > 0) {
      collectedProducts.set(result.product.id, toAssistantProductCard(result.product));
    }
    return result;
  }

  if (name === 'getCategories') {
    return await toolGetCategories();
  }

  return { error: `Unknown tool: ${name}` };
}

function finalizeRecommendedCards(
  userMessage: string,
  replyText: string,
  collectedProducts: Map<string, AssistantProductCardItem>
): { products: AssistantProductCardItem[]; bundleTotal?: number } {
  const allCollected = Array.from(collectedProducts.values()).filter((p) => p.stock > 0);
  if (allCollected.length === 0) {
    return { products: [] };
  }

  const parsed = parseBudgetFromText(userMessage);
  const lowerReply = replyText.toLowerCase();

  // Prefer products explicitly referenced by name in LLM reply, keeping strict budget limits
  let prioritized = allCollected.filter((p) => {
    const shortName = p.name.split('(')[0].trim().toLowerCase();
    return lowerReply.includes(shortName.slice(0, 18)) || lowerReply.includes(p.id.toLowerCase());
  });

  if (prioritized.length === 0) {
    prioritized = allCollected;
  }

  if (parsed.maxPrice !== undefined) {
    const withinBudget = prioritized.filter((p) => p.price <= (parsed.maxPrice ?? Infinity));
    if (withinBudget.length > 0) {
      const bundle = selectBundleWithinBudget(withinBudget, parsed.maxPrice, 4);
      return {
        products: bundle.picked.length > 0 ? bundle.picked : withinBudget.slice(0, 4),
        bundleTotal: bundle.picked.length > 1 ? bundle.bundleTotal : undefined,
      };
    }
  }

  const sliced = prioritized.slice(0, 4);
  const sum = sliced.reduce((acc, item) => acc + item.price, 0);
  return {
    products: sliced,
    bundleTotal: sliced.length > 1 && parsed.isBundleIntent ? sum : undefined,
  };
}

async function runOpenAICompatibleLLM(params: {
  apiKey: string;
  model: string;
  baseUrl: string;
  systemPrompt: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
}): Promise<AssistantResult> {
  const collectedProducts = new Map<string, AssistantProductCardItem>();
  const endpoint = `${params.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const messages: OpenAIMessage[] = [
    { role: 'system', content: params.systemPrompt },
    ...params.history.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: params.userMessage },
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'searchProducts',
        description:
          'Search CampusMart catalog for currently in-stock products with optional budget, category, and sorting filters.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Keywords or item intent (e.g. stationery calculator, snacks)' },
            maxPrice: { type: 'number', description: 'Strict maximum price in INR' },
            minPrice: { type: 'number', description: 'Minimum price in INR' },
            category: { type: 'string', description: 'Category slug if known (e.g. stationery, groceries, books, dorm, mobiles, audio)' },
            sortBy: {
              type: 'string',
              enum: ['relevance', 'price-low', 'price-high', 'rating', 'discount', 'newest'],
            },
            limit: { type: 'number', description: 'Max results up to 8' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getProductDetails',
        description: 'Fetch full specifications, live price, MRP, and stock of one CampusMart product by ID or slug.',
        parameters: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
          },
          required: ['productId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getCategories',
        description: 'List all active product categories and counts on CampusMart.',
        parameters: { type: 'object', properties: {} },
      },
    },
  ];

  let finalReply = '';
  for (let round = 0; round < 3; round++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.35,
      }),
      signal: AbortSignal.timeout(18_000),
    });

    if (!response.ok) {
      throw new Error(`LLM HTTP ${response.status}`);
    }

    const payload = (await response.json()) as OpenAICompletionResponse;
    const choice = payload.choices?.[0]?.message;
    if (!choice) {
      throw new Error('Empty LLM response');
    }

    const toolCalls = choice.tool_calls ?? [];
    if (toolCalls.length > 0) {
      messages.push({
        role: 'assistant',
        content: choice.content ?? null,
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
        } catch {
          parsedArgs = {};
        }
        const toolResult = await executeNamedTool(tc.function.name, parsedArgs, collectedProducts);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });
      }
      continue;
    }

    finalReply = (choice.content || '').trim();
    break;
  }

  if (!finalReply) {
    throw new Error('No assistant text returned');
  }

  const finalized = finalizeRecommendedCards(params.userMessage, finalReply, collectedProducts);
  return {
    reply: finalReply,
    products: finalized.products,
    bundleTotal: finalized.bundleTotal,
    provider: `openai-compatible:${params.model}`,
    fallbackUsed: false,
  };
}

async function runGeminiLLM(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
}): Promise<AssistantResult> {
  const collectedProducts = new Map<string, AssistantProductCardItem>();
  const modelName = params.model || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const contents: GeminiContent[] = [
    ...params.history.slice(-8).map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: params.userMessage }],
    },
  ];

  const tools = [
    {
      functionDeclarations: [
        {
          name: 'searchProducts',
          description: 'Search CampusMart in-stock catalog with optional query, budget, category, and sorting.',
          parameters: {
            type: 'OBJECT',
            properties: {
              query: { type: 'STRING' },
              maxPrice: { type: 'NUMBER' },
              minPrice: { type: 'NUMBER' },
              category: { type: 'STRING' },
              sortBy: { type: 'STRING' },
              limit: { type: 'NUMBER' },
            },
          },
        },
        {
          name: 'getProductDetails',
          description: 'Get details for a specific CampusMart product.',
          parameters: {
            type: 'OBJECT',
            properties: {
              productId: { type: 'STRING' },
            },
            required: ['productId'],
          },
        },
        {
          name: 'getCategories',
          description: 'List available CampusMart store categories.',
          parameters: { type: 'OBJECT', properties: {} },
        },
      ],
    },
  ];

  let finalReply = '';
  for (let round = 0; round < 3; round++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        contents,
        tools,
        generationConfig: { temperature: 0.35 },
      }),
      signal: AbortSignal.timeout(18_000),
    });

    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const payload = (await res.json()) as GeminiResponse;
    const parts = payload.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = parts
      .map((p) => p.functionCall)
      .filter((fc): fc is GeminiFunctionCall => Boolean(fc));

    if (functionCalls.length > 0) {
      contents.push({ role: 'model', parts });
      const responseParts: GeminiPart[] = [];
      for (const fc of functionCalls) {
        const result = await executeNamedTool(fc.name, fc.args ?? {}, collectedProducts);
        responseParts.push({
          functionResponse: {
            name: fc.name,
            response: result,
          },
        });
      }
      contents.push({ role: 'user', parts: responseParts });
      continue;
    }

    finalReply = parts
      .map((p) => p.text || '')
      .join('')
      .trim();
    break;
  }

  if (!finalReply) {
    throw new Error('Empty Gemini reply');
  }

  const finalized = finalizeRecommendedCards(params.userMessage, finalReply, collectedProducts);
  return {
    reply: finalReply,
    products: finalized.products,
    bundleTotal: finalized.bundleTotal,
    provider: `gemini:${modelName}`,
    fallbackUsed: false,
  };
}

export async function generateShoppingAssistantReply(params: {
  userMessage: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
  userName?: string;
  wishlistProductIds?: string[];
  cartProductIds?: string[];
}): Promise<AssistantResult> {
  const settings = await DataStore.getStoreSettings();
  const storeStatus = isOrderingOpen(new Date(), settings.timezone, settings);

  const recentOrders = params.userId ? await DataStore.getOrders(params.userId) : [];
  const { products: allProducts } = await DataStore.getProducts({ limit: 500 });
  const productById = new Map<string, Product>(allProducts.map((p) => [p.id, p]));

  const wishlistItems = (params.wishlistProductIds ?? [])
    .map((id) => productById.get(id))
    .filter((p): p is Product => Boolean(p));

  const cartItems = (params.cartProductIds ?? [])
    .map((id) => productById.get(id))
    .filter((p): p is Product => Boolean(p));

  const context: AssistantContext = {
    storeStatus,
    personalization: {
      userName: params.userName,
      recentOrders,
      wishlistItems,
      cartItems,
    },
  };

  if (isOffTopicRequest(params.userMessage)) {
    return await runFallbackAssistant(params.userMessage, context);
  }

  const apiKey = process.env.LLM_API_KEY?.trim();
  const model = process.env.LLM_MODEL?.trim() || 'gpt-4o-mini';
  const configuredProvider = (process.env.LLM_PROVIDER?.trim() || 'auto').toLowerCase();
  const baseUrl = process.env.LLM_BASE_URL?.trim() || 'https://api.openai.com/v1';

  if (!apiKey) {
    return await runFallbackAssistant(params.userMessage, context);
  }

  const systemPrompt = buildSystemPrompt(context);
  const useGemini =
    configuredProvider === 'gemini' ||
    (configuredProvider === 'auto' && model.toLowerCase().includes('gemini'));

  try {
    if (useGemini) {
      return await runGeminiLLM({
        apiKey,
        model,
        systemPrompt,
        history: params.history,
        userMessage: params.userMessage,
      });
    }

    return await runOpenAICompatibleLLM({
      apiKey,
      model,
      baseUrl,
      systemPrompt,
      history: params.history,
      userMessage: params.userMessage,
    });
  } catch (error) {
    console.warn('[CampusMart AI] Upstream LLM unavailable, using deterministic DB fallback:', error);
    return await runFallbackAssistant(params.userMessage, context);
  }
}
