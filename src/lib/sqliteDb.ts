import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, SQLOutputValue } from 'node:sqlite';
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

export type StoredUser = User & { passwordHash: string };

export interface SqliteHealthSnapshot {
  connected: boolean;
  dbPath: string;
  fileSizeBytes: number;
  counts: {
    products: number;
    categories: number;
    users: number;
    orders: number;
    priceAlerts: number;
    notifications: number;
  };
  error?: string;
}

interface GlobalSqliteCache {
  db?: DatabaseSync;
  dbPath?: string;
  initialized?: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var campusMartSqliteCache: GlobalSqliteCache | undefined;
}

const sqliteCache: GlobalSqliteCache = global.campusMartSqliteCache ?? {};
if (!global.campusMartSqliteCache) {
  global.campusMartSqliteCache = sqliteCache;
}

export function resolveSqliteDbPath(): string {
  const configured = (process.env.SQLITE_DB_PATH ?? '').trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), 'data', 'campusmart.db');
}

function safeJsonParse<T>(raw: SQLOutputValue | undefined, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function asStr(val: SQLOutputValue | undefined, fallback = ''): string {
  return typeof val === 'string' ? val : val !== null && val !== undefined ? String(val) : fallback;
}

function asOptStr(val: SQLOutputValue | undefined): string | undefined {
  return typeof val === 'string' && val.length > 0 ? val : undefined;
}

function asNum(val: SQLOutputValue | undefined, fallback = 0): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'string') {
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asOptNum(val: SQLOutputValue | undefined): number | undefined {
  if (val === null || val === undefined) return undefined;
  const n = asNum(val, Number.NaN);
  return Number.isFinite(n) ? n : undefined;
}

function asBool(val: SQLOutputValue | undefined, fallback = false): boolean {
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'bigint') return val !== BigInt(0);
  if (typeof val === 'string') return val === 'true' || val === '1';
  return fallback;
}

