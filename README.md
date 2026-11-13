# CampusMart 🎓🛒
> **A High-Performance Flipkart/Amazon-Style Campus E-Commerce Platform with Interactive 3D Web Graphics & Server-Enforced Weekday-Only Ordering**

CampusMart is a full-stack, single-store online marketplace engineered exclusively for university campus life. Students, faculty, and staff can order academic stationery, engineering tools, laptops/accessories, dorm living essentials, official varsity merch, and piping hot cafeteria meals delivered right to their hostel rooms in under 30 minutes.

---

## 🚀 Key Features

### 1. Flipkart/Amazon-Style Shopping Experience
- **Interactive 3D Hero Stage:** Floating university shopping bags, gift boxes, headphones, and coins built with **Three.js**, **React Three Fiber**, and **@react-three/drei** that react to mouse parallax and scroll.
- **Interactive 3D Product Viewer:** Rotate 360°, zoom, adjust lighting presets (Studio / Warm / Dramatic), and toggle wireframe mesh for products with procedural 3D models or loaded `.glb` models.
- **Global Search & Autocomplete:** Real-time dropdown search with instant thumbnail previews and price matches.
- **Department Browsing & Filter Engine:** Price range slider, customer ratings (4★+, 3★+), in-stock filters, and sorting by price, discount %, and customer ratings.
- **Dual View Modes:** Smooth switch between Grid (2/3/4 cols) and List layout with detailed specifications.
- **Fuel Cafeteria Section:** Dedicated campus kitchen menu with Pure Veg / Non-Veg dietary badges, prep times, and quick-add snack combos.
- **Campus Persistent Cart & Wishlist:** Persistent local storage for guests, synchronized on login, with coupon discount validation and price breakdown (MRP, Discounts, Hostel Delivery, Platform Fee).
- **Hostel Room Checkout:** Select specific campus buildings (Ramanujan Hall, Sarabhai Hall, Kalpana Chawla Hall, Gate Pickups), delivery time slots, and Cash on Delivery (COD) payment.
- **Live Order Tracking Timeline:** Visual step-by-step progress tracking:
  $$\text{Placed} \longrightarrow \text{Confirmed} \longrightarrow \text{Packed} \longrightarrow \text{Out for Delivery} \longrightarrow \text{Delivered}$$
- **Verified Buyer Reviews:** Star ratings and comments verified by previous campus purchases.
- **Admin Control Center (`/admin`):** KPI dashboard with sales analytics, product CRUD with 3D model controls, order status management, coupon creation, and operating schedule controls.

---

## ⏰ Special Feature: Weekday-Only Ordering System

CampusMart features a strict, server-authoritative **Weekday-Only Ordering Protocol**:

### Rules & Workflow
1. **Monday to Friday:** Store is fully open. Students can place orders for same-day campus delivery.
2. **Saturday and Sunday:** Store is in **Browse-Only Mode**.
   - Students can still browse products, search, compare, and **add items to their cart or wishlist**.
   - Cart items are safely preserved over the weekend.
   - The **"Place Order"**, **"Buy Now"**, and **"Checkout"** buttons are disabled with informative tooltips and a live countdown to Monday opening.
   - A sticky announcement banner appears across the top of the website informing students that orders resume on Monday.
   - **Backend Enforcement:** The `POST /api/orders` endpoint rejects weekend requests with **HTTP 403 Forbidden** and a structured JSON response `{ error: 'Weekend Ordering Closed', message: '...', nextOpenAt: '...' }`, preventing client clock manipulation or API bypasses.
3. **Server-Side Timezone:** All day and hour computations run on the server using `Intl.DateTimeFormat` with configurable timezone (default `Asia/Kolkata`).
4. **Admin Overrides:** Campus administrators can customize open days, opening/closing hours, server timezone, and add date-specific holiday overrides (e.g. force open for a weekend Cultural Fest, or force close for a national holiday) directly from `/admin`.

### Unit Tests
The store status calculation logic is covered by unit tests in `src/__tests__/storeStatus.test.mjs`:
```bash
npm test
```
Tests cover:
- Weekday open status (Monday–Friday)
- Weekend closed status (Saturday & Sunday)
- Midnight transitions (Friday 23:59 IST $\to$ Saturday 00:01 IST)
- Midnight transitions (Sunday 23:59 IST $\to$ Monday 00:01 IST)
- Multi-timezone accuracy (UTC vs Asia/Kolkata vs America/New_York)
- Operating hours window validation (e.g. 09:00 to 21:00)
- Administrative force-open and force-close overrides

---

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer
- **3D Graphics:** Three.js + React Three Fiber (`@react-three/fiber`) + `@react-three/drei`
- **Animations:** Framer Motion (3D tilt cards, layout transitions) + Canvas Confetti
- **State Management:** Zustand with LocalStorage persistence
- **Database & Services:** Dual-mode repository layer supporting MongoDB via Mongoose and resilient built-in persistent in-memory cache
- **Authentication:** Custom JWT with HTTP-only cookies and bcryptjs password hashing
- **Validation:** Zod schemas
- **Icons:** Lucide React

---

