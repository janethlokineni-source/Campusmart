import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const badges = await DataStore.getPriceDropBadgesMap();
    return NextResponse.json({ success: true, badges });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price badges.' },
      { status: 500 }
    );
  }
}

