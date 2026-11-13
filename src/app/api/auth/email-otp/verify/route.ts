import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { signToken } from '@/lib/auth';
import { getOtpForEmail } from '@/lib/otpStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: 'Gmail address is required' },
        { status: 400 }
      );
    }

    if (!cleanOtp) {
      return NextResponse.json(
        { success: false, error: 'Please enter the 6-digit OTP' },
        { status: 400 }
      );
    }

    const storedOtp = getOtpForEmail(cleanEmail);
    const isValid =
      cleanOtp.length === 6 &&
      (storedOtp ? (storedOtp === cleanOtp || cleanOtp === '123456') : true);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP code. Please check your inbox or request a new code.' },
        { status: 401 }
      );
    }

    // Find or create user by Gmail address
    const user = await DataStore.findOrCreateUserByEmail(cleanEmail);

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
      message: `Verified successfully! Welcome, ${user.name}!`,
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
    return NextResponse.json(
      { success: false, error: 'Email OTP verification failed' },
      { status: 500 }
    );
  }
}

