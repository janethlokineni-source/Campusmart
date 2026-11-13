import {
  Address,
  AppNotification,
  Category,
  ChatMessage,
  ChatSession,
  Coupon,
  DateOverride,
  Model3dType,
  NotificationType,
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineStep,
  PriceAlert,
  PriceHistoryPoint,
  Product,
  Review,
  Role,
  StoreSettings,
  User,
} from '@/types';
import { getSupabaseAdminClient, checkSupabaseHealth, isSupabaseConfigured } from './supabase';
import {
  INITIAL_ADMIN_USER,
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_CUSTOMER_USER,
  INITIAL_PRODUCTS,
  getInitialChatSessions,
  getInitialNotifications,
  getInitialPriceAlerts,
  getInitialPriceHistory,
} from './seedData';
import { DEFAULT_STORE_SETTINGS } from './storeStatus';

// =========================
// PostgreSQL Row Types (Strict, Zero `any`)
// =========================
export interface DbUserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  student_id: string | null;
  role: Role;
  phone: string | null;
  addresses: Address[];
  created_at: string;
}

export interface DbCategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
  item_count: number;
}

export interface DbProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  discount_percent: number;
  category: string;
  brand: string;
  rating: number;
  review_count: number;
  images: string[];
  model3d_url: string | null;
  model3d_type: Model3dType | null;
  stock: number;
  specs: Record<string, string>;
  tags: string[];
  is_cafeteria: boolean | null;
  is_veg: boolean | null;
  badge: Product['badge'] | null;
  created_at: string;
}

export interface DbOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  address: Address;
  delivery_slot: string;
  payment_method: 'COD';
  payment_status: 'pending' | 'paid';
  order_status: OrderStatus;
  status_timeline: OrderTimelineStep[];
  subtotal: number;
  mrp_total: number;
  discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  delivery_fee: number;
  platform_fee: number;
  total_amount: number;
  cancellation_reason: string | null;
  created_at: string;
}

export interface DbCouponRow {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  expires_at: string;
  is_active: boolean;
  description: string;
}

export interface DbReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface DbStoreSettingsRow {
  id: string;
  open_days: number[];
  open_time: string;
  close_time: string;
  timezone: string;
  overrides: DateOverride[];
  weekend_notice: string;
  updated_at: string;
}

export interface DbChatSessionRow {
  id: string;
  user_id: string | null;
  session_key: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface DbPriceAlertRow {
  id: string;
  user_id: string;
  product_id: string;
  price_when_added: number;
  target_price: number | null;
  active: boolean;
  last_notified_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbPriceHistoryRow {
  id: string;
  product_id: string;
  price: number;
  changed_at: string;
}

export interface DbNotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  product_id: string | null;
  product_slug: string | null;
  read: boolean;
  created_at: string;
}

export type StoredUser = User & { passwordHash: string };

// =========================
// Pure Mappers
// =========================
export function mapRowToUser(row: DbUserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    studentId: row.student_id ?? undefined,
    role: row.role,
    phone: row.phone ?? undefined,
    addresses: Array.isArray(row.addresses) ? row.addresses : [],
    createdAt: row.created_at,
  };
}

export function mapUserToRow(user: StoredUser): DbUserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase(),
    password_hash: user.passwordHash,
    student_id: user.studentId ?? null,
    role: user.role,
    phone: user.phone ?? null,
    addresses: user.addresses ?? [],
    created_at: user.createdAt,
  };
}

export function mapRowToCategory(row: DbCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    description: row.description,
    image: row.image,
    itemCount: Number(row.item_count ?? 0),
  };
}

export function mapCategoryToRow(cat: Category): DbCategoryRow {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    description: cat.description,
    image: cat.image,
    item_count: cat.itemCount,
  };
}

export function mapRowToProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    mrp: Number(row.mrp),
    discountPercent: Number(row.discount_percent ?? 0),
    category: row.category,
    brand: row.brand,
    rating: Number(row.rating ?? 4.5),
    reviewCount: Number(row.review_count ?? 0),
    images: Array.isArray(row.images) ? row.images : [],
    model3dUrl: row.model3d_url ?? undefined,
    model3dType: row.model3d_type ?? undefined,
    stock: Number(row.stock ?? 0),
    specs: row.specs ?? {},
    tags: Array.isArray(row.tags) ? row.tags : [],
    isCafeteria: row.is_cafeteria ?? undefined,
    isVeg: row.is_veg ?? undefined,
    badge: row.badge ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapProductToRow(product: Product): DbProductRow {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    mrp: product.mrp,
    discount_percent: product.discountPercent,
    category: product.category,
    brand: product.brand,
    rating: product.rating,
    review_count: product.reviewCount,
    images: product.images ?? [],
    model3d_url: product.model3dUrl ?? null,
    model3d_type: product.model3dType ?? null,
    stock: product.stock,
    specs: product.specs ?? {},
    tags: product.tags ?? [],
    is_cafeteria: product.isCafeteria ?? false,
    is_veg: product.isVeg ?? null,
    badge: product.badge ?? null,
    created_at: product.createdAt,
  };
}

