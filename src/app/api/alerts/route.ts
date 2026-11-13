import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

const CreateAlertSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required').max(120),
  targetPrice: z.number().finite().positive('Target price must be greater than ₹0').optional(),
  active: z.boolean().optional(),
});

const UpdateAlertSchema = z.object({
  alertId: z.string().trim().min(1, 'Alert ID is required').max(120),
  targetPrice: z
    .union([z.number().finite().positive('Target price must be positive'), z.null()])
    .optional(),
  active: z.boolean().optional(),
});

const DeleteAlertBodySchema = z.object({
  alertId: z.string().trim().min(1).max(120).optional(),
  productId: z.string().trim().min(1).max(120).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view alerts.' },
        { status: 401 }
      );
    }

    const alerts = await DataStore.getPriceAlertsByUser(user.userId);
    const filterProductId = req.nextUrl.searchParams.get('productId')?.trim();

    if (filterProductId) {
      const match =
        alerts.find(
          (a) => a.productId === filterProductId || a.product?.slug === filterProductId
        ) ?? null;
      return NextResponse.json({ success: true, alert: match, alerts });
    }

    return NextResponse.json({ success: true, alerts });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load price alerts.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to enable price drop alerts.' },
        { status: 401 }
      );
    }

    const rawBody: unknown = await req.json();
    const parsed = CreateAlertSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid price alert request.',
        },
        { status: 400 }
      );
    }

    const alert = await DataStore.upsertPriceAlert({
      userId: user.userId,
      productId: parsed.data.productId,
      targetPrice: parsed.data.targetPrice,
      active: parsed.data.active ?? true,
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to save price drop alert.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const rawBody: unknown = await req.json();
    const parsed = UpdateAlertSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid alert update payload.',
        },
        { status: 400 }
      );
    }

    const updated = await DataStore.updatePriceAlert(user.userId, parsed.data.alertId, {
      targetPrice: parsed.data.targetPrice,
      active: parsed.data.active,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Price alert not found for your account.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, alert: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update price alert.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    let idToDelete =
      req.nextUrl.searchParams.get('id')?.trim() ||
      req.nextUrl.searchParams.get('productId')?.trim() ||
      '';

    if (!idToDelete) {
      try {
        const rawBody: unknown = await req.json();
        const parsed = DeleteAlertBodySchema.safeParse(rawBody);
        if (parsed.success) {
          idToDelete = parsed.data.alertId || parsed.data.productId || '';
        }
      } catch {
        // Optional body ignored if invalid/empty
      }
    }

    if (!idToDelete) {
      return NextResponse.json(
        { success: false, error: 'Alert ID or Product ID is required.' },
        { status: 400 }
      );
    }

    const removed = await DataStore.deletePriceAlert(user.userId, idToDelete);
    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Price alert not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to remove price alert.' },
      { status: 500 }
    );
  }
}

