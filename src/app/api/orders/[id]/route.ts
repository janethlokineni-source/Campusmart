import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';
import { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await DataStore.getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve order' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const { status, note, cancelReason } = body;

    const order = await DataStore.getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Customer can only cancel their own order before it is out for delivery
    if (status === 'cancelled') {
      if (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered') {
        return NextResponse.json(
          { success: false, error: 'Cannot cancel an order that is out for delivery or delivered.' },
          { status: 400 }
        );
      }
      order.cancellationReason = cancelReason || note || 'Cancelled by customer';
      const updated = await DataStore.updateOrderStatus(
        params.id,
        'cancelled',
        `Cancelled: ${order.cancellationReason}`
      );
      return NextResponse.json({ success: true, order: updated });
    }

    // Other status transitions require Admin privileges
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin privileges required' }, { status: 403 });
    }

    const updated = await DataStore.updateOrderStatus(params.id, status as OrderStatus, note);
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Update failed' }, { status: 400 });
  }
}