## 🛠️ Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> campusmart
cd campusmart
npm install
```

### 2. Environment Variables & Supabase Backend Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default variables:
```env
PORT=3000
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MONGODB_URI=mongodb://localhost:27017/campusmart
JWT_SECRET=campusmart_super_secure_jwt_token_secret_key_2026_dev
DEFAULT_TIMEZONE=Asia/Kolkata
```
> **Connecting Supabase:**
> 1. Run [`supabase/schema.sql`](supabase/schema.sql) once inside your Supabase Dashboard **SQL Editor**.
> 2. Paste `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`.
> 3. Run `npm run seed:supabase` (or click **Sync Seed Data to Supabase** on `/admin` -> Dashboard) to push all categories, products, coupons, demo accounts, price history, alerts, and notifications into Supabase PostgreSQL.
>
> **Note:** If neither Supabase nor MongoDB is configured yet, CampusMart runs seamlessly on its built-in in-memory repository with pre-seeded data! Check `GET /api/health` anytime to verify which backend is active.

### 3. Run Unit Tests
```bash
npm test
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Student** | `janethlokineni@gmail.com` | `Janeth2026!` | Catalog, AI Assistant, Wishlist, Price Alerts (`/account/alerts`), Notifications, Cart, Checkout |
| **Admin** | `admin@gmail.com` | `AdminCampus2026!` | Full Admin Panel (`/admin`), Price History & Alert Demand Insights, Cron Price Check, Product CRUD |

---

## 🤖 AI Shopping Assistant & 📉 Price Drop Alerts

### 1. AI Shopping Assistant (`/api/assistant`)
- **Floating Chat Drawer:** Lazy-loaded on customer pages (`src/components/assistant/ShoppingAssistantWidget.tsx`), mobile full-screen sheet, quick-suggestion chips (`Under ₹200`, `Exam essentials`, `Hostel snacks`, `Best rated`, `New arrivals`), and compact interactive in-chat product cards (`Add to cart` + `View product`).
- **Provider-Agnostic LLM + DB Tools:** Uses `LLM_API_KEY`, `LLM_MODEL`, `LLM_PROVIDER` (`openai` / `gemini` / `auto`), and `LLM_BASE_URL` with tool calls (`searchProducts`, `getProductDetails`, `getCategories`), strict budget enforcement, bundle totals, per-user/IP rate limiting, Zod validation, and automatic deterministic DB search fallback when no LLM key is present.
- **Weekend Schedule Awareness:** Knows checkout is Monday–Friday and informs users on weekends that items can be added to cart until Monday.
- **Persistence:** Stores `ChatSession` history (`GET`/`POST`/`DELETE /api/assistant`) in MongoDB/in-memory with retention limits.

### 2. Price Drop Alerts & Notifications (`/api/alerts`, `/api/notifications`, `/api/products/[id]/price-history`)
- **Price Alert Controls:** Bell toggle on product cards and product detail pages with optional target price (`<= ₹X`), auto-enable on wishlist toggle, and a dedicated **My Alerts** dashboard (`/account/alerts`).
- **Price History Mini-Chart:** Lazy-loaded SVG trend (`30D` / `90D`), `"Lowest price in 30 days"`, and `"Price dropped X% OFF"` badges.
- **Anti-Spam Trigger & Multi-Channel Delivery:** Price drops updated via Admin panel (`PUT /api/products/[id]`, `POST /api/admin/products/bulk-price`) or scheduled safety net (`GET/POST /api/cron/price-check` protected by `CRON_SECRET`) log `PriceHistory`, guard against duplicate alerts using `lastNotifiedPrice`, update the in-app **Notification Bell**, and dispatch emails via **Resend** or **Nodemailer** (structured for future Push/WhatsApp adapters).
- **Admin Demand Insights (`/admin`):** Displays active alert watcher counts per product and a Price History modal for any item.

### Additional Environment Variables
```env
LLM_PROVIDER=auto
LLM_API_KEY=your_llm_api_key
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1
RESEND_API_KEY=your_resend_key
EMAIL_FROM="CampusMart Alerts <alerts@campusmart.edu>"
CRON_SECRET=campusmart_cron_secret_2026_dev
```

---

## 🎨 How to Add 3D Models

CampusMart supports both **Procedural Three.js Models** and **Standard `.glb` / `.gltf` 3D Models**:

### 1. Procedural 3D Models (Zero download overhead, instant loading)
Select any of the built-in procedural models in `/admin` or in your product seed data:
- `procedural-headphones`: Studio headphones with padded headband and metallic earcups.
- `procedural-laptop`: Aluminium laptop chassis with open screen and keyboard.
- `procedural-bottle`: Insulated stainless steel sports flask with loop handle.
- `procedural-backpack`: University commuter backpack with front zipper pocket.
- `procedural-cup`: Cafeteria ceramic mug with hot brew.

### 2. Custom `.glb` Models
To use external or uploaded 3D assets:
1. Place your `.glb` file inside the `public/models/` folder (e.g. `public/models/calculator.glb`).
2. Set `model3dUrl: '/models/calculator.glb'` in your product definition or via the Admin panel.
3. The `Product3DViewer` will automatically load and render the model using `@react-three/drei`'s `useGLTF`.

---

## 🧪 Build & Quality Verification

```bash
# Run unit test suite
npm test

# Run Next.js production build
npm run build

# Start production server
npm start
```

