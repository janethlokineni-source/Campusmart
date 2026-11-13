import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseStatusSnapshot {
  configured: boolean;
  adminConfigured: boolean;
  connected: boolean;
  schemaReady: boolean;
  urlHost?: string;
  error?: string;
}

interface GlobalSupabaseCache {
  adminClient?: SupabaseClient | null;
  anonClient?: SupabaseClient | null;
  lastKeyFingerprint?: string;
  schemaReadyCache?: { checkedAt: number; value: boolean; connected: boolean; error?: string };
}

declare global {
  // eslint-disable-next-line no-var
  var campusMartSupabaseCache: GlobalSupabaseCache | undefined;
}

const cache: GlobalSupabaseCache = global.campusMartSupabaseCache ?? {};
if (!global.campusMartSupabaseCache) {
  global.campusMartSupabaseCache = cache;
}

function normalizeEnvValue(val: string | undefined): string {
  return (val ?? '').trim();
}

function isPlaceholder(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('your_supabase') ||
    lower.includes('your-project-ref') ||
    lower.includes('example.supabase.co') ||
    lower === 'changeme'
  );
}

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
} {
  const url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const anonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY);
  const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, anonKey, serviceRoleKey };
}

export function isValidSupabaseUrl(url: string): boolean {
  if (isPlaceholder(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  return isValidSupabaseUrl(url) && (!isPlaceholder(anonKey) || !isPlaceholder(serviceRoleKey));
}

export function isSupabaseAdminConfigured(): boolean {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return isValidSupabaseUrl(url) && !isPlaceholder(serviceRoleKey);
}

function ensureFingerprintReset(url: string, serviceRoleKey: string, anonKey: string): void {
  const fingerprint = `${url}|${serviceRoleKey.slice(0, 12)}|${anonKey.slice(0, 12)}`;
  if (cache.lastKeyFingerprint !== fingerprint) {
    cache.lastKeyFingerprint = fingerprint;
    cache.adminClient = undefined;
    cache.anonClient = undefined;
    cache.schemaReadyCache = undefined;
  }
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  if (!isValidSupabaseUrl(url) || isPlaceholder(serviceRoleKey)) return null;

  ensureFingerprintReset(url, serviceRoleKey, anonKey);

  if (!cache.adminClient) {
    cache.adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cache.adminClient;
}

export function getSupabaseAnonClient(): SupabaseClient | null {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  if (!isValidSupabaseUrl(url) || isPlaceholder(anonKey)) return null;

  ensureFingerprintReset(url, serviceRoleKey, anonKey);

  if (!cache.anonClient) {
    cache.anonClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cache.anonClient;
}

export function resetSupabaseHealthCache(): void {
  cache.schemaReadyCache = undefined;
}

export async function checkSupabaseHealth(forceRefresh = false): Promise<SupabaseStatusSnapshot> {
  const { url } = getSupabaseConfig();
  const configured = isSupabaseConfigured();
  const adminConfigured = isSupabaseAdminConfigured();

  let urlHost: string | undefined;
  if (isValidSupabaseUrl(url)) {
    try {
      urlHost = new URL(url).host;
    } catch {
      urlHost = undefined;
    }
  }

  if (!configured) {
    return {
      configured: false,
      adminConfigured: false,
      connected: false,
      schemaReady: false,
      urlHost,
      error: 'Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env.local',
    };
  }

  const now = Date.now();
  if (!forceRefresh && cache.schemaReadyCache && now - cache.schemaReadyCache.checkedAt < 15_000) {
    return {
      configured,
      adminConfigured,
      connected: cache.schemaReadyCache.connected,
      schemaReady: cache.schemaReadyCache.value,
      urlHost,
      error: cache.schemaReadyCache.error,
    };
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return {
      configured: false,
      adminConfigured: false,
      connected: false,
      schemaReady: false,
      urlHost,
      error: 'Unable to initialize Supabase client',
    };
  }

  try {
    const { error } = await client.from('products').select('id').limit(1);
    if (!error) {
      cache.schemaReadyCache = { checkedAt: now, connected: true, value: true };
      return {
        configured,
        adminConfigured,
        connected: true,
        schemaReady: true,
        urlHost,
      };
    }

    const msg = error.message || 'Supabase query failed';
    const isMissingTable =
      msg.toLowerCase().includes('does not exist') ||
      msg.toLowerCase().includes('could not find the table') ||
      error.code === '42P01' ||
      error.code === 'PGRST205';

    cache.schemaReadyCache = {
      checkedAt: now,
      connected: isMissingTable,
      value: false,
      error: isMissingTable
        ? 'Connected to Supabase, but CampusMart tables are missing. Run supabase/schema.sql in Supabase SQL Editor.'
        : msg,
    };

    return {
      configured,
      adminConfigured,
      connected: isMissingTable,
      schemaReady: false,
      urlHost,
      error: cache.schemaReadyCache.error,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error reaching Supabase';
    cache.schemaReadyCache = { checkedAt: now, connected: false, value: false, error: msg };
    return {
      configured,
      adminConfigured,
      connected: false,
      schemaReady: false,
      urlHost,
      error: msg,
    };
  }
}

