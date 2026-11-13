export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  role: Role;
  phone?: string;
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  hostelBlock: string;
  roomNumber: string;
  campusGate?: string;
  landmark?: string;
  isDefault?: boolean;
}

export type Model3dType = 'glb' | 'procedural-headphones' | 'procedural-laptop' | 'procedural-bottle' | 'procedural-backpack' | 'procedural-cup' | 'procedural-jacket';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  discountPercent: number;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  images: string[];
  model3dUrl?: string;
  model3dType?: Model3dType;
  stock: number;
  specs: Record<string, string>;
  tags: string[];
  isCafeteria?: boolean;
  isVeg?: boolean;
  badge?: 'Best Seller' | 'Deal of the Day' | 'Campus Choice' | 'Trending' | 'Fresh Arrival' | 'Amazon Choice' | 'Flipkart Assured';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
  itemCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  timestamp: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
  isCafeteria?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  address: Address;
  deliverySlot: string;
  paymentMethod: 'COD';
  paymentStatus: 'pending' | 'paid';
  orderStatus: OrderStatus;
  statusTimeline: OrderTimelineStep[];
  subtotal: number;
  mrpTotal: number;
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;
  cancellationReason?: string;
  createdAt: string;
}

export interface DateOverride {
  date: string; // YYYY-MM-DD
  forceOpen: boolean;
  reason: string;
}

export interface StoreSettings {
  openDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun (standard JS getDay, but we normalize 1-7 or 0-6)
  openTime: string; // "HH:MM" e.g., "00:00"
  closeTime: string; // "HH:MM" e.g., "23:59"
  timezone: string; // e.g. "Asia/Kolkata"
  overrides: DateOverride[];
  weekendNotice: string;
  updatedAt: string;
}

export interface StoreStatus {
  isOpen: boolean;
  currentDay: string;
  currentDayNumber: number; // 0=Sun, 1=Mon, ..., 6=Sat
  currentTimeString: string;
  nextOpenAt: string;
  message: string;
  timezone: string;
  openingHours: string;
  isOverride: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
  description: string;
}

// =========================
// Feature 1: AI Shopping Assistant Types
// =========================
export type ChatRole = 'user' | 'assistant' | 'system';

export interface AssistantProductCardItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stock: number;
  category: string;
  brand: string;
  image: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: AssistantProductCardItem[];
  bundleTotal?: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  sessionKey: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type AssistantStreamEvent =
  | { type: 'meta'; sessionId: string; provider: string; fallbackUsed: boolean }
  | { type: 'delta'; text: string }
  | { type: 'products'; products: AssistantProductCardItem[]; bundleTotal?: number }
  | { type: 'done'; message: ChatMessage }
  | { type: 'error'; error: string };

// =========================
// Feature 2: Price Drop Alerts & Notifications Types
// =========================
export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  priceWhenAdded: number;
  targetPrice?: number;
  active: boolean;
  lastNotifiedPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceAlertWithProduct extends PriceAlert {
  product: Product | null;
  priceDiff: number;
  priceDiffPercent: number;
  isLowestIn30Days: boolean;
}

export interface PriceHistoryPoint {
  id: string;
  productId: string;
  price: number;
  changedAt: string;
}

export interface ProductPriceHistorySummary {
  productId: string;
  currentPrice: number;
  days: number;
  points: PriceHistoryPoint[];
  minPrice30d: number;
  maxPrice30d: number;
  minPrice90d: number;
  maxPrice90d: number;
  isLowestIn30Days: boolean;
  hasRecentDrop: boolean;
  dropPercentFromPeak: number;
  previousPrice?: number;
}

export type NotificationType = 'price_drop' | 'order_update' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  productId?: string;
  productSlug?: string;
  read: boolean;
  createdAt: string;
}

export interface ProductAlertDemandStat {
  productId: string;
  activeAlertsCount: number;
  totalAlertsCount: number;
}


