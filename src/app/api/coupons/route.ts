import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateCouponSchema = z.object({
  code: z.string().trim().min(3).max(32),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().finite().positive(),
  minOrderValue: z.number().finite().min(0).default(0),
  maxDiscount: z.number().finite().positive().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
  description: z.string().trim().max(240).default('Campus discount coupon'),
});

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const coupons = await DataStore.getCoupons();
    const visible =
      user?.role === 'admin' ? coupons : coupons.filter((c) => c.isActive);
    return NextResponse.json({ success: true, coupons: visible });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load coupons' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authorization required' },
        { status: 403 }
      );
    }

    const rawBody = await req.json();
    const parsed = CreateCouponSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid coupon data' },
        { status: 400 }
      );
    }

    const defaultExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const coupon = await DataStore.createCoupon({
      ...parsed.data,
      expiresAt: parsed.data.expiresAt || defaultExpiry,
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

