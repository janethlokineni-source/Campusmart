-- =============================================================================
-- CampusMart Complete PostgreSQL Schema for Supabase
-- Run this script once in your Supabase Dashboard -> SQL Editor
-- =============================================================================

-- 1. Users (Students & Store Admins)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  student_id TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  phone TEXT,
  addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users (LOWER(student_id));

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0
);

-- 3. Products
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
  discount_percent INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.5,
  review_count INTEGER NOT NULL DEFAULT 0,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  model3d_url TEXT,
  model3d_type TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_cafeteria BOOLEAN NOT NULL DEFAULT FALSE,
  is_veg BOOLEAN,
  badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (LOWER(category));
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);

-- 4. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  address JSONB NOT NULL,
  delivery_slot TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'COD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  order_status TEXT NOT NULL DEFAULT 'placed' CHECK (
    order_status IN ('placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  status_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL,
  mrp_total NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  coupon_discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- 5. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL,
  min_order_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12, 2),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL DEFAULT ''
);

-- 6. Product Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id, created_at DESC);

-- 7. Store Operating Schedule & Weekday Rules
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  open_days JSONB NOT NULL DEFAULT '[1, 2, 3, 4, 5]'::jsonb,
  open_time TEXT NOT NULL DEFAULT '00:00',
  close_time TEXT NOT NULL DEFAULT '23:59',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  overrides JSONB NOT NULL DEFAULT '[]'::jsonb,
  weekend_notice TEXT NOT NULL DEFAULT 'CampusMart accepts orders Monday through Friday. Browse items over the weekend and save to cart!',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. AI Shopping Assistant Chat Sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_key TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions (user_id, updated_at DESC);

-- 9. Price Drop Alerts
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price_when_added NUMERIC(12, 2) NOT NULL,
  target_price NUMERIC(12, 2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_notified_price NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_price_alerts_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_product_active ON public.price_alerts (product_id, active);

-- 10. Price History Points
CREATE TABLE IF NOT EXISTS public.price_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_time ON public.price_history (product_id, changed_at ASC);

-- 11. User In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'price_drop' CHECK (type IN ('price_drop', 'order_update', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  product_id TEXT,
  product_slug TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON public.notifications (user_id, created_at DESC);

-- =============================================================================
-- Row-Level Security (RLS)
-- Backend API routes authenticate via CampusMart JWT cookies/headers and use
-- SUPABASE_SERVICE_ROLE_KEY server-side. Public tables remain safely readable.
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read price_history" ON public.price_history;
CREATE POLICY "Public read price_history" ON public.price_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (is_active = true);

