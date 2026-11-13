'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useStoreStatusStore } from '@/store/useStoreStatusStore';
import WeekendCountdownTimer from '@/components/common/WeekendCountdownTimer';
import {
  MapPin,
  Clock,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const HOSTEL_BLOCKS = [
  'Ramanujan Hall - Block 1',
  'Ramanujan Hall - Block 2',
  'Ramanujan Hall - Block 3',
  'Ramanujan Hall - Block 4',
  'Sarabhai Hall - Block 5',
  'Sarabhai Hall - Block 6',
  'Sarabhai Hall - Block 7',
  'Sarabhai Hall - Block 8',
  'Kalpana Chawla Girls Hostel - Wing A',
  'Kalpana Chawla Girls Hostel - Wing B',
  'Faculty & Staff Quarters - Block Q',
  'Campus Gate Pickup Point',
];

const DELIVERY_SLOTS = [
  { id: 'immediate', title: 'Fast Hostel Delivery', time: 'Express Handover' },
  { id: 'lunch', title: 'Lunch Slot', time: '12:30 PM - 2:00 PM' },
  { id: 'evening', title: 'Evening Study Slot', time: '5:30 PM - 7:30 PM' },
  { id: 'night', title: 'Night Owl Slot', time: '9:00 PM - 11:00 PM' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, appliedCoupon, couponDiscount, clearCart, getSubtotal, getMrpTotal, getDeliveryFee, getPlatformFee, getFinalTotal } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { status, fetchStatus } = useStoreStatusStore();

  const isStoreOpen = status ? status.isOpen : true;

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [hostelBlock, setHostelBlock] = useState(HOSTEL_BLOCKS[0]);
  const [roomNumber, setRoomNumber] = useState('');
  const [campusGate, setCampusGate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0].title);
  const [landmark, setLandmark] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchStatus();
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.addresses && user.addresses.length > 0) {
        const def = user.addresses[0];
        if (def.hostelBlock) setHostelBlock(def.hostelBlock);
        if (def.roomNumber) setRoomNumber(def.roomNumber);
        if (def.campusGate) setCampusGate(def.campusGate);
        if (def.landmark) setLandmark(def.landmark);
      }
    }
  }, [user, fetchStatus]);

  const subtotal = getSubtotal();
  const mrpTotal = getMrpTotal();
  const deliveryFee = getDeliveryFee();
  const platformFee = getPlatformFee();
  const finalTotal = getFinalTotal();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        address: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          hostelBlock,
          roomNumber,
          campusGate,
          landmark,
        },
        deliverySlot: selectedSlot,
        couponCode: appliedCoupon?.code,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 403 || !data.success) {
        // Weekend or other rejection
        setErrorMessage(data.message || data.error || 'Failed to place order.');
        setLoading(false);
        return;
      }

      // Order created successfully!
      clearCart();
      router.push(`/order-success?orderId=${data.order.id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while creating order.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No items to checkout</h2>
        <p className="text-xs text-gray-500">Your cart is empty. Please add products first.</p>
        <button
          onClick={() => router.push('/products')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Weekend Ordering Notice Alert if closed */}
      {!isStoreOpen && status && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border-2 border-amber-400 dark:border-amber-700 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Weekend Ordering Inactive: Orders Open on Monday</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            {status.message} The university dispatch network is closed over the weekend.
            Your items are safe in your cart. You can submit this order on Monday!
          </p>
          {status.nextOpenAt && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
                Countdown to Monday Dispatch:
              </span>
              <WeekendCountdownTimer targetDateString={status.nextOpenAt} compact />
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Campus Checkout</h1>
        <p className="text-xs text-gray-500">
          Delivery to hostel rooms, campus gates, or department reading halls
        </p>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Student Information & Hostel Address */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Hostel Room & Campus Delivery Address
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Student / Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number (for Runner Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Hostel Block / Department *
                  </label>
                  <select
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {HOSTEL_BLOCKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Room / Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. Room 314"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Campus Gate Pickup (Optional)
                  </label>
                  <input
                    type="text"
                    value={campusGate}
                    onChange={(e) => setCampusGate(e.target.value)}
                    placeholder="e.g. North Gate 2 or Library Entry"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Landmark / Note for Runner
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Badminton court or elevator"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Slot */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Select Delivery Slot
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DELIVERY_SLOTS.map((slot) => (
                  <label
                    key={slot.id}
                    className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                      selectedSlot === slot.title
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="deliverySlot"
                        checked={selectedSlot === slot.title}
                        onChange={() => setSelectedSlot(slot.title)}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{slot.title}</p>
                        <p className="text-[11px] text-gray-500">{slot.time}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Payment Method
                </h3>
              </div>

              <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Cash on Delivery (COD) / Campus Pay on Handover
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Pay cash or UPI directly to your campus delivery runner at your door.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase">Selected</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Submit */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
                Order Review ({items.length} items)
              </h3>

              {/* Items mini list */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="font-bold text-blue-600 font-mono">{quantity}x</span>
                      <span className="text-gray-800 dark:text-gray-200 truncate">{product.name}</span>
                    </div>
                    <span className="font-bold font-mono text-gray-900 dark:text-white shrink-0">
                      ₹{product.price * quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Details */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span className="font-mono">-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono">
                    {deliveryFee === 0 ? <span className="text-emerald-600 font-bold uppercase">Free</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-mono">₹{platformFee}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-black text-gray-900 dark:text-white">Total Payable</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                  ₹{finalTotal}
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* SUBMIT BUTTON WITH WEEKDAY CHECK */}
              <button
                type="submit"
                disabled={loading || !isStoreOpen}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                  !isStoreOpen
                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:scale-102 active:scale-98'
                }`}
                title={!isStoreOpen ? 'Ordering closed on weekends. Orders resume Monday!' : 'Confirm and place order'}
              >
                {loading ? (
                  <span>Processing Campus Order...</span>
                ) : !isStoreOpen ? (
                  <span>Orders Resume Monday (Closed)</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Place Campus Order &bull; ₹{finalTotal}</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-gray-500 text-center space-y-1">
                <p>100% Student Verified Delivery Service</p>
                <p>Hostel room delivery directly to your door</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

