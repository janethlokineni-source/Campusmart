import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';
import { isOrderingOpen } from '@/lib/storeStatus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const settings = await DataStore.getStoreSettings();
    const liveStatus = isOrderingOpen(new Date(), settings.timezone, settings);

    return NextResponse.json({
      success: true,
      settings,
      liveStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await DataStore.updateStoreSettings(body);
    const liveStatus = isOrderingOpen(new Date(), updated.timezone, updated);

    return NextResponse.json({
      success: true,
      settings: updated,
      liveStatus,
      message: 'Store operating settings updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 400 });
  }
}

