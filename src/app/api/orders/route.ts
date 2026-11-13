import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { isOrderingOpen } from '@/lib/storeStatus';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    // If admin, can see all; if logged-in customer, see own; if query param userId supplied
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId');

    if (user?.role === 'admin' && !userIdParam) {
      const orders = await DataStore.getOrders();
      return NextResponse.json({ success: true, orders });
    }

    const targetUserId = userIdParam || user?.userId;
    const orders = await DataStore.getOrders(targetUserId);
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

const CreateOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    })
  ).min(1),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    hostelBlock: z.string().min(2),
    roomNumber: z.string().min(1),
    campusGate: z.string().optional(),
    landmark: z.string().optional(),
  }),
  deliverySlot: z.string().min(3),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. BACKEND WEEKDAY-ONLY ORDERING ENFORCEMENT
    const settings = await DataStore.getStoreSettings();
    const serverNow = new Date();
    const storeStatus = isOrderingOpen(serverNow, settings.timezone, settings);

    if (!storeStatus.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error: 'Weekend Ordering Closed',
          message: storeStatus.message,
          nextOpenAt: storeStatus.nextOpenAt,
          currentDay: storeStatus.currentDay,
          currentTimeString: storeStatus.currentTimeString,
        },
        { status: 403 }
      );
    }

    // 2. Parse payload
    const body = await req.json();
    const validated = CreateOrderSchema.parse(body);

    // 3. Re-validate latest product prices, availability & stock from DB (crucial edge case!)
    const orderItems = [];
    let subtotal = 0;
    let mrpTotal = 0;

    for (const item of validated.items) {
      const product = await DataStore.getProductByIdOrSlug(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} is no longer available.` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${product.stock} units available for "${product.name}". Please update your cart.`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      const itemMrpTotal = product.mrp * item.quantity;
      subtotal += itemTotal;
      mrpTotal += itemMrpTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        quantity: item.quantity,
        isCafeteria: product.isCafeteria,
      });
    }

    // 4. Coupon Calculation
    let couponDiscount = 0;
    let validCouponCode: string | undefined = undefined;
    if (validated.couponCode) {
      const couponRes = await DataStore.validateCoupon(validated.couponCode, subtotal);
      if (couponRes.valid && couponRes.coupon) {
        validCouponCode = couponRes.coupon.code;
        if (couponRes.coupon.discountType === 'percent') {
          couponDiscount = Math.round((subtotal * couponRes.coupon.discountValue) / 100);
          if (couponRes.coupon.maxDiscount && couponDiscount > couponRes.coupon.maxDiscount) {
            couponDiscount = couponRes.coupon.maxDiscount;
          }
        } else {
          couponDiscount = couponRes.coupon.discountValue;
        }
      }
    }

    // 5. Delivery fee: Free for campus orders above ₹199, else ₹25
    const deliveryFee = subtotal >= 199 ? 0 : 25;
    const platformFee = 5;
    const discount = Math.max(0, mrpTotal - subtotal);
    const totalAmount = Math.max(0, subtotal - couponDiscount + deliveryFee + platformFee);

    // User session if logged in
    const user = getUserFromRequest(req);

    // 6. Create Order
    const newOrder = await DataStore.createOrder({
      userId: user?.userId || 'guest-student',
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone,
      items: orderItems,
      address: {
        id: `addr-${Date.now()}`,
        ...validated.address,
      },
      deliverySlot: validated.deliverySlot,
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'placed',
      subtotal,
      mrpTotal,
      discount,
      couponCode: validCouponCode,
      couponDiscount,
      deliveryFee,
      platformFee,
      totalAmount,
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.errors || err?.message || 'Failed to place order' },
      { status: 400 }
    );
  }
}

