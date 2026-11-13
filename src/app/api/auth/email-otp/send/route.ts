import { NextRequest, NextResponse } from 'next/server';
import { setOtpForEmail } from '@/lib/otpStore';
import { sendOtpEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Gmail address' },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpForEmail(cleanEmail, generatedOtp, 5 * 60 * 1000);

    const emailResult = await sendOtpEmail({
      email: cleanEmail,
      otp: generatedOtp,
    });

    return NextResponse.json({
      success: true,
      message: emailResult.message,
      isLiveSmtp: emailResult.isLiveSmtp,
      expiresSeconds: 60,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP to Gmail' },
      { status: 500 }
    );
  }
}

