import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
  }

  const reviews = await DataStore.getReviews(productId);
  return NextResponse.json({ success: true, reviews });
}

const ReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const validated = ReviewSchema.parse(body);

    const userName = user?.name || body.userName || 'Verified Student';
    const userId = user?.userId || 'guest-student';

    const review = await DataStore.addReview({
      productId: validated.productId,
      userId,
      userName,
      rating: validated.rating,
      comment: validated.comment,
      verifiedPurchase: true,
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.errors || err?.message || 'Review submission failed' }, { status: 400 });
  }
}