export function mapRowToOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id ?? undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    items: Array.isArray(row.items) ? row.items : [],
    address: row.address,
    deliverySlot: row.delivery_slot,
    paymentMethod: 'COD',
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    statusTimeline: Array.isArray(row.status_timeline) ? row.status_timeline : [],
    subtotal: Number(row.subtotal),
    mrpTotal: Number(row.mrp_total),
    discount: Number(row.discount ?? 0),
    couponCode: row.coupon_code ?? undefined,
    couponDiscount: Number(row.coupon_discount ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    platformFee: Number(row.platform_fee ?? 0),
    totalAmount: Number(row.total_amount),
    cancellationReason: row.cancellation_reason ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapOrderToRow(order: Order): DbOrderRow {
  return {
    id: order.id,
    order_number: order.orderNumber,
    user_id: order.userId ?? null,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    items: order.items,
    address: order.address,
    delivery_slot: order.deliverySlot,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    status_timeline: order.statusTimeline,
    subtotal: order.subtotal,
    mrp_total: order.mrpTotal,
    discount: order.discount,
    coupon_code: order.couponCode ?? null,
    coupon_discount: order.couponDiscount,
    delivery_fee: order.deliveryFee,
    platform_fee: order.platformFee,
    total_amount: order.totalAmount,
    cancellation_reason: order.cancellationReason ?? null,
    created_at: order.createdAt,
  };
}

export function mapRowToCoupon(row: DbCouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderValue: Number(row.min_order_value ?? 0),
    maxDiscount: row.max_discount !== null ? Number(row.max_discount) : undefined,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    description: row.description,
  };
}

export function mapCouponToRow(coupon: Coupon): DbCouponRow {
  return {
    id: coupon.id,
    code: coupon.code.toUpperCase(),
    discount_type: coupon.discountType,
    discount_value: coupon.discountValue,
    min_order_value: coupon.minOrderValue,
    max_discount: coupon.maxDiscount ?? null,
    expires_at: coupon.expiresAt,
    is_active: coupon.isActive,
    description: coupon.description,
  };
}

export function mapRowToReview(row: DbReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: Number(row.rating),
    comment: row.comment,
    verifiedPurchase: row.verified_purchase,
    createdAt: row.created_at,
  };
}

export function mapReviewToRow(review: Review): DbReviewRow {
  return {
    id: review.id,
    product_id: review.productId,
    user_id: review.userId,
    user_name: review.userName,
    rating: review.rating,
    comment: review.comment,
    verified_purchase: review.verifiedPurchase,
    created_at: review.createdAt,
  };
}

export function mapRowToStoreSettings(row: DbStoreSettingsRow): StoreSettings {
  return {
    openDays: Array.isArray(row.open_days) ? row.open_days : DEFAULT_STORE_SETTINGS.openDays,
    openTime: row.open_time,
    closeTime: row.close_time,
    timezone: row.timezone,
    overrides: Array.isArray(row.overrides) ? row.overrides : [],
    weekendNotice: row.weekend_notice,
    updatedAt: row.updated_at,
  };
}

export function mapStoreSettingsToRow(settings: StoreSettings): DbStoreSettingsRow {
  return {
    id: 'default',
    open_days: settings.openDays,
    open_time: settings.openTime,
    close_time: settings.closeTime,
    timezone: settings.timezone,
    overrides: settings.overrides,
    weekend_notice: settings.weekendNotice,
    updated_at: settings.updatedAt,
  };
}

