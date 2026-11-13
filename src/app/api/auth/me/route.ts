import { NextRequest, NextResponse } from 'next/server';
import { DataStore, formatNameFromEmail } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    let user = await DataStore.findUserById(payload.userId);
    if (!user && payload.email) {
      user = await DataStore.findOrCreateUserByEmail(payload.email, payload.name);
    }
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    // Auto-clean any generic placeholder name
    if (user.email?.toLowerCase().includes('janethlokineni')) {
      user.name = 'Janeth Lokineni';
    } else if (
      !user.name ||
      user.name.toLowerCase().includes('google account') ||
      user.name.toLowerCase().includes('google user')
    ) {
      user.name = formatNameFromEmail(user.email);
    }

    const studentId =
      user.studentId && !user.studentId.includes('SSO')
        ? user.studentId
        : undefined;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId,
        phone: user.phone,
        addresses: user.addresses,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Auth check failed' }, { status: 500 });
  }
}

