import {
  Product,
  Category,
  Order,
  User,
  Coupon,
  StoreSettings,
  Review,
  OrderStatus,
  OrderTimelineStep,
  ChatMessage,
  ChatSession,
  PriceAlert,
  PriceAlertWithProduct,
  PriceHistoryPoint,
  ProductPriceHistorySummary,
  AppNotification,
  NotificationType,
  ProductAlertDemandStat,
} from '@/types';
import bcrypt from 'bcryptjs';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ADMIN_USER,
  INITIAL_CUSTOMER_USER,
  getInitialChatSessions,
  getInitialPriceAlerts,
  getInitialPriceHistory,
  getInitialNotifications,
} from './seedData';
import { DEFAULT_STORE_SETTINGS } from './storeStatus';
import connectToDatabase from './db';
import { SupabaseStore } from './supabaseStore';
import { SqliteStore } from './sqliteDb';
import { dispatchExternalPriceDropChannels } from './notifications';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { CategoryModel } from '@/models/Category';
import { CouponModel } from '@/models/Coupon';
import { StoreSettingsModel } from '@/models/StoreSettings';
import { UserModel } from '@/models/User';
import { ReviewModel } from '@/models/Review';
import { ChatSessionModel } from '@/models/ChatSession';
import { PriceAlertModel } from '@/models/PriceAlert';
import { PriceHistoryModel } from '@/models/PriceHistory';
import { NotificationModel } from '@/models/Notification';

interface InMemoryState {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: (User & { passwordHash: string })[];
  coupons: Coupon[];
  storeSettings: StoreSettings;
  reviews: Review[];
  chatSessions: ChatSession[];
  priceAlerts: PriceAlert[];
  priceHistory: PriceHistoryPoint[];
  notifications: AppNotification[];
  catalogSeedCount: number;
  isInitialized: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var campusMartState: InMemoryState | undefined;
}

function getInitialOrders(): Order[] {
  return [];
}

function cloneInitialProducts(): Product[] {
  return INITIAL_PRODUCTS.map((p) => ({
    ...p,
    images: [...p.images],
    tags: [...p.tags],
    specs: { ...p.specs },
  }));
}

const existingGlobal = global.campusMartState;
const state: InMemoryState = existingGlobal ?? {
  products: cloneInitialProducts(),
  categories: [...INITIAL_CATEGORIES],
  orders: getInitialOrders(),
  users: [INITIAL_ADMIN_USER, INITIAL_CUSTOMER_USER],
  coupons: [...INITIAL_COUPONS],
  storeSettings: { ...DEFAULT_STORE_SETTINGS },
  reviews: [],
  chatSessions: getInitialChatSessions(),
  priceAlerts: getInitialPriceAlerts(),
  priceHistory: getInitialPriceHistory(),
  notifications: getInitialNotifications(),
  catalogSeedCount: INITIAL_PRODUCTS.length,
  isInitialized: true,
};

if (!state.chatSessions) {
  state.chatSessions = getInitialChatSessions();
}
if (!state.priceAlerts) {
  state.priceAlerts = getInitialPriceAlerts();
}
if (!state.priceHistory) {
  state.priceHistory = getInitialPriceHistory();
}
if (!state.notifications) {
  state.notifications = getInitialNotifications();
}
if (!state.catalogSeedCount || state.catalogSeedCount !== INITIAL_PRODUCTS.length) {
  state.products = cloneInitialProducts();
  state.catalogSeedCount = INITIAL_PRODUCTS.length;
}

global.campusMartState = state;

