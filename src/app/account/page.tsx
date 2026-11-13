'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import { Order } from '@/types';
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  Mail,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Edit3,
  Check,
  X,
  BellRing,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout, checkAuth, setUser } = useAuthStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { alerts, fetchAlerts } = useAlertsStore();

  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
    void fetchAlerts();
  }, [checkAuth, fetchAlerts]);

  const getCleanName = () => {
    if (user?.email?.toLowerCase().includes('janethlokineni')) {
      return 'Janeth Lokineni';
    }
    if (user?.name && !user.name.toLowerCase().includes('google account') && !user.name.toLowerCase().includes('google user')) {
      return user.name;
    }
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      if (prefix.toLowerCase() === 'janethlokineni') return 'Janeth Lokineni';
      const parts = prefix.split(/[\._\-0-9]+/).filter(Boolean);
      if (parts.length > 0) {
        return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
      }
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Janeth Lokineni';
  };

  const currentDisplayName = getCleanName();

  const handleSaveName = async () => {
    if (!editedName.trim() || !user) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser({ ...user, name: editedName.trim() });
      }
      setIsEditingName(false);
    } catch (e) {
      setUser({ ...user, name: editedName.trim() });
      setIsEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && data.orders) {
          const active = (data.orders as Order[]).filter((o) =>
            ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.orderStatus)
          ).length;
          setActiveOrdersCount(active);
        }
      } catch (e) {
        // ignore
      }
    }
    loadStats();
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center animate-pulse">
          <UserIcon className="w-8 h-8" />
        </div>
        <p className="text-xs text-slate-400">Loading your account details...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-gray-500">
          Please log in with your university student or faculty credentials to access your account.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Summary */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md text-white font-black text-2xl flex items-center justify-center shadow-inner uppercase">
            {currentDisplayName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your name"
                    className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-sm font-bold border border-white/30 focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={handleSaveName}
                    className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                    title="Save name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black">{currentDisplayName}</h1>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(currentDisplayName);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition"
                    title="Edit Name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                {user.role === 'admin' ? 'Campus Admin' : 'Student'}
              </span>
            </div>
            <p className="text-xs text-blue-100 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </p>
            {user.studentId && !user.studentId.startsWith('SSO-') && (
              <p className="text-xs text-blue-200 font-mono">
                ID: {user.studentId}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={async () => {
            await logout();
            router.push('/');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Quick Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/account/orders"
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:border-blue-500 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">My Orders</p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {activeOrdersCount} Active
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" />
        </Link>

        <Link
          href="/wishlist"
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:border-rose-500 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-slate-700 text-rose-500 group-hover:scale-105 transition">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Wishlist</p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {wishlistCount} Saved Items
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-rose-500 transition" />
        </Link>

        <Link
          href="/account/alerts"
          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:border-[#FF6A00] transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-[#FF6A00]/15 text-[#FF6A00] group-hover:scale-105 transition">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">My Alerts</p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {alerts.filter((a) => a.active).length} Watching
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF6A00] transition" />
        </Link>

        {user.role === 'admin' ? (
          <Link
            href="/admin"
            className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:border-indigo-500 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-slate-700 text-indigo-500 group-hover:scale-105 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Management</p>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  Admin Panel
                </h3>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition" />
          </Link>
        ) : (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-slate-700 text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Verification</p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Verified Campus Student
              </h3>
            </div>
          </div>
        )}
      </div>

      {/* Saved Addresses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span>Saved Campus & Hostel Addresses</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(user.addresses || []).map((addr) => (
            <div
              key={addr.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-2 relative"
            >
              {addr.isDefault && (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  Default Room
                </span>
              )}
              <p className="font-bold text-sm text-gray-900 dark:text-white">{addr.fullName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {addr.hostelBlock}, {addr.roomNumber}
              </p>
              {addr.campusGate && (
                <p className="text-xs text-gray-500">Pickup Gate: {addr.campusGate}</p>
              )}
              <p className="text-xs text-gray-500 font-mono">Phone: {addr.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

