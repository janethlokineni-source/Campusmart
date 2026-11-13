import { NextRequest, NextResponse } from 'next/server';
import { setOtpForPhone } from '@/lib/otpStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const cleanPhone = (phone || '').trim();
    const digits = cleanPhone.replace(/\D/g, '');

    if (!digits || digits.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    // Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpForPhone(digits, generatedOtp, 5 * 60 * 1000);

    const maskedPhone =
      digits.length >= 10
        ? `+91 ${digits.slice(0, 2)}******${digits.slice(-4)}`
        : `+91 ${digits}`;

    console.log(`\n========================================`);
    console.log(`📱 SMS OTP dispatched to ${maskedPhone}: [ ${generatedOtp} ]`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedPhone}`,
      expiresSeconds: 60,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
