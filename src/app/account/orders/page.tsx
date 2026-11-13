'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderStatus } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  XCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
  ShoppingBag,
} from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightOrderId = searchParams.get('highlight');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(highlightOrderId || null);

  // Cancellation modal
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of delivery room or ordered by mistake');
  const [cancelLoading, setCancelLoading] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
          if (highlightOrderId) {
            setExpandedOrderId(highlightOrderId);
          } else if (data.orders?.length > 0) {
            setExpandedOrderId(data.orders[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [highlightOrderId]);

  const handleCancelOrder = async (orderId: string) => {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancelReason }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders(orders.map((o) => (o.id === orderId ? data.order : o)));
        setCancellingOrderId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReorder = async (order: Order) => {
    // Add all items from this order into cart
    for (const item of order.items) {
      // Create minimal product representation
      addItem(
        {
          id: item.productId,
          name: item.name,
          slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: '',
          price: item.price,
          mrp: item.mrp,
          discountPercent: Math.round(((item.mrp - item.price) / item.mrp) * 100),
          category: 'stationery',
          brand: 'CampusMart',
          rating: 4.8,
          reviewCount: 1,
          images: [item.image],
          stock: 20,
          specs: {},
          tags: [],
          createdAt: new Date().toISOString(),
        },
        item.quantity
      );
    }
    router.push('/cart');
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') {
      return ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.orderStatus);
    }
    if (activeTab === 'delivered') return o.orderStatus === 'delivered';
    if (activeTab === 'cancelled') return o.orderStatus === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Campus Order History</h1>
          <p className="text-xs text-gray-500">Live order tracking across campus and hostel wings</p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-slate-800 text-xs font-bold">
          {(['all', 'active', 'delivered', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl capitalize transition ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin mx-auto" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-4">
          <Package className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No Orders Found</h3>
          <p className="text-xs text-gray-500">
            {activeTab === 'all'
              ? 'You have not placed any orders on CampusMart yet.'
              : `No ${activeTab} orders at the moment.`}
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden"
              >
                {/* Header Summary Bar */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-750 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        order.orderStatus === 'delivered'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                          : order.orderStatus === 'cancelled'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'
                      }`}
                    >
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            order.orderStatus === 'delivered'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : order.orderStatus === 'cancelled'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {order.orderStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} &bull; {order.items.length} items
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <span className="text-base font-black font-mono text-gray-900 dark:text-white">
                        ₹{order.totalAmount}
                      </span>
                      <p className="text-[10px] text-gray-400">Cash on Delivery</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Tracking Timeline & Order Breakdown */}
                {isExpanded && (
                  <div className="p-6 border-t border-gray-100 dark:border-slate-700 space-y-6 bg-gray-50/40 dark:bg-slate-900/40">
                    {/* Visual Tracking Timeline (Placed -> Confirmed -> Packed -> Out for Delivery -> Delivered) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-blue-500" />
                        <span>Live Delivery Progress Timeline</span>
                      </h4>

                      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                          {order.statusTimeline.map((step, idx) => {
                            const isDone = step.completed;
                            const isCurrent = step.current;
                            return (
                              <div key={idx} className="flex flex-col items-start sm:items-center text-left sm:text-center space-y-2 relative">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                    isDone
                                      ? 'bg-emerald-600 text-white shadow-md'
                                      : isCurrent
                                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse'
                                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                                  }`}
                                >
                                  {isDone ? '✓' : idx + 1}
                                </div>
                                <div>
                                  <p
                                    className={`text-xs font-bold ${
                                      isDone || isCurrent
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-400'
                                    }`}
                                  >
                                    {step.title}
                                  </p>
                                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5 max-w-[140px]">
                                    {step.description}
                                  </p>
                                  {step.timestamp && (
                                    <span className="text-[9px] text-gray-400 font-mono block mt-1">
                                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Order Items
                      </h4>
                      <div className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-xl object-cover bg-gray-50 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                <span className="text-gray-500 font-mono">
                                  Quantity: {item.quantity} &bull; ₹{item.price} each
                                </span>
                              </div>
                            </div>
                            <span className="font-bold font-mono text-gray-900 dark:text-white">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Address Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Hostel Address
                        </span>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {order.address.hostelBlock}, {order.address.roomNumber}
                        </p>
                        {order.address.campusGate && <p className="text-gray-500">Gate: {order.address.campusGate}</p>}
                        <p className="text-gray-500">Contact: {order.address.phone}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Payment & Delivery Slot
                        </span>
                        <p className="font-bold text-gray-900 dark:text-white">Slot: {order.deliverySlot}</p>
                        <p className="text-emerald-600 font-bold">Payment Method: Cash on Delivery (COD)</p>
                      </div>
                    </div>

                    {/* Action Bar (Cancel / Reorder) */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                        <button
                          onClick={() => setCancellingOrderId(order.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Cancel Order
                        </button>
                      )}

                      <button
                        onClick={() => handleReorder(order)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder All Items</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 border border-gray-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Cancel Campus Order?</span>
            </h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to cancel this order? Stock items will be returned to the campus inventory.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrderId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => handleCancelOrder(cancellingOrderId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin mx-auto" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

