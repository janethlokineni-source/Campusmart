'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Product,
  Order,
  StoreSettings,
  Coupon,
  OrderStatus,
  ProductAlertDemandStat,
  Model3dType,
} from '@/types';
import {
  ShieldCheck,
  Package,
  Calendar,
  Tag,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Box,
  RefreshCw,
  BellRing,
  TrendingDown,
  Save,
  X,
} from 'lucide-react';

const PriceHistoryChart = dynamic(
  () => import('@/components/alerts/PriceHistoryChart'),
  { ssr: false }
);

const BackendStatusCard = dynamic(
  () => import('@/components/admin/BackendStatusCard'),
  { ssr: false }
);

interface AdminStatsPayload {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  activeOrders: number;
  totalProducts: number;
  lowStockCount: number;
  registeredStudents: number;
  totalActivePriceAlerts?: number;
  alertDemandStats?: Record<string, ProductAlertDemandStat>;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'settings' | 'coupons'>('dashboard');
  const [stats, setStats] = useState<AdminStatsPayload | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyModalProduct, setHistoryModalProduct] = useState<Product | null>(null);
  const [cronResultMsg, setCronResultMsg] = useState<string | null>(null);
  const [runningCron, setRunningCron] = useState(false);

  // Weekday Settings Form State
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [openTime, setOpenTime] = useState('00:00');
  const [closeTime, setCloseTime] = useState('23:59');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [weekendNotice, setWeekendNotice] = useState('');
  const [overrides, setOverrides] = useState<StoreSettings['overrides']>([]);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');

  // Add override form
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideForceOpen, setNewOverrideForceOpen] = useState(true);
  const [newOverrideReason, setNewOverrideReason] = useState('');

  // Product Add / Edit Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 499,
    mrp: 999,
    discountPercent: 50,
    category: 'electronics',
    brand: 'CampusMart',
    stock: 20,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    model3dType: 'procedural-headphones' as Model3dType,
    isCafeteria: false,
    isVeg: true,
  });

  const handleRunDailyPriceCheck = async () => {
    setRunningCron(true);
    setCronResultMsg(null);
    try {
      const res = await fetch('/api/cron/price-check', { method: 'POST' });
      const data = (await res.json()) as {
        success?: boolean;
        checkedAlerts?: number;
        notificationsCreated?: number;
        error?: string;
      };
      if (res.ok && data.success) {
        setCronResultMsg(
          `Checked ${data.checkedAlerts ?? 0} active alerts • Dispatched ${data.notificationsCreated ?? 0} new price-drop notifications.`
        );
      } else {
        setCronResultMsg(data.error || 'Price check failed.');
      }
    } catch {
      setCronResultMsg('Network error running daily price check.');
    } finally {
      setRunningCron(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsRes, prodRes, ordRes, settRes, coupRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/products?limit=500'),
          fetch('/api/orders'),
          fetch('/api/admin/settings'),
          fetch('/api/coupons'),
        ]);

        const [statsData, prodData, ordData, settData, coupData] = await Promise.all([
          statsRes.json(),
          prodRes.json(),
          ordRes.json(),
          settRes.json(),
          coupRes.json(),
        ]);

        if (statsData.success) setStats(statsData.stats);
        if (prodData.success) setProducts(prodData.products || []);
        if (ordData.success) setOrders(ordData.orders || []);
        if (coupData.success) setCoupons(coupData.coupons || []);

        if (settData.success && settData.settings) {
          const s = settData.settings;
          setSettings(s);
          setOpenDays(s.openDays || [1, 2, 3, 4, 5]);
          setOpenTime(s.openTime || '00:00');
          setCloseTime(s.closeTime || '23:59');
          setTimezone(s.timezone || 'Asia/Kolkata');
          setWeekendNotice(s.weekendNotice || '');
          setOverrides(s.overrides || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccessMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openDays,
          openTime,
          closeTime,
          timezone,
          weekendNotice,
          overrides,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccessMsg('Operating schedule & weekday rules updated successfully!');
        setTimeout(() => setSettingsSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Add date override
  const handleAddOverride = () => {
    if (!newOverrideDate || !newOverrideReason) return;
    setOverrides([
      ...overrides,
      {
        date: newOverrideDate,
        forceOpen: newOverrideForceOpen,
        reason: newOverrideReason.trim(),
      },
    ]);
    setNewOverrideDate('');
    setNewOverrideReason('');
  };

  const handleRemoveOverride = (index: number) => {
    setOverrides(overrides.filter((_, i) => i !== index));
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders(orders.map((o) => (o.id === orderId ? data.order : o)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Product Create/Edit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        const res = await fetch(`/api/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProducts(products.map((p) => (p.id === editingProductId ? data.product : p)));
          setShowProductModal(false);
          const statsRes = await fetch('/api/admin/stats');
          const statsJson = (await statsRes.json()) as { success?: boolean; stats?: AdminStatsPayload };
          if (statsJson.success && statsJson.stats) {
            setStats(statsJson.stats);
          }
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProducts([data.product, ...products]);
          setShowProductModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campus product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-xs text-gray-500">
          This portal is reserved for campus store administrators. Please log in with admin credentials.
        </p>
        <Link
          href="/admin/login"
          className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white font-bold text-xs shadow-lg shadow-[#FF6A00]/25 hover:brightness-110 transition"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              Management Portal
            </span>
            <span className="text-xs text-gray-400">&bull;</span>
            <span className="text-xs font-mono text-emerald-500 font-semibold">Store Online</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
            CampusMart Admin Control Center
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-slate-800 text-xs font-bold overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Stats & KPIs', icon: TrendingUp },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'products', label: 'Products', icon: Box },
            { id: 'settings', label: 'Weekday & Hours', icon: Calendar },
            { id: 'coupons', label: 'Coupons', icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'products' | 'orders' | 'settings' | 'coupons')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-8">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Total Revenue</span>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-mono">
                ₹{stats.totalRevenue}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">100% Campus Settlement</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Total Campus Orders</span>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {stats.totalOrders}
              </p>
              <span className="text-[10px] text-gray-400">{stats.activeOrders} out for delivery</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Catalog Products</span>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-mono">
                {stats.totalProducts}
              </p>
              <span className="text-[10px] text-amber-600 font-bold">{stats.lowStockCount} low stock alerts</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-semibold">Registered Campus Students</span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {stats.registeredStudents}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">
                {stats.totalActivePriceAlerts ?? 0} active price drop watchers
              </span>
            </div>
          </div>

          {/* Demand Insight: Top Watched Price Alerts */}
          <BackendStatusCard />

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-[#FF6A00]" />
                  <span>Student Price Alert Demand Insights</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Products students are actively watching for price drops ({stats.totalActivePriceAlerts ?? 0} active alerts)
                </p>
              </div>
              <button
                type="button"
                disabled={runningCron}
                onClick={() => void handleRunDailyPriceCheck()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${runningCron ? 'animate-spin' : ''}`} />
                <span>{runningCron ? 'Checking...' : 'Run Price Alert Check'}</span>
              </button>
            </div>

            {cronResultMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                {cronResultMsg}
              </div>
            )}

            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {products
                .filter((p) => (stats.alertDemandStats?.[p.id]?.activeAlertsCount ?? 0) > 0)
                .sort(
                  (a, b) =>
                    (stats.alertDemandStats?.[b.id]?.activeAlertsCount ?? 0) -
                    (stats.alertDemandStats?.[a.id]?.activeAlertsCount ?? 0)
                )
                .slice(0, 6)
                .map((watched) => {
                  const demand = stats.alertDemandStats?.[watched.id];
                  return (
                    <div key={watched.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          {watched.name}
                        </p>
                        <p className="text-gray-500">
                          Current Price: <span className="font-mono font-bold">₹{watched.price.toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-[#FF6A00]/15 text-[#FF6A00] font-bold">
                          {demand?.activeAlertsCount ?? 0} watching
                        </span>
                        <button
                          type="button"
                          onClick={() => setHistoryModalProduct(watched)}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-500 text-xs font-semibold"
                        >
                          History
                        </button>
                      </div>
                    </div>
                  );
                })}
              {products.filter((p) => (stats.alertDemandStats?.[p.id]?.activeAlertsCount ?? 0) > 0)
                .length === 0 && (
                <p className="text-xs text-gray-500 py-2">No active student price alerts recorded yet.</p>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Recent Campus Orders</h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All Orders &rarr;
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600">{ord.orderNumber}</span>
                    <p className="text-gray-500">{ord.customerName} &bull; {ord.address.hostelBlock}, {ord.address.roomNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">₹{ord.totalAmount}</span>
                    <span className="block text-[10px] uppercase font-bold text-emerald-600">{ord.orderStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDERS MANAGEMENT TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Manage Orders & Status Updates ({orders.length})
            </h2>
          </div>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-black text-sm text-blue-600">{ord.orderNumber}</span>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {ord.customerName} &bull; {ord.customerPhone} &bull; {ord.address.hostelBlock}, {ord.address.roomNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white capitalize"
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packed">Packed</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-slate-700 flex justify-between">
                  <span>{ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">₹{ord.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PRODUCTS TAB (CRUD & 3D Model Configuration) */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Product Catalog Management</h2>
              <p className="text-xs text-gray-500">Add, edit stock, and configure 3D models</p>
            </div>
            <button
              onClick={() => {
                setEditingProductId(null);
                setProductForm({
                  name: '',
                  slug: '',
                  description: '',
                  price: 299,
                  mrp: 599,
                  discountPercent: 50,
                  category: 'stationery',
                  brand: 'CampusMart',
                  stock: 25,
                  images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80'],
                  model3dType: 'procedural-bottle',
                  isCafeteria: false,
                  isVeg: true,
                });
                setShowProductModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col justify-between shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img src={p.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-blue-600">{p.category}</span>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{p.name}</h4>
                    <p className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 mt-1">₹{p.price}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 flex-wrap">
                      <span>Stock: <b>{p.stock}</b></span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF6A00]/15 text-[#FF6A00] font-bold">
                        <BellRing className="w-3 h-3" />
                        {stats?.alertDemandStats?.[p.id]?.activeAlertsCount ?? 0} alerts
                      </span>
                      {p.model3dType && <span className="text-indigo-500 font-bold">3D: {p.model3dType}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setHistoryModalProduct(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#FF8800] bg-[#FF6A00]/10 hover:bg-[#FF6A00]/20 transition"
                    title="View Product Price History"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Price History</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingProductId(p.id);
                        setProductForm({
                          name: p.name,
                          slug: p.slug,
                          description: p.description,
                          price: p.price,
                          mrp: p.mrp,
                          discountPercent: p.discountPercent,
                          category: p.category,
                          brand: p.brand,
                          stock: p.stock,
                          images: p.images,
                          model3dType: p.model3dType || 'procedural-headphones',
                          isCafeteria: !!p.isCafeteria,
                          isVeg: p.isVeg !== false,
                        });
                        setShowProductModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. WEEKDAY & OPERATING HOURS SETTINGS TAB (CRUCIAL SPECIAL FEATURE) */}
      {activeTab === 'settings' && (
        <div className="max-w-4xl space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Weekday-Only Ordering & Schedule Configuration
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure store open days, active delivery hours, server timezone, and special holiday overrides without code changes.
              </p>
            </div>

            {settingsSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Allowed Days Checkboxes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Operating Days (Default: Mon–Fri [1,2,3,4,5])
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {DAY_NAMES.map((name, dayIndex) => {
                    const isChecked = openDays.includes(dayIndex);
                    return (
                      <label
                        key={dayIndex}
                        className={`p-3 rounded-2xl border-2 cursor-pointer text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-slate-700 text-gray-400 bg-gray-50/50 dark:bg-slate-900/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOpenDays([...openDays, dayIndex].sort());
                            } else {
                              setOpenDays(openDays.filter((d) => d !== dayIndex));
                            }
                          }}
                          className="hidden"
                        />
                        <span>{name.substring(0, 3)}</span>
                        <span className="text-[10px] font-normal">{isChecked ? 'Open' : 'Closed'}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Operating Hours & Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Opening Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Closing Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Server Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (GMT +0:00)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (BST)</option>
                  </select>
                </div>
              </div>

              {/* Weekend Notice Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Weekend Banner Announcement Notice
                </label>
                <textarea
                  rows={2}
                  value={weekendNotice}
                  onChange={(e) => setWeekendNotice(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white"
                  placeholder="Ordering is closed on Saturday and Sunday. Add items to your cart now and order on Monday!"
                />
              </div>

              {/* Save settings button */}
              <button
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{settingsSaving ? 'Saving...' : 'Save Schedule Settings'}</span>
              </button>
            </form>
          </div>

          {/* Holiday / Date Overrides Manager */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Holiday & Date Overrides (Force Open / Force Closed)</span>
            </h3>

            {/* List existing overrides */}
            <div className="space-y-2">
              {overrides.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No date overrides currently configured.</p>
              ) : (
                overrides.map((ov, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-600">{ov.date}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ov.forceOpen
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {ov.forceOpen ? 'FORCE OPEN' : 'FORCE CLOSED'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">{ov.reason}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOverride(idx)}
                      className="text-gray-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add override row */}
            <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={newOverrideDate}
                  onChange={(e) => setNewOverrideDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Store Mode
                </label>
                <select
                  value={newOverrideForceOpen ? 'true' : 'false'}
                  onChange={(e) => setNewOverrideForceOpen(e.target.value === 'true')}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="true">Force Open (e.g. Campus Fest)</option>
                  <option value="false">Force Closed (e.g. Holiday)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Reason Description
                </label>
                <input
                  type="text"
                  value={newOverrideReason}
                  onChange={(e) => setNewOverrideReason(e.target.value)}
                  placeholder="e.g. Annual Cultural Tech Fest"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleAddOverride}
                className="py-2 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs"
              >
                Add Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Campus Coupons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 font-mono font-bold text-xs text-blue-700 dark:text-blue-300">
                    {c.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-600">Active</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{c.description}</p>
                <p className="text-[11px] text-gray-400">
                  Min order: ₹{c.minOrderValue} &bull; Expires {c.expiresAt.split('T')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Edit/Create Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {editingProductId ? 'Edit Product' : 'Add New Campus Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setProductForm({ ...productForm, name, slug: productForm.slug || slug });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs"
                  >
                    <option value="electronics">Electronics & Tech</option>
                    <option value="stationery">Stationery & Study</option>
                    <option value="books">Books & Reference</option>
                    <option value="dorm">Dorm & Bedding</option>
                    <option value="campus-merch">Campus Merch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    3D Model Preset / Type
                  </label>
                  <select
                    value={productForm.model3dType}
                    onChange={(e) => setProductForm({ ...productForm, model3dType: e.target.value as Model3dType })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-indigo-600"
                  >
                    <option value="procedural-headphones">3D Studio Headphones</option>
                    <option value="procedural-laptop">3D Aluminium Laptop</option>
                    <option value="procedural-bottle">3D Thermal Flask</option>
                    <option value="procedural-backpack">3D Campus Backpack</option>
                    <option value="procedural-cup">3D Cafeteria Mug</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Product Image URL
                </label>
                <input
                  type="text"
                  value={productForm.images[0]}
                  onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Product Price History Modal */}
      {historyModalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Price history for ${historyModalProduct.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg bg-[#0D0D0D] text-white rounded-3xl p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-[#FF8800]">
                  Admin Demand &amp; Price Log
                </span>
                <h3 className="text-base font-black text-white line-clamp-2">
                  {historyModalProduct.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Active Price Drop Watchers:{' '}
                  <span className="font-bold text-[#FF8800]">
                    {stats?.alertDemandStats?.[historyModalProduct.id]?.activeAlertsCount ?? 0}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalProduct(null)}
                aria-label="Close price history modal"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <PriceHistoryChart
              productId={historyModalProduct.id}
              currentPrice={historyModalProduct.price}
            />
          </div>
        </div>
      )}
    </div>
  );
}

