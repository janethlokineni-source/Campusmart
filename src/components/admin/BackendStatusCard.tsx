'use client';

import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface HealthResponse {
  success: boolean;
  activeBackend: 'supabase' | 'mongodb' | 'sqlite' | 'memory';
  supabase: {
    configured: boolean;
    adminConfigured: boolean;
    connected: boolean;
    schemaReady: boolean;
    urlHost?: string;
    error?: string;
  };
  mongodb: {
    connected: boolean;
  };
  sqlite?: {
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
  };
  catalog: {
    products: number;
    categories: number;
  };
}

interface SyncResponse {
  success?: boolean;
  productsSynced?: number;
  categoriesSynced?: number;
  priceAlertsSynced?: number;
  error?: string;
}

export default function BackendStatusCard() {
  const { token } = useAuthStore();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = (await res.json()) as HealthResponse;
      if (data.success) {
        setHealth(data);
      }
    } catch {
      setStatusMessage('Unable to fetch backend health status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealth();
  }, []);

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/supabase-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ force: false }),
      });
      const data = (await res.json()) as SyncResponse;
      if (res.ok && data.success) {
        setStatusMessage(
          `Synced ${data.productsSynced ?? 0} products, ${data.categoriesSynced ?? 0} categories, and ${data.priceAlertsSynced ?? 0} alerts to Supabase.`
        );
        await fetchHealth();
      } else {
        setStatusMessage(data.error || 'Supabase sync failed. Check .env.local and supabase/schema.sql.');
      }
    } catch {
      setStatusMessage('Network error syncing data to Supabase.');
    } finally {
      setSyncing(false);
    }
  };

  const backendLabel =
    health?.activeBackend === 'supabase'
      ? 'Supabase PostgreSQL (Live)'
      : health?.activeBackend === 'mongodb'
      ? 'MongoDB (Live)'
      : health?.activeBackend === 'sqlite'
      ? 'SQLite Persistent Database (Live)'
      : 'In-Memory Seed Fallback';

  const sqliteSizeKb = health?.sqlite?.fileSizeBytes
    ? Math.max(1, Math.round(health.sqlite.fileSizeBytes / 1024))
    : 0;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-700">
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Database &amp; Backend Connection</span>
          </h3>
          <p className="text-xs text-gray-500">
            Active Store: <span className="font-bold text-gray-800 dark:text-gray-200">{loading ? 'Checking...' : backendLabel}</span>
            {health?.activeBackend === 'sqlite' ? ' • data/campusmart.db' : ''}
            {health?.supabase?.urlHost ? ` • ${health.supabase.urlHost}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchHealth()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-600 text-xs font-semibold hover:border-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            disabled={syncing || loading}
            onClick={() => void handleSyncToSupabase()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{syncing ? 'Syncing...' : 'Sync Seed Data to Supabase'}</span>
          </button>
        </div>
      </div>

      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/70">
            <span className="text-gray-500 block">Local SQLite Database</span>
            <span className="font-bold flex items-center gap-1.5 mt-1 text-gray-900 dark:text-white">
              {health.sqlite?.connected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Connected ({sqliteSizeKb} KB)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Unavailable
                </>
              )}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/70">
            <span className="text-gray-500 block">Cloud Sync (Supabase)</span>
            <span className="font-bold flex items-center gap-1.5 mt-1 text-gray-900 dark:text-white">
              {health.supabase.schemaReady ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Connected &amp; Tables Ready
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  Optional (.env.local)
                </>
              )}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/70">
            <span className="text-gray-500 block">Database Records</span>
            <span className="font-bold mt-1 block text-gray-900 dark:text-white">
              {health.catalog.products} Products • {health.sqlite?.counts.users ?? 0} Users • {health.sqlite?.counts.orders ?? 0} Orders
            </span>
          </div>
        </div>
      )}

      {health?.supabase?.error && health.activeBackend === 'memory' && !statusMessage && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
          {health.supabase.error}
        </div>
      )}

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
