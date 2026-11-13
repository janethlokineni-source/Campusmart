import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

const LimitSchema = z.coerce.number().int().min(1).max(100).default(30);

const MarkReadSchema = z.object({
  notificationId: z.string().trim().min(1).max(120).optional(),
  markAll: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const parsedLimit = LimitSchema.safeParse(req.nextUrl.searchParams.get('limit') ?? '30');
    const limit = parsedLimit.success ? parsedLimit.data : 30;

    const { notifications, unreadCount } = await DataStore.getNotificationsByUser(
      user.userId,
      limit
    );

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications.' },
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
    const parsed = MarkReadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification update payload.' },
        { status: 400 }
      );
    }

    const targetId = parsed.data.markAll ? undefined : parsed.data.notificationId;
    const { updated } = await DataStore.markNotificationsRead(user.userId, targetId);
    const { unreadCount } = await DataStore.getNotificationsByUser(user.userId, 30);

    return NextResponse.json({
      success: true,
      updated,
      unreadCount,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications.' },
      { status: 500 }
    );
  }
}

