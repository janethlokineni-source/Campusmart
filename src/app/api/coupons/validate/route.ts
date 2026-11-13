import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const coupons = await DataStore.getCoupons();
  return NextResponse.json({ success: true, coupons });
}

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) {
      return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 });
    }

    const result = await DataStore.validateCoupon(code, Number(subtotal) || 0);
    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const coupon = result.coupon!;
    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = Math.round(((Number(subtotal) || 0) * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return NextResponse.json({
      success: true,
      coupon,
      discount,
      message: `Coupon "${coupon.code}" applied successfully! You saved ₹${discount}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to validate coupon' }, { status: 500 });
  }
}

