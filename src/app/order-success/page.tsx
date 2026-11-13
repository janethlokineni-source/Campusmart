'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Order } from '@/types';
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Clock,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fire confetti celebration on arrival
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
          <CheckCircle className="w-12 h-12" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          Order Successfully Placed!
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          Thank you for ordering, {order?.customerName || 'Campus Student'}!
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          Our campus warehouse is preparing your package. A delivery runner will contact you at your hostel room shortly.
        </p>
      </div>

      {/* Order Info Card */}
      {order && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Order Reference
              </span>
              <p className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                {order.orderNumber}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Payable (COD)
              </span>
              <p className="text-base font-black text-gray-900 dark:text-white font-mono">
                ₹{order.totalAmount}
              </p>
            </div>
          </div>

          {/* Delivery & Address Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 mb-1">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Delivery Address</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {order.address.hostelBlock}, {order.address.roomNumber}
              </p>
              {order.address.campusGate && (
                <p className="text-gray-500">Gate: {order.address.campusGate}</p>
              )}
              <p className="text-gray-500">Contact: {order.address.phone}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Estimated Arrival Slot</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">{order.deliverySlot}</p>
              <p className="text-gray-500">Payment: Cash on Delivery at room</p>
              <p className="text-emerald-600 font-bold">Fast Campus Runner Assigned</p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Ordered Items ({order.items.length})
            </h4>
            <div className="divide-y divide-gray-100 dark:divide-slate-700/60">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <span className="text-gray-400 font-mono">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href={`/account/orders?highlight=${orderId}`}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          <span>Track Live Order Status</span>
        </Link>

        <Link
          href="/products"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Back to Campus Store</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin mx-auto" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}

