import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone } = await req.json();
    const updatedUser = await DataStore.updateUserProfile(payload.userId, { name, phone });

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        studentId: updatedUser.studentId,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

