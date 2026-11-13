import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { isOrderingOpen } from '@/lib/storeStatus';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await DataStore.getStoreSettings();
    const now = new Date();
    const status = isOrderingOpen(now, settings.timezone, settings);

    return NextResponse.json({
      success: true,
      ...status,
      settings: {
        openDays: settings.openDays,
        openTime: settings.openTime,
        closeTime: settings.closeTime,
        timezone: settings.timezone,
        overridesCount: settings.overrides?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to check store status' },
      { status: 500 }
    );
  }
}

