import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

function isAuthorizedCronOrAdmin(req: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get('authorization')?.trim();
  const cronHeader = req.headers.get('x-cron-secret')?.trim();

  if (configuredSecret) {
    if (authHeader === `Bearer ${configuredSecret}` || cronHeader === configuredSecret) {
      return true;
    }
  }

  const user = getUserFromRequest(req);
  if (user && user.role === 'admin') {
    return true;
  }

  return false;
}

async function handlePriceCheck(req: NextRequest) {
  try {
    if (!isAuthorizedCronOrAdmin(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized cron trigger.' },
        { status: 401 }
      );
    }

    // Price alerts run 7 days a week (including weekends)
    const report = await DataStore.runDailyPriceAlertSafetyCheck();
    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Price check job failed.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handlePriceCheck(req);
}

export async function POST(req: NextRequest) {
  return handlePriceCheck(req);
}