export function formatNameFromEmail(email: string): string {
  if (!email) return 'Customer';
  const prefix = email.split('@')[0];

  // Specific check for janethlokineni -> Janeth Lokineni
  if (prefix.toLowerCase() === 'janethlokineni') {
    return 'Janeth Lokineni';
  }

  // Split on dots, hyphens, underscores, numbers
  const parts = prefix.split(/[\._\-0-9]+/).filter(Boolean);
  if (parts.length > 0) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export const DataStore = {
  // Products
  async getProducts(params?: {
    category?: string;
    search?: string;
    isCafeteria?: boolean;
    sort?: string;
    inStockOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    page?: number;
    limit?: number;
  }) {
    if (state.products.length === 0) {
      state.products = cloneInitialProducts();
    }

    const sbProducts = await SupabaseStore.getAllProducts();
    if (sbProducts && sbProducts.length > 0) {
      state.products = sbProducts;
    } else {
      const sqlProducts = SqliteStore.getAllProducts();
      if (sqlProducts && sqlProducts.length > 0) {
        state.products = sqlProducts;
      }
    }

    let list = [...state.products];

    if (params?.category && params.category !== 'all') {
      list = list.filter((p) => p.category.toLowerCase() === params.category?.toLowerCase());
    }

    if (params?.isCafeteria !== undefined) {
      list = list.filter((p) => !!p.isCafeteria === params.isCafeteria);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (params?.inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    if (params?.minPrice !== undefined) {
      list = list.filter((p) => p.price >= (params.minPrice || 0));
    }

    if (params?.maxPrice !== undefined) {
      list = list.filter((p) => p.price <= (params.maxPrice || Infinity));
    }

    if (params?.rating) {
      list = list.filter((p) => p.rating >= (params.rating || 0));
    }

    // Sort
    switch (params?.sort) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        list.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        // Relevance / default
        break;
    }

    const total = list.length;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      products: items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    if (state.products.length === 0) {
      state.products = cloneInitialProducts();
    }
    const sbProduct = await SupabaseStore.getProductByIdOrSlug(idOrSlug);
    if (sbProduct !== undefined) {
      return sbProduct;
    }
    const sqlProduct = SqliteStore.getProductByIdOrSlug(idOrSlug);
    if (sqlProduct !== undefined) {
      return sqlProduct;
    }
    return state.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  },

  async createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const id = `prod-${Date.now()}`;
    const product: Product = {
      ...productData,
      id,
      createdAt: new Date().toISOString(),
    };
    state.products.unshift(product);
    SqliteStore.upsertProduct(product);
    await SupabaseStore.createProduct(product);
    await this.recordPriceHistory(product.id, product.price);
    return product;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const current = await this.getProductByIdOrSlug(id);
    if (!current) return null;

    const index = state.products.findIndex((p) => p.id === current.id);
    const previousPrice = current.price;
    const nextPrice = updates.price !== undefined ? updates.price : current.price;
    const nextMrp = updates.mrp !== undefined ? updates.mrp : current.mrp;

    let computedDiscount = updates.discountPercent;
    if (computedDiscount === undefined && (updates.price !== undefined || updates.mrp !== undefined)) {
      computedDiscount = nextMrp > nextPrice ? Math.round(((nextMrp - nextPrice) / nextMrp) * 100) : 0;
    }

    const updated: Product = {
      ...current,
      ...updates,
      ...(computedDiscount !== undefined ? { discountPercent: computedDiscount } : {}),
    };

    if (index !== -1) {
      state.products[index] = updated;
    } else {
      state.products.unshift(updated);
    }

    SqliteStore.upsertProduct(updated);
    await SupabaseStore.updateProduct(updated);

    if (updated.price !== previousPrice) {
      await this.recordPriceHistory(updated.id, updated.price);
      if (updated.price < previousPrice) {
        await this.evaluateAlertsForProduct(updated, previousPrice);
      }
    }

    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const prevLen = state.products.length;
    state.products = state.products.filter((p) => p.id !== id);
    const sbDeleted = await SupabaseStore.deleteProduct(id);
    const sqlDeleted = SqliteStore.deleteProduct(id);
    return (sbDeleted ?? sqlDeleted ?? false) || state.products.length < prevLen;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const sbCats = await SupabaseStore.getCategories();
    const sbProducts = await SupabaseStore.getAllProducts();
    if (sbProducts && sbProducts.length > 0) {
      state.products = sbProducts;
    } else {
      const sqlProducts = SqliteStore.getAllProducts();
      if (sqlProducts && sqlProducts.length > 0) {
        state.products = sqlProducts;
      }
    }
    const sqlCats = !sbCats || sbCats.length === 0 ? SqliteStore.getCategories() : null;
    state.categories =
      sbCats && sbCats.length > 0
        ? sbCats
        : sqlCats && sqlCats.length > 0
        ? sqlCats
        : [...INITIAL_CATEGORIES];
    return state.categories.map((c) => ({
      ...c,
      itemCount: state.products.filter((p) => p.category.toLowerCase() === c.slug.toLowerCase()).length || c.itemCount,
    }));
  },

  // Store Settings
  async getStoreSettings(): Promise<StoreSettings> {
    const sbSettings = await SupabaseStore.getStoreSettings();
    if (sbSettings) {
      state.storeSettings = sbSettings;
    } else {
      const sqlSettings = SqliteStore.getStoreSettings();
      if (sqlSettings) {
        state.storeSettings = sqlSettings;
      }
    }
    return state.storeSettings;
  },

  async updateStoreSettings(newSettings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getStoreSettings();
    const next: StoreSettings = {
      ...current,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    state.storeSettings = next;
    SqliteStore.upsertStoreSettings(next);
    await SupabaseStore.updateStoreSettings(next);
    return state.storeSettings;
  },

  // Orders
  async getOrders(userId?: string): Promise<Order[]> {
    const sbOrders = await SupabaseStore.getOrders(userId);
    if (sbOrders !== null) {
      return sbOrders;
    }
    const sqlOrders = SqliteStore.getOrders(userId);
    if (sqlOrders !== null) {
      return sqlOrders;
    }
    if (userId) {
      return state.orders.filter((o) => o.userId === userId);
    }
    return [...state.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getOrderById(id: string): Promise<Order | null> {
    const sbOrder = await SupabaseStore.getOrderById(id);
    if (sbOrder !== undefined) {
      return sbOrder;
    }
    const sqlOrder = SqliteStore.getOrderById(id);
    if (sqlOrder !== undefined) {
      return sqlOrder;
    }
    return state.orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'statusTimeline'>): Promise<Order> {
    const id = `ord-${Date.now()}`;
    const orderNumber = `CM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const timeline: OrderTimelineStep[] = [
      {
        status: 'placed',
        timestamp: nowIso,
        title: 'Order Placed',
        description: 'Your campus delivery order has been received.',
        completed: true,
        current: true,
      },
      {
        status: 'confirmed',
        timestamp: '',
        title: 'Order Confirmed',
        description: 'Store verified stock and confirmed.',
        completed: false,
        current: false,
      },
      {
        status: 'packed',
        timestamp: '',
        title: 'Packed',
        description: 'Order carefully boxed and labeled.',
        completed: false,
        current: false,
      },
      {
        status: 'out_for_delivery',
        timestamp: '',
        title: 'Out for Campus Delivery',
        description: 'Campus runner assigned for delivery.',
        completed: false,
        current: false,
      },
      {
        status: 'delivered',
        timestamp: '',
        title: 'Delivered',
        description: 'Delivered to your room or hostel gate.',
        completed: false,
        current: false,
      },
    ];

    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      statusTimeline: timeline,
      createdAt: nowIso,
    };

    // Decrement stock for ordered items
    for (const item of newOrder.items) {
      const prod = await this.getProductByIdOrSlug(item.productId);
      if (prod) {
        const nextStock = Math.max(0, prod.stock - item.quantity);
        prod.stock = nextStock;
        const memProd = state.products.find((p) => p.id === prod.id);
        if (memProd) {
          memProd.stock = nextStock;
        }
        SqliteStore.upsertProduct({ ...prod, stock: nextStock });
        await SupabaseStore.updateProduct({ ...prod, stock: nextStock });
      }
    }

    state.orders.unshift(newOrder);
    SqliteStore.upsertOrder(newOrder);
    await SupabaseStore.createOrder(newOrder);
    return newOrder;
  },

  async updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
    note?: string
  ): Promise<Order | null> {
    const order = await this.getOrderById(id);
    if (!order) return null;

    order.orderStatus = newStatus;
    const nowIso = new Date().toISOString();

    const statusOrder: OrderStatus[] = [
      'placed',
      'confirmed',
      'packed',
      'out_for_delivery',
      'delivered',
    ];
    const currentIndex = statusOrder.indexOf(newStatus);

    if (newStatus === 'cancelled') {
      order.statusTimeline.push({
        status: 'cancelled',
        timestamp: nowIso,
        title: 'Order Cancelled',
        description: note || 'Order was cancelled by customer or store admin.',
        completed: true,
        current: true,
      });
    } else {
      order.statusTimeline = order.statusTimeline.map((step) => {
        const stepIndex = statusOrder.indexOf(step.status);
        if (stepIndex < currentIndex) {
          return { ...step, completed: true, current: false };
        } else if (stepIndex === currentIndex) {
          return {
            ...step,
            completed: true,
            current: true,
            timestamp: step.timestamp || nowIso,
            description: note || step.description,
          };
        } else {
          return { ...step, completed: false, current: false };
        }
      });
    }

    const memIndex = state.orders.findIndex((o) => o.id === order.id);
    if (memIndex !== -1) {
      state.orders[memIndex] = order;
    }
    SqliteStore.upsertOrder(order);
    await SupabaseStore.updateOrder(order);

    return order;
  },

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    const sbCoupons = await SupabaseStore.getCoupons();
    if (sbCoupons && sbCoupons.length > 0) {
      state.coupons = sbCoupons;
    } else {
      const sqlCoupons = SqliteStore.getCoupons();
      if (sqlCoupons && sqlCoupons.length > 0) {
        state.coupons = sqlCoupons;
      }
    }
    return state.coupons;
  },

  async createCoupon(couponData: Omit<Coupon, 'id'>): Promise<Coupon> {
    const coupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      code: couponData.code.trim().toUpperCase(),
    };
    state.coupons.unshift(coupon);
    SqliteStore.upsertCoupon(coupon);
    await SupabaseStore.createCoupon(coupon);
    return coupon;
  },

  async validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
    const coupons = await this.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code.' };
    }
    if (!coupon.isActive) {
      return { valid: false, error: 'This coupon is no longer active.' };
    }
    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: 'This coupon has expired.' };
    }
    if (subtotal < coupon.minOrderValue) {
      return { valid: false, error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.` };
    }

    return { valid: true, coupon };
  },

  // Reviews
  async getReviews(productId: string): Promise<Review[]> {
    const sbReviews = await SupabaseStore.getReviews(productId);
    if (sbReviews !== null) {
      return sbReviews;
    }
    const sqlReviews = SqliteStore.getReviews(productId);
    if (sqlReviews !== null) {
      return sqlReviews;
    }
    return state.reviews.filter((r) => r.productId === productId);
  },

  async addReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const id = `rev-${Date.now()}`;
    const review: Review = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
    };
    state.reviews.unshift(review);
    SqliteStore.insertReview(review);
    await SupabaseStore.addReview(review);

    // Update product rating and reviewCount
    const prod = await this.getProductByIdOrSlug(review.productId);
    if (prod) {
      const prodReviews = await this.getReviews(prod.id);
      if (prodReviews.length > 0) {
        const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
        const rating = parseFloat(avg.toFixed(1));
        await this.updateProduct(prod.id, { rating, reviewCount: prodReviews.length });
      }
    }

    return review;
  },

  // Users
  async findUserByEmail(email: string) {
    const sbUser = await SupabaseStore.findUserByEmail(email);
    if (sbUser !== undefined) {
      return sbUser;
    }
    const sqlUser = SqliteStore.findUserByEmail(email);
    if (sqlUser !== undefined) {
      return sqlUser;
    }
    return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserByIdentifier(identifier: string) {
    const sbUser = await SupabaseStore.findUserByIdentifier(identifier);
    if (sbUser !== undefined) {
      return sbUser;
    }
    const sqlUser = SqliteStore.findUserByIdentifier(identifier);
    if (sqlUser !== undefined) {
      return sqlUser;
    }

    const raw = identifier.trim();
    const cleanLower = raw.toLowerCase();
    const digits = raw.replace(/\D/g, '');

    return (
      state.users.find((u) => {
        // 1. Email exact or case-insensitive match (Gmail / Email)
        if (u.email && u.email.toLowerCase() === cleanLower) return true;
        // Admin alias
        if (cleanLower === 'admin@campusmart.edu' && u.email.toLowerCase() === 'admin@gmail.com') return true;
        // 2. Student ID or Roll number
        if (u.studentId && u.studentId.toLowerCase() === cleanLower) return true;
        // 3. Phone number match
        if (digits.length >= 7 && u.phone) {
          const uDigits = u.phone.replace(/\D/g, '');
          if (uDigits === digits || uDigits.endsWith(digits) || digits.endsWith(uDigits)) return true;
        }
        return false;
      }) || null
    );
  },

  async findUserByPhone(phone: string) {
    const sbUser = await SupabaseStore.findUserByPhone(phone);
    if (sbUser !== undefined) {
      return sbUser;
    }
    const sqlUser = SqliteStore.findUserByPhone(phone);
    if (sqlUser !== undefined) {
      return sqlUser;
    }
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    return (
      state.users.find((u) => {
        if (!u.phone) return false;
        const uDigits = u.phone.replace(/\D/g, '');
        return uDigits === digits || (digits.length >= 10 && uDigits.endsWith(digits.slice(-10)));
      }) || null
    );
  },

  async findOrCreateUserByEmail(email: string, defaultName?: string) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await this.findUserByEmail(cleanEmail);
    const resolvedName =
      cleanEmail === 'janethlokineni@gmail.com'
        ? 'Janeth Lokineni'
        : defaultName && !defaultName.toLowerCase().includes('google')
        ? defaultName
        : formatNameFromEmail(cleanEmail);

    if (existing) {
      existing.name = resolvedName;
      if (existing.studentId && existing.studentId.includes('SSO')) {
        existing.studentId = undefined;
      }
      SqliteStore.upsertUser(existing);
      await SupabaseStore.upsertUser(existing);
      return existing;
    }

    const role: 'customer' | 'admin' = cleanEmail === 'admin@gmail.com' ? 'admin' : 'customer';

    return await this.createUser({
      name: resolvedName,
      email: cleanEmail,
      passwordHash: bcrypt.hashSync('GmailOTPAuthenticated2026!', 10),
      role,
    });
  },

  async findOrCreateUserByPhone(phone: string, defaultName?: string) {
    const existing = await this.findUserByPhone(phone);
    if (existing) {
      if (!existing.name || existing.name.startsWith('Hosteler') || existing.name.toLowerCase().includes('google')) {
        existing.name = defaultName || 'Janeth Lokineni';
        SqliteStore.upsertUser(existing);
        await SupabaseStore.upsertUser(existing);
      }
      return existing;
    }

    const cleanPhone = phone.trim();
    const digits = cleanPhone.replace(/\D/g, '');
    const last4 = digits.slice(-4) || '9999';
    return await this.createUser({
      name: defaultName || 'Janeth Lokineni',
      email: `user.${last4}@campusmart.edu`,
      phone: cleanPhone.startsWith('+') ? cleanPhone : `+91 ${cleanPhone}`,
      passwordHash: bcrypt.hashSync('Student2026!', 10),
      role: 'customer',
    });
  },

  async findOrCreateUserBySSO(provider: 'google' | 'microsoft', email: string, name?: string) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await this.findUserByEmail(cleanEmail);
    const resolvedName =
      cleanEmail === 'janethlokineni@gmail.com'
        ? 'Janeth Lokineni'
        : name && name.trim() && !name.toLowerCase().includes('google')
        ? name.trim()
        : formatNameFromEmail(cleanEmail);

    if (existing) {
      existing.name = resolvedName;
      if (existing.studentId && existing.studentId.includes('SSO')) {
        existing.studentId = undefined;
      }
      SqliteStore.upsertUser(existing);
      await SupabaseStore.upsertUser(existing);
      return existing;
    }

    return await this.createUser({
      name: resolvedName,
      email: cleanEmail,
      passwordHash: bcrypt.hashSync('SSOVerified2026!', 10),
      role: cleanEmail === 'admin@gmail.com' ? 'admin' : 'customer',
      phone: '+91 98000 00000',
    });
  },

  async updateUserProfile(userId: string, data: { name?: string; phone?: string }) {
    const user = await this.findUserById(userId);
    if (!user) return null;
    if (data.name && data.name.trim()) user.name = data.name.trim();
    if (data.phone && data.phone.trim()) user.phone = data.phone.trim();
    const memUser = state.users.find((u) => u.id === user.id);
    if (memUser) {
      memUser.name = user.name;
      memUser.phone = user.phone;
    }
    SqliteStore.upsertUser(user);
    await SupabaseStore.upsertUser(user);
    return user;
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    const user = await this.findUserById(userId);
    if (!user) return null;
    user.passwordHash = passwordHash;
    const memUser = state.users.find((u) => u.id === user.id);
    if (memUser) {
      memUser.passwordHash = passwordHash;
    }
    SqliteStore.upsertUser(user);
    await SupabaseStore.upsertUser(user);
    return user;
  },

  async findUserById(id: string) {
    const sbUser = await SupabaseStore.findUserById(id);
    if (sbUser !== undefined) {
      return sbUser;
    }
    const sqlUser = SqliteStore.findUserById(id);
    if (sqlUser !== undefined) {
      return sqlUser;
    }
    return state.users.find((u) => u.id === id) || null;
  },

  async getUsers() {
    const sbUsers = await SupabaseStore.getAllUsers();
    const sqlUsers = sbUsers ? null : SqliteStore.getAllUsers();
    const source = sbUsers ?? sqlUsers ?? state.users;
    return source.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      studentId: u.studentId,
      phone: u.phone,
      addresses: u.addresses,
      createdAt: u.createdAt,
    }));
  },

  async createUser(userData: {
    name: string;
    email: string;
    passwordHash: string;
    studentId?: string;
    role?: 'customer' | 'admin';
    phone?: string;
  }) {
    const id = `user-${Date.now()}`;
    const newUser = {
      id,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      passwordHash: userData.passwordHash,
      studentId: userData.studentId,
      role: userData.role || 'customer',
      phone: userData.phone,
      addresses: [],
      createdAt: new Date().toISOString(),
    };
    state.users.push(newUser);
    SqliteStore.upsertUser(newUser);
    await SupabaseStore.upsertUser(newUser);
    return newUser;
  },

  async addAddressToUser(userId: string, address: Omit<User['addresses'][0], 'id'>) {
    const user = await this.findUserById(userId);
    if (!user) return null;
    const newAddr = {
      ...address,
      id: `addr-${Date.now()}`,
    };
    if (newAddr.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    user.addresses.push(newAddr);
    const memUser = state.users.find((u) => u.id === user.id);
    if (memUser && memUser !== user) {
      memUser.addresses = [...user.addresses];
    }
    SqliteStore.upsertUser(user);
    await SupabaseStore.upsertUser(user);
    return newAddr;
  },

  // =========================
  // Chat Sessions (AI Assistant)
  // =========================
  async getChatSession(sessionKey: string, userId?: string): Promise<ChatSession | null> {
    const sbSession = await SupabaseStore.getChatSession(sessionKey, userId);
    if (sbSession !== undefined && sbSession !== null) {
      return sbSession;
    }

    try {
      const { isConnected } = await connectToDatabase();
      if (isConnected) {
        const doc = await ChatSessionModel.findOne(
          userId ? { $or: [{ userId }, { sessionKey }] } : { sessionKey, userId: { $exists: false } }
        ).lean();
        if (doc) {
          return {
            id: String(doc._id),
            userId: doc.userId,
            sessionKey: doc.sessionKey,
            messages: doc.messages || [],
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fall back to SQLite / in-memory state cleanly
    }

    const sqlSession = SqliteStore.getChatSession(sessionKey, userId);
    if (sqlSession !== undefined) {
      return sqlSession;
    }

    const session = state.chatSessions.find((s) =>
      userId ? s.userId === userId || s.sessionKey === sessionKey : s.sessionKey === sessionKey && !s.userId
    );
    return session ? { ...session, messages: [...session.messages] } : null;
  },

  async appendChatMessages(params: {
    sessionKey: string;
    userId?: string;
    newMessages: ChatMessage[];
    retentionLimit?: number;
  }): Promise<ChatSession> {
    const retentionLimit = params.retentionLimit ?? 40;
    const nowIso = new Date().toISOString();

    let session = state.chatSessions.find((s) =>
      params.userId
        ? s.userId === params.userId || s.sessionKey === params.sessionKey
        : s.sessionKey === params.sessionKey && !s.userId
    );

    if (!session) {
      const sbExisting = await SupabaseStore.getChatSession(params.sessionKey, params.userId);
      const sqlExisting = sbExisting ? null : SqliteStore.getChatSession(params.sessionKey, params.userId);
      const persistedExisting = sbExisting ?? sqlExisting;
      if (persistedExisting) {
        session = persistedExisting;
        state.chatSessions.unshift(session);
      } else {
        session = {
          id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: params.userId,
          sessionKey: params.sessionKey,
          messages: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.chatSessions.unshift(session);
      }
      if (state.chatSessions.length > 100) {
        state.chatSessions.splice(100);
      }
    }

    const combined = [...session.messages, ...params.newMessages];
    session.messages = combined.slice(-retentionLimit);
    session.updatedAt = nowIso;
    if (params.userId && !session.userId) {
      session.userId = params.userId;
    }

    SqliteStore.saveChatSession(session);
    await SupabaseStore.saveChatSession(session);

    try {
      const { isConnected } = await connectToDatabase();
      if (isConnected) {
        await ChatSessionModel.findOneAndUpdate(
          { sessionKey: params.sessionKey },
          {
            $set: {
              ...(params.userId ? { userId: params.userId } : {}),
              updatedAt: new Date(nowIso),
            },
            $push: {
              messages: {
                $each: params.newMessages,
                $slice: -retentionLimit,
              },
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch {
      // Preserve SQLite/in-memory session even if MongoDB is inactive
    }

    return { ...session, messages: [...session.messages] };
  },

  async clearChatSession(sessionKey: string, userId?: string): Promise<boolean> {
    let cleared = false;
    state.chatSessions = state.chatSessions.filter((s) => {
      const matches = userId
        ? s.userId === userId || s.sessionKey === sessionKey
        : s.sessionKey === sessionKey && !s.userId;
      if (matches) cleared = true;
      return !matches;
    });

    const sbCleared = await SupabaseStore.clearChatSession(sessionKey, userId);
    if (sbCleared) cleared = true;

    const sqlCleared = SqliteStore.clearChatSession(sessionKey, userId);
    if (sqlCleared) cleared = true;

    try {
      const { isConnected } = await connectToDatabase();
      if (isConnected) {
        await ChatSessionModel.deleteMany(
          userId ? { $or: [{ userId }, { sessionKey }] } : { sessionKey, userId: { $exists: false } }
        );
      }
    } catch {
      // Ignore DB error when using fallback
    }

    return cleared;
  },

  // =========================
  // Price History & Analytics
  // =========================
  async recordPriceHistory(
    productId: string,
    price: number,
    changedAt: string = new Date().toISOString()
  ): Promise<PriceHistoryPoint> {
    const point: PriceHistoryPoint = {
      id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId,
      price,
      changedAt,
    };
    state.priceHistory.push(point);

    await SupabaseStore.recordPriceHistory(point);

    try {
      const { isConnected } = await connectToDatabase();
      if (isConnected) {
        await PriceHistoryModel.create({
          productId,
          price,
          changedAt: new Date(changedAt),
        });
      }
    } catch {
      // Keep in-memory state consistent
    }

    return point;
  },

  async getProductPriceHistory(
    productId: string,
    days = 90
  ): Promise<ProductPriceHistorySummary | null> {
    const product = await this.getProductByIdOrSlug(productId);
    if (!product) return null;

    const resolvedId = product.id;
    let allPoints: PriceHistoryPoint[] = state.priceHistory
      .filter((pt) => pt.productId === resolvedId)
      .map((pt) => ({ ...pt }));

    const sbPoints = await SupabaseStore.getPriceHistoryByProduct(resolvedId);
    if (sbPoints && sbPoints.length > 0) {
      allPoints = sbPoints;
    } else {
      try {
        const { isConnected } = await connectToDatabase();
        if (isConnected) {
          const docs = await PriceHistoryModel.find({ productId: resolvedId })
            .sort({ changedAt: 1 })
            .lean();
          if (docs.length > 0) {
            allPoints = docs.map((d) => ({
              id: String(d._id),
              productId: d.productId,
              price: d.price,
              changedAt: new Date(d.changedAt).toISOString(),
            }));
          }
        }
      } catch {
        // Fall back to in-memory history cleanly
      }
    }

    allPoints.sort(
      (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
    );

    if (
      allPoints.length === 0 ||
      allPoints[allPoints.length - 1].price !== product.price
    ) {
      allPoints.push({
        id: `ph-live-${resolvedId}`,
        productId: resolvedId,
        price: product.price,
        changedAt: new Date().toISOString(),
      });
    }

    const nowMs = Date.now();
    const cutoffRequestedMs = nowMs - days * 24 * 60 * 60 * 1000;
    const cutoff30Ms = nowMs - 30 * 24 * 60 * 60 * 1000;
    const cutoff90Ms = nowMs - 90 * 24 * 60 * 60 * 1000;

    const pointsInWindow = (cutoffMs: number): PriceHistoryPoint[] => {
      const inRange = allPoints.filter(
        (pt) => new Date(pt.changedAt).getTime() >= cutoffMs
      );
      // Include latest preceding anchor point for continuous chart slope
      const beforeRange = allPoints.filter(
        (pt) => new Date(pt.changedAt).getTime() < cutoffMs
      );
      if (beforeRange.length > 0) {
        const anchor = beforeRange[beforeRange.length - 1];
        if (!inRange.some((pt) => pt.id === anchor.id)) {
          return [{ ...anchor, changedAt: new Date(cutoffMs).toISOString() }, ...inRange];
        }
      }
      return inRange.length > 0 ? inRange : allPoints.slice(-2);
    };

    const points30 = pointsInWindow(cutoff30Ms);
    const points90 = pointsInWindow(cutoff90Ms);
    const displayPoints = pointsInWindow(cutoffRequestedMs);

    const prices30 = points30.map((pt) => pt.price);
    const prices90 = points90.map((pt) => pt.price);

    const minPrice30d = Math.min(...prices30, product.price);
    const maxPrice30d = Math.max(...prices30, product.price);
    const minPrice90d = Math.min(...prices90, product.price);
    const maxPrice90d = Math.max(...prices90, product.price);

    const isLowestIn30Days =
      product.price <= minPrice30d && maxPrice30d > product.price;

    // Determine recent price drop relative to previous distinct price or 30d/90d peak
    const distinctPrices = allPoints.map((p) => p.price);
    const recentPeak = Math.max(maxPrice30d, ...distinctPrices.slice(-3));
    const hasRecentDrop = recentPeak > product.price;
    const dropPercentFromPeak = hasRecentDrop
      ? Math.max(1, Math.round(((recentPeak - product.price) / recentPeak) * 100))
      : 0;

    const prevDistinct = [...allPoints]
      .reverse()
      .find((pt) => pt.price !== product.price)?.price;

    return {
      productId: resolvedId,
      currentPrice: product.price,
      days,
      points: displayPoints,
      minPrice30d,
      maxPrice30d,
      minPrice90d,
      maxPrice90d,
      isLowestIn30Days,
      hasRecentDrop,
      dropPercentFromPeak,
      previousPrice: prevDistinct,
    };
  },

  async getPriceDropBadgesMap(): Promise<
    Record<string, { isLowestIn30Days: boolean; hasRecentDrop: boolean; dropPercent: number }>
  > {
    const result: Record<
      string,
      { isLowestIn30Days: boolean; hasRecentDrop: boolean; dropPercent: number }
    > = {};

    const nowMs = Date.now();
    const cutoff30Ms = nowMs - 30 * 24 * 60 * 60 * 1000;

    const sbProducts = await SupabaseStore.getAllProducts();
    const productsList = sbProducts && sbProducts.length > 0 ? sbProducts : state.products;
    const sbHistory = await SupabaseStore.getAllPriceHistoryRecent(
      new Date(nowMs - 90 * 24 * 60 * 60 * 1000).toISOString()
    );
    const historySource = sbHistory && sbHistory.length > 0 ? sbHistory : state.priceHistory;

    for (const product of productsList) {
      const pts = historySource.filter((pt) => pt.productId === product.id);
      if (pts.length === 0) continue;

      const sorted = [...pts].sort(
        (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
      );
      const recent = sorted.filter((pt) => new Date(pt.changedAt).getTime() >= cutoff30Ms);
      const before = sorted.filter((pt) => new Date(pt.changedAt).getTime() < cutoff30Ms);
      const window30 =
        before.length > 0 ? [before[before.length - 1], ...recent] : sorted;
      const prices30 = window30.map((p) => p.price);
      const min30 = Math.min(...prices30, product.price);
      const max30 = Math.max(...prices30, product.price);

      const isLowestIn30Days = product.price <= min30 && max30 > product.price;
      const hasRecentDrop = max30 > product.price;
      const dropPercent = hasRecentDrop
        ? Math.max(1, Math.round(((max30 - product.price) / max30) * 100))
        : 0;

      if (isLowestIn30Days || hasRecentDrop) {
        result[product.id] = { isLowestIn30Days, hasRecentDrop, dropPercent };
      }
    }

    return result;
  },

  // =========================
  // Price Alerts & Notifications
  // =========================
  async getPriceAlertsByUser(userId: string): Promise<PriceAlertWithProduct[]> {
    let alerts: PriceAlert[] = state.priceAlerts
      .filter((a) => a.userId === userId)
      .map((a) => ({ ...a }));

    const sbAlerts = await SupabaseStore.getPriceAlerts({ userId });
    if (sbAlerts !== null) {
      alerts = sbAlerts;
    } else {
      try {
        const { isConnected } = await connectToDatabase();
        if (isConnected) {
          const docs = await PriceAlertModel.find({ userId })
            .sort({ updatedAt: -1 })
            .lean();
          if (docs.length > 0) {
            alerts = docs.map((d) => ({
              id: String(d._id),
              userId: d.userId,
              productId: d.productId,
              priceWhenAdded: d.priceWhenAdded,
              targetPrice: d.targetPrice,
              active: d.active,
              lastNotifiedPrice: d.lastNotifiedPrice,
              createdAt: new Date(d.createdAt).toISOString(),
              updatedAt: new Date(d.updatedAt).toISOString(),
            }));
          }
        }
      } catch {
        // Fallback gracefully to in-memory alerts
      }
    }

    const enriched: PriceAlertWithProduct[] = [];
    for (const alert of alerts) {
      const product = await this.getProductByIdOrSlug(alert.productId);
      const summary = product ? await this.getProductPriceHistory(product.id, 30) : null;
      const currentPrice = product?.price ?? alert.priceWhenAdded;
      const priceDiff = alert.priceWhenAdded - currentPrice;
      const priceDiffPercent =
        alert.priceWhenAdded > 0
          ? Math.round((priceDiff / alert.priceWhenAdded) * 100)
          : 0;

      enriched.push({
        ...alert,
        product,
        priceDiff,
        priceDiffPercent,
        isLowestIn30Days: summary?.isLowestIn30Days ?? false,
      });
    }

    enriched.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return enriched;
  },

  async getAllPriceAlerts(activeOnly = true): Promise<PriceAlert[]> {
    const sbAlerts = await SupabaseStore.getPriceAlerts({ activeOnly });
    if (sbAlerts !== null) {
      return sbAlerts;
    }

    try {
      const { isConnected } = await connectToDatabase();
      if (isConnected) {
        const docs = await PriceAlertModel.find(activeOnly ? { active: true } : {}).lean();
        if (docs.length > 0) {
          return docs.map((d) => ({
            id: String(d._id),
            userId: d.userId,
            productId: d.productId,
            priceWhenAdded: d.priceWhenAdded,
            targetPrice: d.targetPrice,
            active: d.active,
            lastNotifiedPrice: d.lastNotifiedPrice,
            createdAt: new Date(d.createdAt).toISOString(),
            updatedAt: new Date(d.updatedAt).toISOString(),
          }));
        }
      }
    } catch {
      // Fallback to in-memory
    }
    return state.priceAlerts
      .filter((a) => (activeOnly ? a.active : true))
      .map((a) => ({ ...a }));
  },

  async upsertPriceAlert(params: {
    userId: string;
    productId: string;
    targetPrice?: number;
    active?: boolean;
  }): Promise<PriceAlert | null> {
    const product = await this.getProductByIdOrSlug(params.productId);
    if (!product) return null;

    const nowIso = new Date().toISOString();
    const sbExisting = await SupabaseStore.findPriceAlert(params.userId, product.id);
    const memExisting = state.priceAlerts.find(
      (a) => a.userId === params.userId && a.productId === product.id
    );
    const existing = sbExisting ?? memExisting;

    let savedAlert: PriceAlert;
    if (existing) {
      const updatedAlert: PriceAlert = {
        ...existing,
        targetPrice: params.targetPrice !== undefined ? params.targetPrice : existing.targetPrice,
        active: params.active !== undefined ? params.active : true,
        updatedAt: nowIso,
      };
      if (memExisting) {
        Object.assign(memExisting, updatedAlert);
      } else {
        state.priceAlerts.unshift(updatedAlert);
      }
      savedAlert = updatedAlert;
    } else {
      savedAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: params.userId,
        productId: product.id,
        priceWhenAdded: product.price,
        targetPrice: params.targetPrice,
        active: params.active ?? true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.priceAlerts.unshift(savedAlert);
    }

    const sbSaved = await SupabaseStore.upsertPriceAlert(savedAlert);
    if (sbSaved) {
      savedAlert = sbSaved;
    } else {
      try {
        const { isConnected } = await connectToDatabase();
        if (isConnected) {
          const doc = await PriceAlertModel.findOneAndUpdate(
            { userId: params.userId, productId: product.id },
            {
              $set: {
                active: savedAlert.active,
                ...(params.targetPrice !== undefined ? { targetPrice: params.targetPrice } : {}),
              },
              $setOnInsert: {
                priceWhenAdded: product.price,
              },
            },
            { upsert: true, new: true }
          ).lean();
          if (doc) {
            savedAlert = {
              id: String(doc._id),
              userId: doc.userId,
              productId: doc.productId,
              priceWhenAdded: doc.priceWhenAdded,
              targetPrice: doc.targetPrice,
              active: doc.active,
              lastNotifiedPrice: doc.lastNotifiedPrice,
              createdAt: new Date(doc.createdAt).toISOString(),
              updatedAt: new Date(doc.updatedAt).toISOString(),
            };
          }
        }
      } catch {
        // Preserve in-memory alert
      }
    }

    return savedAlert;
  },

  async updatePriceAlert(
    userId: string,
    alertId: string,
    updates: { targetPrice?: number | null; active?: boolean }
  ): Promise<PriceAlert | null> {
    const sbExisting = await SupabaseStore.findPriceAlert(userId, alertId);
    const memAlert = state.priceAlerts.find(
      (a) => a.userId === userId && (a.id === alertId || a.productId === alertId)
    );
    const alert = sbExisting ? { ...sbExisting } : memAlert;
    if (!alert) return null;

    if (updates.targetPrice === null) {
      alert.targetPrice = undefined;
    } else if (updates.targetPrice !== undefined) {
      alert.targetPrice = updates.targetPrice;
    }

    if (updates.active !== undefined) {
      alert.active = updates.active;
    }
    alert.updatedAt = new Date().toISOString();

    if (memAlert) {
      Object.assign(memAlert, alert);
    }

    const sbUpdated = await SupabaseStore.upsertPriceAlert(alert);
    if (sbUpdated) {
      return sbUpdated;
    }

    try {
      const { isConnected } = await connectToDatabase();
      if (isConnected) {
        const unsetObj = updates.targetPrice === null ? { $unset: { targetPrice: '' } } : {};
        await PriceAlertModel.findOneAndUpdate(
          { userId, productId: alert.productId },
          {
            $set: {
              active: alert.active,
              ...(typeof updates.targetPrice === 'number'
                ? { targetPrice: updates.targetPrice }
                : {}),
            },
            ...unsetObj,
          }
        );
      }
    } catch {
      // Keep in-memory consistent
    }

    return { ...alert };
  },

  async deletePriceAlert(userId: string, alertIdOrProductId: string): Promise<boolean> {
    const before = state.priceAlerts.length;
    const removed = state.priceAlerts.find(
      (a) =>
        a.userId === userId &&
        (a.id === alertIdOrProductId || a.productId === alertIdOrProductId)
    );
    state.priceAlerts = state.priceAlerts.filter(
      (a) =>
        !(
          a.userId === userId &&
          (a.id === alertIdOrProductId || a.productId === alertIdOrProductId)
        )
    );

    const sbDeleted = await SupabaseStore.deletePriceAlert(
      userId,
      alertIdOrProductId,
      removed?.productId
    );

    try {
      const { isConnected } = await connectToDatabase();
      if (isConnected) {
        await PriceAlertModel.deleteMany({
          userId,
          $or: [{ _id: alertIdOrProductId }, { productId: removed?.productId ?? alertIdOrProductId }],
        });
      }
    } catch {
      // Ignore DB failure in fallback mode
    }

    return Boolean(sbDeleted) || state.priceAlerts.length < before;
  },

  async getAlertDemandStats(): Promise<Record<string, ProductAlertDemandStat>> {
    const stats: Record<string, ProductAlertDemandStat> = {};
    const allAlerts = await this.getAllPriceAlerts(false);

    for (const alert of allAlerts) {
      const entry = stats[alert.productId] ?? {
        productId: alert.productId,
        activeAlertsCount: 0,
        totalAlertsCount: 0,
      };
      entry.totalAlertsCount += 1;
      if (alert.active) {
        entry.activeAlertsCount += 1;
      }
      stats[alert.productId] = entry;
    }

    return stats;
  },

  async createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    productId?: string;
    productSlug?: string;
  }): Promise<AppNotification> {
    const notification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      productId: params.productId,
      productSlug: params.productSlug,
      read: false,
      createdAt: new Date().toISOString(),
    };

    state.notifications.unshift(notification);
    if (state.notifications.length > 200) {
      state.notifications.splice(200);
    }

    const sbCreated = await SupabaseStore.createNotification(notification);
    if (!sbCreated) {
      try {
        const { isConnected } = await connectToDatabase();
        if (isConnected) {
          const doc = await NotificationModel.create({
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            productId: params.productId,
            productSlug: params.productSlug,
            read: false,
          });
          notification.id = String(doc._id);
        }
      } catch {
        // Preserve in-memory notification
      }
    }

    return notification;
  },

  async getNotificationsByUser(
    userId: string,
    limit = 30
  ): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    let items: AppNotification[] = state.notifications
      .filter((n) => n.userId === userId)
      .slice(0, limit)
      .map((n) => ({ ...n }));

    const sbItems = await SupabaseStore.getNotificationsByUser(userId, limit);
    if (sbItems !== null) {
      items = sbItems;
    } else {
      try {
        const { isConnected } = await connectToDatabase();
        if (isConnected) {
          const docs = await NotificationModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
          if (docs.length > 0) {
            items = docs.map((d) => ({
              id: String(d._id),
              userId: d.userId,
              type: d.type,
              title: d.title,
              message: d.message,
              productId: d.productId,
              productSlug: d.productSlug,
              read: d.read,
              createdAt: new Date(d.createdAt).toISOString(),
            }));
          }
        }
      } catch {
        // Fall back to in-memory notifications
      }
    }

    const unreadCount = items.filter((n) => !n.read).length;
    return { notifications: items, unreadCount };
  },

  async markNotificationsRead(
    userId: string,
    notificationId?: string
  ): Promise<{ updated: number }> {
    let updated = 0;
    for (const notif of state.notifications) {
      if (notif.userId === userId && (!notificationId || notif.id === notificationId)) {
        if (!notif.read) {
          notif.read = true;
          updated += 1;
        }
      }
    }

    const sbUpdated = await SupabaseStore.markNotificationsRead(userId, notificationId);
    if (sbUpdated !== null) {
      updated = Math.max(updated, sbUpdated);
    } else {
      try {
        const { isConnected } = await connectToDatabase();
        if (isConnected) {
          const filter = notificationId
            ? { userId, _id: notificationId }
            : { userId, read: false };
          await NotificationModel.updateMany(filter, { $set: { read: true } });
        }
      } catch {
        // Preserve in-memory update
      }
    }

    return { updated };
  },

  async evaluateAlertsForProduct(
    product: Product,
    previousPrice?: number
  ): Promise<number> {
    const newPrice = product.price;
    const allActive = await this.getAllPriceAlerts(true);
    const alerts = allActive.filter((a) => a.productId === product.id);

    let notificationsCreated = 0;

    for (const alert of alerts) {
      const meetsTarget =
        alert.targetPrice !== undefined
          ? newPrice <= alert.targetPrice
          : newPrice < alert.priceWhenAdded;

      const dropsBelowBaseline = newPrice < alert.priceWhenAdded;

      // Require threshold condition and prevent duplicate/spam if already notified at <= newPrice
      const qualifiesForThreshold =
        alert.targetPrice !== undefined ? meetsTarget : dropsBelowBaseline;
      const notYetNotifiedLower =
        alert.lastNotifiedPrice === undefined || newPrice < alert.lastNotifiedPrice;

      if (!qualifiesForThreshold || !notYetNotifiedLower) {
        continue;
      }

      const baseline = Math.max(
        alert.priceWhenAdded,
        previousPrice ?? alert.priceWhenAdded
      );
      const dropPercent =
        baseline > newPrice
          ? Math.max(1, Math.round(((baseline - newPrice) / baseline) * 100))
          : 1;

      const targetNote =
        alert.targetPrice !== undefined && newPrice <= alert.targetPrice
          ? ` (reached your ₹${alert.targetPrice.toLocaleString('en-IN')} target!)`
          : '';

      await this.createNotification({
        userId: alert.userId,
        type: 'price_drop',
        title: `Price Drop: ${dropPercent}% OFF on ${product.brand}`,
        message: `${product.name} dropped from ₹${baseline.toLocaleString('en-IN')} to ₹${newPrice.toLocaleString('en-IN')}${targetNote}`,
        productId: product.id,
        productSlug: product.slug,
      });

      const memAlert = state.priceAlerts.find(
        (a) => a.userId === alert.userId && a.productId === alert.productId
      );
      if (memAlert) {
        memAlert.lastNotifiedPrice = newPrice;
        memAlert.updatedAt = new Date().toISOString();
      }
      notificationsCreated += 1;

      const sbUpdatedAlert = await SupabaseStore.updatePriceAlertLastNotified(
        alert.userId,
        alert.productId,
        newPrice
      );
      if (!sbUpdatedAlert) {
        try {
          const { isConnected } = await connectToDatabase();
          if (isConnected) {
            await PriceAlertModel.updateOne(
              { userId: alert.userId, productId: alert.productId },
              { $set: { lastNotifiedPrice: newPrice } }
            );
          }
        } catch {
          // Keep in-memory lastNotifiedPrice updated
        }
      }

      const recipient = await this.findUserById(alert.userId);
      if (recipient?.email) {
        void dispatchExternalPriceDropChannels({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          recipientPhone: recipient.phone,
          userId: recipient.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          oldPrice: baseline,
          newPrice,
          dropPercent,
          targetPrice: alert.targetPrice,
        });
      }
    }

    return notificationsCreated;
  },

  async bulkUpdateProductPrices(
    updates: Array<{ productId: string; price: number; mrp?: number }>
  ): Promise<{ updatedCount: number; notificationsCreated: number }> {
    let updatedCount = 0;
    let notificationsCreated = 0;

    for (const item of updates) {
      const before = await this.getProductByIdOrSlug(item.productId);
      if (!before) continue;

      const previousPrice = before.price;
      const beforeNotifs = state.notifications.length;
      const updated = await this.updateProduct(item.productId, {
        price: item.price,
        ...(item.mrp !== undefined ? { mrp: item.mrp } : {}),
      });

      if (updated) {
        updatedCount += 1;
        if (item.price < previousPrice) {
          notificationsCreated += Math.max(0, state.notifications.length - beforeNotifs);
        }
      }
    }

    return { updatedCount, notificationsCreated };
  },

  async runDailyPriceAlertSafetyCheck(): Promise<{
    checkedAlerts: number;
    notificationsCreated: number;
    checkedAt: string;
  }> {
    const activeAlerts = await this.getAllPriceAlerts(true);
    const seenProductIds = new Set<string>();
    let notificationsCreated = 0;

    for (const alert of activeAlerts) {
      if (seenProductIds.has(alert.productId)) continue;
      seenProductIds.add(alert.productId);

      const product = await this.getProductByIdOrSlug(alert.productId);
      if (!product) continue;

      const created = await this.evaluateAlertsForProduct(product);
      notificationsCreated += created;
    }

    return {
      checkedAlerts: activeAlerts.length,
      notificationsCreated,
      checkedAt: new Date().toISOString(),
    };
  },
};

