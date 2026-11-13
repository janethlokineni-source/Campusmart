import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { checkSupabaseHealth } from '@/lib/supabase';
import { syncSeedDataToSupabase } from '@/lib/supabaseStore';

export const dynamic = 'force-dynamic';

const SyncBodySchema = z.object({
  force: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Admin authorization required' },
      { status: 403 }
    );
  }

  const health = await checkSupabaseHealth(true);
  return NextResponse.json({
    success: true,
    supabase: health,
  });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Admin authorization required' },
      { status: 403 }
    );
  }

  let force = false;
  try {
    const rawBody = await req.json();
    const parsed = SyncBodySchema.safeParse(rawBody);
    if (parsed.success && parsed.data.force !== undefined) {
      force = parsed.data.force;
    }
  } catch {
    // Empty request body defaults to non-destructive sync
  }

  const summary = await syncSeedDataToSupabase(force);
  const health = await checkSupabaseHealth(true);

  return NextResponse.json(
    {
      ...summary,
      supabase: health,
    },
    { status: summary.success ? 200 : 400 }
  );
}

