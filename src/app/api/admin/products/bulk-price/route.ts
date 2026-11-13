import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

const BulkPriceSchema = z.object({
  updates: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(120),
        price: z.number().finite().positive(),
        mrp: z.number().finite().positive().optional(),
      })
    )
    .min(1)
    .max(200),
});

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authorization required.' },
        { status: 403 }
      );
    }

    const rawBody: unknown = await req.json();
    const parsed = BulkPriceSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid bulk price update payload.',
        },
        { status: 400 }
      );
    }

    const result = await DataStore.bulkUpdateProductPrices(parsed.data.updates);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk price update.' },
      { status: 500 }
    );
  }
}

