import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('CampusMart Supabase Seed Sync');
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project-ref')) {
    console.log('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
    console.log('1. Copy your Project URL, Anon Key, and Service Role Key from Supabase -> Settings -> API.');
    console.log('2. Run supabase/schema.sql in Supabase -> SQL Editor.');
    console.log('3. Re-run `npm run seed:supabase` while `npm run dev` is running on ' + baseUrl);
    process.exit(1);
  }

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'AdminCampus2026!',
      requireAdmin: true,
    }),
  });

  if (!loginRes.ok) {
    console.error(`Admin login failed at ${baseUrl}/api/auth/login (${loginRes.status}). Make sure the dev server is running.`);
    process.exit(1);
  }

  const loginJson = await loginRes.json();
  const syncRes = await fetch(`${baseUrl}/api/admin/supabase-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginJson.token}`,
    },
    body: JSON.stringify({ force: false }),
  });

  const syncJson = await syncRes.json();
  if (!syncRes.ok || !syncJson.success) {
    console.error('Supabase sync failed:', syncJson.error || syncJson);
    process.exit(1);
  }

  console.log('✓ Synced CampusMart data to Supabase:');
  console.log(`  - Categories: ${syncJson.categoriesSynced}`);
  console.log(`  - Products: ${syncJson.productsSynced}`);
  console.log(`  - Coupons: ${syncJson.couponsSynced}`);
  console.log(`  - Demo Users: ${syncJson.usersSynced}`);
  console.log(`  - Price History Points: ${syncJson.priceHistorySynced}`);
  console.log(`  - Price Alerts: ${syncJson.priceAlertsSynced}`);
  console.log(`  - Notifications: ${syncJson.notificationsSynced}`);
  console.log(`  - AI Chat Sessions: ${syncJson.chatSessionsSynced}`);
}

main().catch((err) => {
  console.error('Supabase seed sync error:', err?.message || err);
  process.exit(1);
});

