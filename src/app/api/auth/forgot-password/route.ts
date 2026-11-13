import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();
    const cleanId = (identifier || '').trim();

    if (!cleanId) {
      return NextResponse.json(
        { success: false, error: 'Please enter your Campus Email or Roll Number' },
        { status: 400 }
      );
    }

    const user = await DataStore.findUserByIdentifier(cleanId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No student or faculty account found for this ID/Email.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset verification link has been dispatched to ${user.email}. Please check your inbox.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Password reset request failed' }, { status: 500 });
  }
}