export function mapRowToChatSession(row: DbChatSessionRow): ChatSession {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    sessionKey: row.session_key,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowToPriceAlert(row: DbPriceAlertRow): PriceAlert {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    priceWhenAdded: Number(row.price_when_added),
    targetPrice: row.target_price !== null ? Number(row.target_price) : undefined,
    active: row.active,
    lastNotifiedPrice:
      row.last_notified_price !== null ? Number(row.last_notified_price) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowToPriceHistory(row: DbPriceHistoryRow): PriceHistoryPoint {
  return {
    id: row.id,
    productId: row.product_id,
    price: Number(row.price),
    changedAt: row.changed_at,
  };
}

export function mapRowToNotification(row: DbNotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    productId: row.product_id ?? undefined,
    productSlug: row.product_slug ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}

// =========================
// Safe Filter Helper
// =========================
function quotePostgrestValue(raw: string): string {
  const sanitized = raw.replace(/[\r\n\u0000]/g, '').trim();
  const escaped = sanitized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

// =========================
// Auto-Bootstrap / Seed Sync
// =========================
let autoBootstrapAttempted = false;

async function getReadyClient() {
  if (!isSupabaseConfigured()) return null;
  const health = await checkSupabaseHealth();
  if (!health.schemaReady) return null;
  return getSupabaseAdminClient();
}

export interface SupabaseSyncSummary {
  success: boolean;
  categoriesSynced: number;
  productsSynced: number;
  couponsSynced: number;
  usersSynced: number;
  priceHistorySynced: number;
  priceAlertsSynced: number;
  notificationsSynced: number;
  chatSessionsSynced: number;
  error?: string;
}

async function upsertInChunks<T extends object>(
  table: string,
  rows: T[],
  onConflict: string,
  ignoreDuplicates = false
): Promise<boolean> {
  const client = getSupabaseAdminClient();
  if (!client || rows.length === 0) return true;

  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client
      .from(table)
      .upsert(chunk, { onConflict, ignoreDuplicates });
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
  return true;
}

export async function syncSeedDataToSupabase(force = false): Promise<SupabaseSyncSummary> {
  const emptyResult: SupabaseSyncSummary = {
    success: false,
    categoriesSynced: 0,
    productsSynced: 0,
    couponsSynced: 0,
    usersSynced: 0,
    priceHistorySynced: 0,
    priceAlertsSynced: 0,
    notificationsSynced: 0,
    chatSessionsSynced: 0,
  };

  try {
    const health = await checkSupabaseHealth(force);
    if (!health.configured) {
      return { ...emptyResult, error: 'Supabase environment variables are not configured.' };
    }
    if (!health.schemaReady) {
      return {
        ...emptyResult,
        error: health.error || 'Supabase tables are not initialized. Run supabase/schema.sql first.',
      };
    }

    const client = getSupabaseAdminClient();
    if (!client) {
      return { ...emptyResult, error: 'Supabase admin client unavailable.' };
    }

    const categoryRows = INITIAL_CATEGORIES.map(mapCategoryToRow);
    const productRows = INITIAL_PRODUCTS.map(mapProductToRow);
    const couponRows = INITIAL_COUPONS.map(mapCouponToRow);
    const userRows = [INITIAL_ADMIN_USER, INITIAL_CUSTOMER_USER].map(mapUserToRow);
    const settingsRow = mapStoreSettingsToRow({ ...DEFAULT_STORE_SETTINGS });
    const priceHistoryRows: DbPriceHistoryRow[] = getInitialPriceHistory().map((pt) => ({
      id: pt.id,
      product_id: pt.productId,
      price: pt.price,
      changed_at: pt.changedAt,
    }));
    const priceAlertRows: DbPriceAlertRow[] = getInitialPriceAlerts().map((a) => ({
      id: a.id,
      user_id: a.userId,
      product_id: a.productId,
      price_when_added: a.priceWhenAdded,
      target_price: a.targetPrice ?? null,
      active: a.active,
      last_notified_price: a.lastNotifiedPrice ?? null,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    }));
    const notificationRows: DbNotificationRow[] = getInitialNotifications().map((n) => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      product_id: n.productId ?? null,
      product_slug: n.productSlug ?? null,
      read: n.read,
      created_at: n.createdAt,
    }));
    const chatSessionRows: DbChatSessionRow[] = getInitialChatSessions().map((s) => ({
      id: s.id,
      user_id: s.userId ?? null,
      session_key: s.sessionKey,
      messages: s.messages,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));

    await upsertInChunks('categories', categoryRows, 'id', !force);
    await upsertInChunks('products', productRows, 'id', !force);
    await upsertInChunks('coupons', couponRows, 'id', true);
    await upsertInChunks('users', userRows, 'email', true);
    await upsertInChunks('store_settings', [settingsRow], 'id', true);
    await upsertInChunks('price_history', priceHistoryRows, 'id', true);
    await upsertInChunks('price_alerts', priceAlertRows, 'user_id,product_id', true);
    await upsertInChunks('notifications', notificationRows, 'id', true);
    await upsertInChunks('chat_sessions', chatSessionRows, 'session_key', true);

    return {
      success: true,
      categoriesSynced: categoryRows.length,
      productsSynced: productRows.length,
      couponsSynced: couponRows.length,
      usersSynced: userRows.length,
      priceHistorySynced: priceHistoryRows.length,
      priceAlertsSynced: priceAlertRows.length,
      notificationsSynced: notificationRows.length,
      chatSessionsSynced: chatSessionRows.length,
    };
  } catch (err) {
    return {
      ...emptyResult,
      error: err instanceof Error ? err.message : 'Failed to sync seed data to Supabase',
    };
  }
}

export async function ensureSupabaseBootstrapped(): Promise<boolean> {
  const client = await getReadyClient();
  if (!client) return false;

  if (!autoBootstrapAttempted) {
    autoBootstrapAttempted = true;
    const { data, error } = await client.from('products').select('id').limit(1);
    if (!error && (!data || data.length === 0)) {
      await syncSeedDataToSupabase(false);
    }
  }
  return true;
}

// =========================
// Domain Operations for DataStore
// =========================
export const SupabaseStore = {
  async isAvailable(): Promise<boolean> {
    return await ensureSupabaseBootstrapped();
  },

  async getAllProducts(): Promise<Product[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    await ensureSupabaseBootstrapped();
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    return (data as DbProductRow[]).map(mapRowToProduct);
  },

  async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null | undefined> {
    const client = await getReadyClient();
    if (!client) return undefined;
    await ensureSupabaseBootstrapped();
    const q = quotePostgrestValue(idOrSlug);
    const { data, error } = await client
      .from('products')
      .select('*')
      .or(`id.eq.${q},slug.eq.${q}`)
      .limit(1);
    if (error) return undefined;
    if (!data || data.length === 0) return null;
    return mapRowToProduct(data[0] as DbProductRow);
  },

  async createProduct(product: Product): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client.from('products').insert(mapProductToRow(product));
    return !error;
  },

  async updateProduct(product: Product): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client
      .from('products')
      .update(mapProductToRow(product))
      .eq('id', product.id);
    return !error;
  },

  async deleteProduct(id: string): Promise<boolean | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const { error } = await client.from('products').delete().eq('id', id);
    return !error;
  },

  async getCategories(): Promise<Category[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    await ensureSupabaseBootstrapped();
    const { data, error } = await client.from('categories').select('*');
    if (error || !data || data.length === 0) return null;
    return (data as DbCategoryRow[]).map(mapRowToCategory);
  },

  async getStoreSettings(): Promise<StoreSettings | null> {
    const client = await getReadyClient();
    if (!client) return null;
    await ensureSupabaseBootstrapped();
    const { data, error } = await client
      .from('store_settings')
      .select('*')
      .eq('id', 'default')
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return mapRowToStoreSettings(data[0] as DbStoreSettingsRow);
  },

  async updateStoreSettings(settings: StoreSettings): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client
      .from('store_settings')
      .upsert(mapStoreSettingsToRow(settings), { onConflict: 'id' });
    return !error;
  },

  async getOrders(userId?: string): Promise<Order[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    let query = client.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;
    return (data as DbOrderRow[]).map(mapRowToOrder);
  },

  async getOrderById(idOrOrderNumber: string): Promise<Order | null | undefined> {
    const client = await getReadyClient();
    if (!client) return undefined;
    const q = quotePostgrestValue(idOrOrderNumber);
    const { data, error } = await client
      .from('orders')
      .select('*')
      .or(`id.eq.${q},order_number.eq.${q}`)
      .limit(1);
    if (error) return undefined;
    if (!data || data.length === 0) return null;
    return mapRowToOrder(data[0] as DbOrderRow);
  },

  async createOrder(order: Order): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client.from('orders').insert(mapOrderToRow(order));
    return !error;
  },

  async updateOrder(order: Order): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client
      .from('orders')
      .update({
        order_status: order.orderStatus,
        status_timeline: order.statusTimeline,
        payment_status: order.paymentStatus,
        cancellation_reason: order.cancellationReason ?? null,
      })
      .eq('id', order.id);
    return !error;
  },

  async getCoupons(): Promise<Coupon[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    await ensureSupabaseBootstrapped();
    const { data, error } = await client.from('coupons').select('*');
    if (error || !data) return null;
    return (data as DbCouponRow[]).map(mapRowToCoupon);
  },

  async createCoupon(coupon: Coupon): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client
      .from('coupons')
      .upsert(mapCouponToRow(coupon), { onConflict: 'code' });
    return !error;
  },

  async getReviews(productId: string): Promise<Review[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return (data as DbReviewRow[]).map(mapRowToReview);
  },

  async addReview(review: Review): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client.from('reviews').insert(mapReviewToRow(review));
    return !error;
  },

  async getAllUsers(): Promise<StoredUser[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    await ensureSupabaseBootstrapped();
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    if (error || !data) return null;
    return (data as DbUserRow[]).map(mapRowToUser);
  },

  async findUserById(id: string): Promise<StoredUser | null | undefined> {
    const client = await getReadyClient();
    if (!client) return undefined;
    await ensureSupabaseBootstrapped();
    const { data, error } = await client.from('users').select('*').eq('id', id).limit(1);
    if (error) return undefined;
    if (!data || data.length === 0) return null;
    return mapRowToUser(data[0] as DbUserRow);
  },

  async findUserByEmail(email: string): Promise<StoredUser | null | undefined> {
    const client = await getReadyClient();
    if (!client) return undefined;
    await ensureSupabaseBootstrapped();
    const { data, error } = await client
      .from('users')
      .select('*')
      .ilike('email', email.trim())
      .limit(1);
    if (error) return undefined;
    if (!data || data.length === 0) return null;
    return mapRowToUser(data[0] as DbUserRow);
  },

  async findUserByIdentifier(identifier: string): Promise<StoredUser | null | undefined> {
    const client = await getReadyClient();
    if (!client) return undefined;
    await ensureSupabaseBootstrapped();

    const raw = identifier.trim();
    const cleanLower = raw.toLowerCase();
    const effectiveEmail =
      cleanLower === 'admin@campusmart.edu' ? 'admin@gmail.com' : cleanLower;

    const { data: exactMatches, error } = await client
      .from('users')
      .select('*')
      .or(
        `email.ilike.${quotePostgrestValue(effectiveEmail)},student_id.ilike.${quotePostgrestValue(cleanLower)}`
      )
      .limit(1);

    if (error) return undefined;
    if (exactMatches && exactMatches.length > 0) {
      return mapRowToUser(exactMatches[0] as DbUserRow);
    }

    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7) {
      const users = await this.getAllUsers();
      if (!users) return undefined;
      return (
        users.find((u) => {
          if (!u.phone) return false;
          const uDigits = u.phone.replace(/\D/g, '');
          return uDigits === digits || uDigits.endsWith(digits) || digits.endsWith(uDigits);
        }) ?? null
      );
    }

    return null;
  },

  async findUserByPhone(phone: string): Promise<StoredUser | null | undefined> {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    const users = await this.getAllUsers();
    if (!users) return undefined;
    return (
      users.find((u) => {
        if (!u.phone) return false;
        const uDigits = u.phone.replace(/\D/g, '');
        return (
          uDigits === digits ||
          (digits.length >= 10 && uDigits.endsWith(digits.slice(-10)))
        );
      }) ?? null
    );
  },

  async upsertUser(user: StoredUser): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client.from('users').upsert(mapUserToRow(user), { onConflict: 'id' });
    return !error;
  },

  async getChatSession(sessionKey: string, userId?: string): Promise<ChatSession | null | undefined> {
    const client = await getReadyClient();
    if (!client) return undefined;
    const qKey = quotePostgrestValue(sessionKey);
    const filter = userId
      ? `user_id.eq.${quotePostgrestValue(userId)},session_key.eq.${qKey}`
      : `session_key.eq.${qKey}`;
    const { data, error } = await client
      .from('chat_sessions')
      .select('*')
      .or(filter)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) return undefined;
    if (!data || data.length === 0) return null;
    return mapRowToChatSession(data[0] as DbChatSessionRow);
  },

  async saveChatSession(session: ChatSession): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client.from('chat_sessions').upsert(
      {
        id: session.id,
        user_id: session.userId ?? null,
        session_key: session.sessionKey,
        messages: session.messages,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      },
      { onConflict: 'session_key' }
    );
    return !error;
  },

  async clearChatSession(sessionKey: string, userId?: string): Promise<boolean | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const qKey = quotePostgrestValue(sessionKey);
    const filter = userId
      ? `user_id.eq.${quotePostgrestValue(userId)},session_key.eq.${qKey}`
      : `session_key.eq.${qKey}`;
    const { error } = await client.from('chat_sessions').delete().or(filter);
    return !error;
  },

  async recordPriceHistory(point: PriceHistoryPoint): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client.from('price_history').insert({
      id: point.id,
      product_id: point.productId,
      price: point.price,
      changed_at: point.changedAt,
    });
    return !error;
  },

  async getPriceHistoryByProduct(productId: string): Promise<PriceHistoryPoint[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const { data, error } = await client
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('changed_at', { ascending: true });
    if (error || !data) return null;
    return (data as DbPriceHistoryRow[]).map(mapRowToPriceHistory);
  },

  async getAllPriceHistoryRecent(cutoffIso: string): Promise<PriceHistoryPoint[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const { data, error } = await client
      .from('price_history')
      .select('*')
      .gte('changed_at', cutoffIso)
      .order('changed_at', { ascending: true });
    if (error || !data) return null;
    return (data as DbPriceHistoryRow[]).map(mapRowToPriceHistory);
  },

  async getPriceAlerts(params?: { userId?: string; activeOnly?: boolean }): Promise<PriceAlert[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    let query = client.from('price_alerts').select('*').order('updated_at', { ascending: false });
    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params?.activeOnly) {
      query = query.eq('active', true);
    }
    const { data, error } = await query;
    if (error || !data) return null;
    return (data as DbPriceAlertRow[]).map(mapRowToPriceAlert);
  },

  async findPriceAlert(
    userId: string,
    idOrProductId: string
  ): Promise<PriceAlert | null | undefined> {
    const client = await getReadyClient();
    if (!client) return undefined;
    const q = quotePostgrestValue(idOrProductId);
    const { data, error } = await client
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .or(`id.eq.${q},product_id.eq.${q}`)
      .limit(1);
    if (error) return undefined;
    if (!data || data.length === 0) return null;
    return mapRowToPriceAlert(data[0] as DbPriceAlertRow);
  },

  async updatePriceAlertLastNotified(
    userId: string,
    productId: string,
    lastNotifiedPrice: number
  ): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client
      .from('price_alerts')
      .update({
        last_notified_price: lastNotifiedPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('product_id', productId);
    return !error;
  },

  async upsertPriceAlert(alert: PriceAlert): Promise<PriceAlert | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const { data, error } = await client
      .from('price_alerts')
      .upsert(
        {
          id: alert.id,
          user_id: alert.userId,
          product_id: alert.productId,
          price_when_added: alert.priceWhenAdded,
          target_price: alert.targetPrice ?? null,
          active: alert.active,
          last_notified_price: alert.lastNotifiedPrice ?? null,
          created_at: alert.createdAt,
          updated_at: alert.updatedAt,
        },
        { onConflict: 'user_id,product_id' }
      )
      .select('*')
      .single();
    if (error || !data) return null;
    return mapRowToPriceAlert(data as DbPriceAlertRow);
  },

  async deletePriceAlert(userId: string, alertIdOrProductId: string, resolvedProductId?: string): Promise<boolean | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const targetPid = resolvedProductId ?? alertIdOrProductId;
    const { error } = await client
      .from('price_alerts')
      .delete()
      .eq('user_id', userId)
      .or(`id.eq.${quotePostgrestValue(alertIdOrProductId)},product_id.eq.${quotePostgrestValue(targetPid)}`);
    return !error;
  },

  async createNotification(notification: AppNotification): Promise<boolean> {
    const client = await getReadyClient();
    if (!client) return false;
    const { error } = await client.from('notifications').insert({
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      product_id: notification.productId ?? null,
      product_slug: notification.productSlug ?? null,
      read: notification.read,
      created_at: notification.createdAt,
    });
    return !error;
  },

  async getNotificationsByUser(userId: string, limit: number): Promise<AppNotification[] | null> {
    const client = await getReadyClient();
    if (!client) return null;
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return null;
    return (data as DbNotificationRow[]).map(mapRowToNotification);
  },

  async markNotificationsRead(userId: string, notificationId?: string): Promise<number | null> {
    const client = await getReadyClient();
    if (!client) return null;
    let query = client
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (notificationId) {
      query = query.eq('id', notificationId);
    }
    const { data, error } = await query.select('id');
    if (error || !data) return null;
    return data.length;
  },
};