function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      student_id TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      addresses_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_users_email ON users (email);
    CREATE INDEX IF NOT EXISTS idx_sqlite_users_student_id ON users (student_id);

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      item_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      discount_percent INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 4.5,
      review_count INTEGER NOT NULL DEFAULT 0,
      images_json TEXT NOT NULL DEFAULT '[]',
      model3d_url TEXT,
      model3d_type TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      specs_json TEXT NOT NULL DEFAULT '{}',
      tags_json TEXT NOT NULL DEFAULT '[]',
      is_cafeteria INTEGER NOT NULL DEFAULT 0,
      is_veg INTEGER,
      badge TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_products_category ON products (category);
    CREATE INDEX IF NOT EXISTS idx_sqlite_products_slug ON products (slug);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      items_json TEXT NOT NULL,
      address_json TEXT NOT NULL,
      delivery_slot TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'COD',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      order_status TEXT NOT NULL DEFAULT 'placed',
      status_timeline_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      mrp_total REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      coupon_code TEXT,
      coupon_discount REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL DEFAULT 0,
      platform_fee REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_orders_user ON orders (user_id, created_at);

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_value REAL NOT NULL DEFAULT 0,
      max_discount REAL,
      expires_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      rating REAL NOT NULL,
      comment TEXT NOT NULL,
      verified_purchase INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_reviews_product ON reviews (product_id, created_at);

    CREATE TABLE IF NOT EXISTS store_settings (
      id TEXT PRIMARY KEY,
      open_days_json TEXT NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      timezone TEXT NOT NULL,
      overrides_json TEXT NOT NULL,
      weekend_notice TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_key TEXT NOT NULL UNIQUE,
      messages_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_chat_user ON chat_sessions (user_id, updated_at);

    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      price_when_added REAL NOT NULL,
      target_price REAL,
      active INTEGER NOT NULL DEFAULT 1,
      last_notified_price REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (user_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_alerts_product ON price_alerts (product_id, active);
    CREATE INDEX IF NOT EXISTS idx_sqlite_alerts_user ON price_alerts (user_id, updated_at);

    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      price REAL NOT NULL,
      changed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_ph_product ON price_history (product_id, changed_at);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      product_id TEXT,
      product_slug TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sqlite_notifications_user ON notifications (user_id, created_at);
  `);
}

function seedInitialDataIfNeeded(db: DatabaseSync): void {
  const productCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM products').get();
  const userCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM users').get();
  const hasProducts = asNum(productCountRow?.cnt, 0) > 0;
  const hasUsers = asNum(userCountRow?.cnt, 0) > 0;

  if (hasProducts && hasUsers) {
    return;
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    if (!hasUsers) {
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (id, name, email, password_hash, student_id, role, phone, addresses_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of [INITIAL_ADMIN_USER, INITIAL_CUSTOMER_USER]) {
        insertUser.run(
          u.id,
          u.name,
          u.email.toLowerCase(),
          u.passwordHash,
          u.studentId ?? null,
          u.role,
          u.phone ?? null,
          JSON.stringify(u.addresses ?? []),
          u.createdAt
        );
      }
    }

    if (!hasProducts) {
      const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (id, name, slug, icon, description, image, item_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of INITIAL_CATEGORIES) {
        insertCategory.run(c.id, c.name, c.slug, c.icon, c.description, c.image, c.itemCount);
      }

      const insertProduct = db.prepare(`
        INSERT OR IGNORE INTO products (
          id, name, slug, description, price, mrp, discount_percent, category, brand,
          rating, review_count, images_json, model3d_url, model3d_type, stock, specs_json,
          tags_json, is_cafeteria, is_veg, badge, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of INITIAL_PRODUCTS) {
        insertProduct.run(
          p.id,
          p.name,
          p.slug,
          p.description,
          p.price,
          p.mrp,
          p.discountPercent,
          p.category,
          p.brand,
          p.rating,
          p.reviewCount,
          JSON.stringify(p.images ?? []),
          p.model3dUrl ?? null,
          p.model3dType ?? null,
          p.stock,
          JSON.stringify(p.specs ?? {}),
          JSON.stringify(p.tags ?? []),
          p.isCafeteria ? 1 : 0,
          p.isVeg === undefined ? null : p.isVeg ? 1 : 0,
          p.badge ?? null,
          p.createdAt
        );
      }

      const insertCoupon = db.prepare(`
        INSERT OR IGNORE INTO coupons (
          id, code, discount_type, discount_value, min_order_value, max_discount, expires_at, is_active, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const cp of INITIAL_COUPONS) {
        insertCoupon.run(
          cp.id,
          cp.code.toUpperCase(),
          cp.discountType,
          cp.discountValue,
          cp.minOrderValue,
          cp.maxDiscount ?? null,
          cp.expiresAt,
          cp.isActive ? 1 : 0,
          cp.description
        );
      }

      db.prepare(`
        INSERT OR IGNORE INTO store_settings (
          id, open_days_json, open_time, close_time, timezone, overrides_json, weekend_notice, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'default',
        JSON.stringify(DEFAULT_STORE_SETTINGS.openDays),
        DEFAULT_STORE_SETTINGS.openTime,
        DEFAULT_STORE_SETTINGS.closeTime,
        DEFAULT_STORE_SETTINGS.timezone,
        JSON.stringify(DEFAULT_STORE_SETTINGS.overrides),
        DEFAULT_STORE_SETTINGS.weekendNotice,
        DEFAULT_STORE_SETTINGS.updatedAt
      );

      const insertPh = db.prepare(`
        INSERT OR IGNORE INTO price_history (id, product_id, price, changed_at) VALUES (?, ?, ?, ?)
      `);
      for (const pt of getInitialPriceHistory()) {
        insertPh.run(pt.id, pt.productId, pt.price, pt.changedAt);
      }

      const insertAlert = db.prepare(`
        INSERT OR IGNORE INTO price_alerts (
          id, user_id, product_id, price_when_added, target_price, active, last_notified_price, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of getInitialPriceAlerts()) {
        insertAlert.run(
          a.id,
          a.userId,
          a.productId,
          a.priceWhenAdded,
          a.targetPrice ?? null,
          a.active ? 1 : 0,
          a.lastNotifiedPrice ?? null,
          a.createdAt,
          a.updatedAt
        );
      }

      const insertNotif = db.prepare(`
        INSERT OR IGNORE INTO notifications (
          id, user_id, type, title, message, product_id, product_slug, read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const n of getInitialNotifications()) {
        insertNotif.run(
          n.id,
          n.userId,
          n.type,
          n.title,
          n.message,
          n.productId ?? null,
          n.productSlug ?? null,
          n.read ? 1 : 0,
          n.createdAt
        );
      }

      const insertChat = db.prepare(`
        INSERT OR IGNORE INTO chat_sessions (id, user_id, session_key, messages_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const s of getInitialChatSessions()) {
        insertChat.run(
          s.id,
          s.userId ?? null,
          s.sessionKey,
          JSON.stringify(s.messages),
          s.createdAt,
          s.updatedAt
        );
      }
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getSqliteDb(): DatabaseSync | null {
  try {
    const dbPath = resolveSqliteDbPath();
    if (sqliteCache.db && sqliteCache.dbPath === dbPath && sqliteCache.initialized) {
      return sqliteCache.db;
    }

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new DatabaseSync(dbPath);
    initializeSchema(db);
    seedInitialDataIfNeeded(db);

    sqliteCache.db = db;
    sqliteCache.dbPath = dbPath;
    sqliteCache.initialized = true;
    return db;
  } catch {
    return null;
  }
}

// =========================
// Row Mappers
// =========================
function rowToProduct(row: Record<string, SQLOutputValue>): Product {
  return {
    id: asStr(row.id),
    name: asStr(row.name),
    slug: asStr(row.slug),
    description: asStr(row.description),
    price: asNum(row.price),
    mrp: asNum(row.mrp),
    discountPercent: asNum(row.discount_percent),
    category: asStr(row.category),
    brand: asStr(row.brand),
    rating: asNum(row.rating, 4.5),
    reviewCount: asNum(row.review_count),
    images: safeJsonParse<string[]>(row.images_json, []),
    model3dUrl: asOptStr(row.model3d_url),
    model3dType: asOptStr(row.model3d_type) as Model3dType | undefined,
    stock: asNum(row.stock),
    specs: safeJsonParse<Record<string, string>>(row.specs_json, {}),
    tags: safeJsonParse<string[]>(row.tags_json, []),
    isCafeteria: row.is_cafeteria !== null ? asBool(row.is_cafeteria) : undefined,
    isVeg: row.is_veg === null || row.is_veg === undefined ? undefined : asBool(row.is_veg),
    badge: asOptStr(row.badge) as Product['badge'] | undefined,
    createdAt: asStr(row.created_at),
  };
}

function rowToUser(row: Record<string, SQLOutputValue>): StoredUser {
  const roleVal = asStr(row.role, 'customer');
  return {
    id: asStr(row.id),
    name: asStr(row.name),
    email: asStr(row.email),
    passwordHash: asStr(row.password_hash),
    studentId: asOptStr(row.student_id),
    role: roleVal === 'admin' ? 'admin' : 'customer',
    phone: asOptStr(row.phone),
    addresses: safeJsonParse<Address[]>(row.addresses_json, []),
    createdAt: asStr(row.created_at),
  };
}

function rowToOrder(row: Record<string, SQLOutputValue>): Order {
  return {
    id: asStr(row.id),
    orderNumber: asStr(row.order_number),
    userId: asOptStr(row.user_id),
    customerName: asStr(row.customer_name),
    customerEmail: asStr(row.customer_email),
    customerPhone: asStr(row.customer_phone),
    items: safeJsonParse<OrderItem[]>(row.items_json, []),
    address: safeJsonParse<Address>(row.address_json, {
      id: '',
      fullName: '',
      phone: '',
      hostelBlock: '',
      roomNumber: '',
    }),
    deliverySlot: asStr(row.delivery_slot),
    paymentMethod: 'COD',
    paymentStatus: asStr(row.payment_status) === 'paid' ? 'paid' : 'pending',
    orderStatus: asStr(row.order_status, 'placed') as OrderStatus,
    statusTimeline: safeJsonParse<OrderTimelineStep[]>(row.status_timeline_json, []),
    subtotal: asNum(row.subtotal),
    mrpTotal: asNum(row.mrp_total),
    discount: asNum(row.discount),
    couponCode: asOptStr(row.coupon_code),
    couponDiscount: asNum(row.coupon_discount),
    deliveryFee: asNum(row.delivery_fee),
    platformFee: asNum(row.platform_fee),
    totalAmount: asNum(row.total_amount),
    cancellationReason: asOptStr(row.cancellation_reason),
    createdAt: asStr(row.created_at),
  };
}

function rowToPriceAlert(row: Record<string, SQLOutputValue>): PriceAlert {
  return {
    id: asStr(row.id),
    userId: asStr(row.user_id),
    productId: asStr(row.product_id),
    priceWhenAdded: asNum(row.price_when_added),
    targetPrice: asOptNum(row.target_price),
    active: asBool(row.active, true),
    lastNotifiedPrice: asOptNum(row.last_notified_price),
    createdAt: asStr(row.created_at),
    updatedAt: asStr(row.updated_at),
  };
}

// =========================
// Domain Operations
// =========================
export const SqliteStore = {
  getHealth(): SqliteHealthSnapshot {
    const dbPath = resolveSqliteDbPath();
    const db = getSqliteDb();
    if (!db) {
      return {
        connected: false,
        dbPath,
        fileSizeBytes: 0,
        counts: { products: 0, categories: 0, users: 0, orders: 0, priceAlerts: 0, notifications: 0 },
        error: 'Unable to open SQLite database file.',
      };
    }

    const fileSizeBytes = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    const countOf = (table: string) =>
      asNum(db.prepare(`SELECT COUNT(*) AS cnt FROM ${table}`).get()?.cnt, 0);

    return {
      connected: true,
      dbPath,
      fileSizeBytes,
      counts: {
        products: countOf('products'),
        categories: countOf('categories'),
        users: countOf('users'),
        orders: countOf('orders'),
        priceAlerts: countOf('price_alerts'),
        notifications: countOf('notifications'),
      },
    };
  },

  getAllProducts(): Product[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return rows.map(rowToProduct);
  },

  getProductByIdOrSlug(idOrSlug: string): Product | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const row = db
      .prepare('SELECT * FROM products WHERE id = ? OR slug = ? LIMIT 1')
      .get(idOrSlug, idOrSlug);
    return row ? rowToProduct(row) : null;
  },

  upsertProduct(p: Product): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO products (
        id, name, slug, description, price, mrp, discount_percent, category, brand,
        rating, review_count, images_json, model3d_url, model3d_type, stock, specs_json,
        tags_json, is_cafeteria, is_veg, badge, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        description = excluded.description,
        price = excluded.price,
        mrp = excluded.mrp,
        discount_percent = excluded.discount_percent,
        category = excluded.category,
        brand = excluded.brand,
        rating = excluded.rating,
        review_count = excluded.review_count,
        images_json = excluded.images_json,
        model3d_url = excluded.model3d_url,
        model3d_type = excluded.model3d_type,
        stock = excluded.stock,
        specs_json = excluded.specs_json,
        tags_json = excluded.tags_json,
        is_cafeteria = excluded.is_cafeteria,
        is_veg = excluded.is_veg,
        badge = excluded.badge
    `).run(
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.mrp,
      p.discountPercent,
      p.category,
      p.brand,
      p.rating,
      p.reviewCount,
      JSON.stringify(p.images ?? []),
      p.model3dUrl ?? null,
      p.model3dType ?? null,
      p.stock,
      JSON.stringify(p.specs ?? {}),
      JSON.stringify(p.tags ?? []),
      p.isCafeteria ? 1 : 0,
      p.isVeg === undefined ? null : p.isVeg ? 1 : 0,
      p.badge ?? null,
      p.createdAt
    );
    return true;
  },

  deleteProduct(id: string): boolean | null {
    const db = getSqliteDb();
    if (!db) return null;
    const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  },

  getCategories(): Category[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    const rows = db.prepare('SELECT * FROM categories').all();
    return rows.map((r) => ({
      id: asStr(r.id),
      name: asStr(r.name),
      slug: asStr(r.slug),
      icon: asStr(r.icon),
      description: asStr(r.description),
      image: asStr(r.image),
      itemCount: asNum(r.item_count),
    }));
  },

  getStoreSettings(): StoreSettings | null {
    const db = getSqliteDb();
    if (!db) return null;
    const row = db.prepare("SELECT * FROM store_settings WHERE id = 'default' LIMIT 1").get();
    if (!row) return null;
    return {
      openDays: safeJsonParse<number[]>(row.open_days_json, DEFAULT_STORE_SETTINGS.openDays),
      openTime: asStr(row.open_time, DEFAULT_STORE_SETTINGS.openTime),
      closeTime: asStr(row.close_time, DEFAULT_STORE_SETTINGS.closeTime),
      timezone: asStr(row.timezone, DEFAULT_STORE_SETTINGS.timezone),
      overrides: safeJsonParse<DateOverride[]>(row.overrides_json, []),
      weekendNotice: asStr(row.weekend_notice, DEFAULT_STORE_SETTINGS.weekendNotice),
      updatedAt: asStr(row.updated_at, DEFAULT_STORE_SETTINGS.updatedAt),
    };
  },

  upsertStoreSettings(s: StoreSettings): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO store_settings (
        id, open_days_json, open_time, close_time, timezone, overrides_json, weekend_notice, updated_at
      ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        open_days_json = excluded.open_days_json,
        open_time = excluded.open_time,
        close_time = excluded.close_time,
        timezone = excluded.timezone,
        overrides_json = excluded.overrides_json,
        weekend_notice = excluded.weekend_notice,
        updated_at = excluded.updated_at
    `).run(
      JSON.stringify(s.openDays),
      s.openTime,
      s.closeTime,
      s.timezone,
      JSON.stringify(s.overrides),
      s.weekendNotice,
      s.updatedAt
    );
    return true;
  },

  getOrders(userId?: string): Order[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    const rows = userId
      ? db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId)
      : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    return rows.map(rowToOrder);
  },

  getOrderById(idOrOrderNumber: string): Order | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const row = db
      .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
      .get(idOrOrderNumber, idOrOrderNumber);
    return row ? rowToOrder(row) : null;
  },

  upsertOrder(o: Order): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        items_json, address_json, delivery_slot, payment_method, payment_status,
        order_status, status_timeline_json, subtotal, mrp_total, discount,
        coupon_code, coupon_discount, delivery_fee, platform_fee, total_amount,
        cancellation_reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payment_status = excluded.payment_status,
        order_status = excluded.order_status,
        status_timeline_json = excluded.status_timeline_json,
        cancellation_reason = excluded.cancellation_reason
    `).run(
      o.id,
      o.orderNumber,
      o.userId ?? null,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      JSON.stringify(o.items),
      JSON.stringify(o.address),
      o.deliverySlot,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      JSON.stringify(o.statusTimeline),
      o.subtotal,
      o.mrpTotal,
      o.discount,
      o.couponCode ?? null,
      o.couponDiscount,
      o.deliveryFee,
      o.platformFee,
      o.totalAmount,
      o.cancellationReason ?? null,
      o.createdAt
    );
    return true;
  },

  getCoupons(): Coupon[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    const rows = db.prepare('SELECT * FROM coupons').all();
    return rows.map((r) => ({
      id: asStr(r.id),
      code: asStr(r.code),
      discountType: asStr(r.discount_type) === 'fixed' ? 'fixed' : 'percent',
      discountValue: asNum(r.discount_value),
      minOrderValue: asNum(r.min_order_value),
      maxDiscount: asOptNum(r.max_discount),
      expiresAt: asStr(r.expires_at),
      isActive: asBool(r.is_active, true),
      description: asStr(r.description),
    }));
  },

  upsertCoupon(c: Coupon): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO coupons (
        id, code, discount_type, discount_value, min_order_value, max_discount, expires_at, is_active, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        discount_type = excluded.discount_type,
        discount_value = excluded.discount_value,
        min_order_value = excluded.min_order_value,
        max_discount = excluded.max_discount,
        expires_at = excluded.expires_at,
        is_active = excluded.is_active,
        description = excluded.description
    `).run(
      c.id,
      c.code.toUpperCase(),
      c.discountType,
      c.discountValue,
      c.minOrderValue,
      c.maxDiscount ?? null,
      c.expiresAt,
      c.isActive ? 1 : 0,
      c.description
    );
    return true;
  },

  getReviews(productId: string): Review[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    const rows = db
      .prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC')
      .all(productId);
    return rows.map((r) => ({
      id: asStr(r.id),
      productId: asStr(r.product_id),
      userId: asStr(r.user_id),
      userName: asStr(r.user_name),
      rating: asNum(r.rating),
      comment: asStr(r.comment),
      verifiedPurchase: asBool(r.verified_purchase),
      createdAt: asStr(r.created_at),
    }));
  },

  insertReview(r: Review): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, verified_purchase, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      r.id,
      r.productId,
      r.userId,
      r.userName,
      r.rating,
      r.comment,
      r.verifiedPurchase ? 1 : 0,
      r.createdAt
    );
    return true;
  },

  getAllUsers(): StoredUser[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    return db.prepare('SELECT * FROM users ORDER BY created_at ASC').all().map(rowToUser);
  },

  findUserById(id: string): StoredUser | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const row = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').get(id);
    return row ? rowToUser(row) : null;
  },

  findUserByEmail(email: string): StoredUser | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const row = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1')
      .get(email.trim());
    return row ? rowToUser(row) : null;
  },

  findUserByIdentifier(identifier: string): StoredUser | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const raw = identifier.trim();
    const lower = raw.toLowerCase();
    const effectiveEmail = lower === 'admin@campusmart.edu' ? 'admin@gmail.com' : lower;

    const row = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ? LIMIT 1')
      .get(effectiveEmail, lower);
    if (row) return rowToUser(row);

    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7) {
      const users = this.getAllUsers() ?? [];
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

  findUserByPhone(phone: string): StoredUser | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    const users = this.getAllUsers() ?? [];
    return (
      users.find((u) => {
        if (!u.phone) return false;
        const uDigits = u.phone.replace(/\D/g, '');
        return uDigits === digits || (digits.length >= 10 && uDigits.endsWith(digits.slice(-10)));
      }) ?? null
    );
  },

  upsertUser(u: StoredUser): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, student_id, role, phone, addresses_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        password_hash = excluded.password_hash,
        student_id = excluded.student_id,
        role = excluded.role,
        phone = excluded.phone,
        addresses_json = excluded.addresses_json
    `).run(
      u.id,
      u.name,
      u.email.trim().toLowerCase(),
      u.passwordHash,
      u.studentId ?? null,
      u.role,
      u.phone ?? null,
      JSON.stringify(u.addresses ?? []),
      u.createdAt
    );
    return true;
  },

  getChatSession(sessionKey: string, userId?: string): ChatSession | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const row = userId
      ? db
          .prepare('SELECT * FROM chat_sessions WHERE user_id = ? OR session_key = ? ORDER BY updated_at DESC LIMIT 1')
          .get(userId, sessionKey)
      : db
          .prepare('SELECT * FROM chat_sessions WHERE session_key = ? AND user_id IS NULL LIMIT 1')
          .get(sessionKey);
    if (!row) return null;
    return {
      id: asStr(row.id),
      userId: asOptStr(row.user_id),
      sessionKey: asStr(row.session_key),
      messages: safeJsonParse<ChatMessage[]>(row.messages_json, []),
      createdAt: asStr(row.created_at),
      updatedAt: asStr(row.updated_at),
    };
  },

  saveChatSession(session: ChatSession): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO chat_sessions (id, user_id, session_key, messages_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_key) DO UPDATE SET
        user_id = COALESCE(excluded.user_id, chat_sessions.user_id),
        messages_json = excluded.messages_json,
        updated_at = excluded.updated_at
    `).run(
      session.id,
      session.userId ?? null,
      session.sessionKey,
      JSON.stringify(session.messages),
      session.createdAt,
      session.updatedAt
    );
    return true;
  },

  clearChatSession(sessionKey: string, userId?: string): boolean | null {
    const db = getSqliteDb();
    if (!db) return null;
    const res = userId
      ? db.prepare('DELETE FROM chat_sessions WHERE user_id = ? OR session_key = ?').run(userId, sessionKey)
      : db.prepare('DELETE FROM chat_sessions WHERE session_key = ? AND user_id IS NULL').run(sessionKey);
    return Number(res.changes) > 0;
  },

  recordPriceHistory(point: PriceHistoryPoint): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare('INSERT INTO price_history (id, product_id, price, changed_at) VALUES (?, ?, ?, ?)').run(
      point.id,
      point.productId,
      point.price,
      point.changedAt
    );
    return true;
  },

  getPriceHistoryByProduct(productId: string): PriceHistoryPoint[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    return db
      .prepare('SELECT * FROM price_history WHERE product_id = ? ORDER BY changed_at ASC')
      .all(productId)
      .map((r) => ({
        id: asStr(r.id),
        productId: asStr(r.product_id),
        price: asNum(r.price),
        changedAt: asStr(r.changed_at),
      }));
  },

  getAllPriceHistoryRecent(cutoffIso: string): PriceHistoryPoint[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    return db
      .prepare('SELECT * FROM price_history WHERE changed_at >= ? ORDER BY changed_at ASC')
      .all(cutoffIso)
      .map((r) => ({
        id: asStr(r.id),
        productId: asStr(r.product_id),
        price: asNum(r.price),
        changedAt: asStr(r.changed_at),
      }));
  },

  getPriceAlerts(params?: { userId?: string; activeOnly?: boolean }): PriceAlert[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    let sql = 'SELECT * FROM price_alerts';
    const clauses: string[] = [];
    const args: Array<string | number> = [];

    if (params?.userId) {
      clauses.push('user_id = ?');
      args.push(params.userId);
    }
    if (params?.activeOnly) {
      clauses.push('active = 1');
    }
    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
    sql += ' ORDER BY updated_at DESC';

    return db.prepare(sql).all(...args).map(rowToPriceAlert);
  },

  findPriceAlert(userId: string, idOrProductId: string): PriceAlert | null | undefined {
    const db = getSqliteDb();
    if (!db) return undefined;
    const row = db
      .prepare('SELECT * FROM price_alerts WHERE user_id = ? AND (id = ? OR product_id = ?) LIMIT 1')
      .get(userId, idOrProductId, idOrProductId);
    return row ? rowToPriceAlert(row) : null;
  },

  upsertPriceAlert(alert: PriceAlert): PriceAlert | null {
    const db = getSqliteDb();
    if (!db) return null;
    db.prepare(`
      INSERT INTO price_alerts (
        id, user_id, product_id, price_when_added, target_price, active, last_notified_price, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, product_id) DO UPDATE SET
        target_price = excluded.target_price,
        active = excluded.active,
        last_notified_price = COALESCE(excluded.last_notified_price, price_alerts.last_notified_price),
        updated_at = excluded.updated_at
    `).run(
      alert.id,
      alert.userId,
      alert.productId,
      alert.priceWhenAdded,
      alert.targetPrice ?? null,
      alert.active ? 1 : 0,
      alert.lastNotifiedPrice ?? null,
      alert.createdAt,
      alert.updatedAt
    );
    return this.findPriceAlert(alert.userId, alert.productId) ?? alert;
  },

  updatePriceAlertLastNotified(userId: string, productId: string, lastNotifiedPrice: number): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      UPDATE price_alerts SET last_notified_price = ?, updated_at = ?
      WHERE user_id = ? AND product_id = ?
    `).run(lastNotifiedPrice, new Date().toISOString(), userId, productId);
    return true;
  },

  deletePriceAlert(userId: string, alertIdOrProductId: string, resolvedProductId?: string): boolean | null {
    const db = getSqliteDb();
    if (!db) return null;
    const targetPid = resolvedProductId ?? alertIdOrProductId;
    const res = db
      .prepare('DELETE FROM price_alerts WHERE user_id = ? AND (id = ? OR product_id = ?)')
      .run(userId, alertIdOrProductId, targetPid);
    return Number(res.changes) > 0;
  },

  createNotification(notification: AppNotification): boolean {
    const db = getSqliteDb();
    if (!db) return false;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, product_id, product_slug, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      notification.id,
      notification.userId,
      notification.type,
      notification.title,
      notification.message,
      notification.productId ?? null,
      notification.productSlug ?? null,
      notification.read ? 1 : 0,
      notification.createdAt
    );
    return true;
  },

  getNotificationsByUser(userId: string, limit: number): AppNotification[] | null {
    const db = getSqliteDb();
    if (!db) return null;
    return db
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(userId, limit)
      .map((r) => ({
        id: asStr(r.id),
        userId: asStr(r.user_id),
        type: asStr(r.type, 'price_drop') as NotificationType,
        title: asStr(r.title),
        message: asStr(r.message),
        productId: asOptStr(r.product_id),
        productSlug: asOptStr(r.product_slug),
        read: asBool(r.read),
        createdAt: asStr(r.created_at),
      }));
  },

  markNotificationsRead(userId: string, notificationId?: string): number | null {
    const db = getSqliteDb();
    if (!db) return null;
    const res = notificationId
      ? db
          .prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ? AND read = 0')
          .run(userId, notificationId)
      : db
          .prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0')
          .run(userId);
    return Number(res.changes);
  },
};

