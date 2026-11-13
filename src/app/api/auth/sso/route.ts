import { NextRequest, NextResponse } from 'next/server';
import { DataStore, formatNameFromEmail } from '@/lib/dataStore';
import { signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { provider, email, name } = await req.json();

    const ssoEmail =
      email && email.trim()
        ? email.trim().toLowerCase()
        : 'janethlokineni@gmail.com';

    const ssoName =
      name && name.trim() && !name.toLowerCase().includes('google')
        ? name.trim()
        : formatNameFromEmail(ssoEmail);

    const user = await DataStore.findOrCreateUserBySSO(
      'google',
      ssoEmail,
      ssoName
    );

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      phone: user.phone,
      addresses: user.addresses,
    };

    const res = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: `Signed in successfully with Google!`,
    });

    res.cookies.set('campusmart_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SSO Authentication failed' }, { status: 500 });
  }
}

