import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

const DaysQuerySchema = z.coerce.number().int().min(7).max(365).default(30);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawDays = req.nextUrl.searchParams.get('days') ?? '30';
    const parsedDays = DaysQuerySchema.safeParse(rawDays);
    if (!parsedDays.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid days parameter (must be between 7 and 365).' },
        { status: 400 }
      );
    }

    const history = await DataStore.getProductPriceHistory(params.id, parsedDays.data);
    if (!history) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, history });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load price history.' },
      { status: 500 }
    );
  }
}

