import { NextResponse } from 'next/server';
import { checkSupabaseHealth } from '@/lib/supabase';
import connectToDatabase from '@/lib/db';
import { SqliteStore } from '@/lib/sqliteDb';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await checkSupabaseHealth();
    const { isConnected: mongoConnected } = supabase.schemaReady
      ? { isConnected: false }
      : await connectToDatabase();
    const sqlite = SqliteStore.getHealth();

    const activeBackend: 'supabase' | 'mongodb' | 'sqlite' | 'memory' = supabase.schemaReady
      ? 'supabase'
      : mongoConnected
      ? 'mongodb'
      : sqlite.connected
      ? 'sqlite'
      : 'memory';

    const { total: productCount } = await DataStore.getProducts({ limit: 1 });
    const categories = await DataStore.getCategories();

    return NextResponse.json({
      success: true,
      status: 'ok',
      activeBackend,
      supabase,
      mongodb: {
        connected: mongoConnected,
      },
      sqlite,
      catalog: {
        products: productCount,
        categories: categories.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: err instanceof Error ? err.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}

