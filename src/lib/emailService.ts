import nodemailer from 'nodemailer';

interface SendOtpEmailParams {
  email: string;
  otp: string;
  name?: string;
}

interface SendOtpEmailResult {
  success: boolean;
  message: string;
  isLiveSmtp: boolean;
  previewUrl?: string;
  otpDev?: string;
  error?: string;
}

export async function sendOtpEmail({
  email,
  otp,
  name,
}: SendOtpEmailParams): Promise<SendOtpEmailResult> {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = name || cleanEmail.split('@')[0];

  // Check for configured SMTP credentials in environment
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CampusMart Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, #131929 0%, #0d121f 100%); border-radius: 24px; border: 1px solid rgba(139, 92, 246, 0.3); padding: 36px 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
                <!-- Header / Logo -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="display: inline-block; padding: 10px 18px; border-radius: 9999px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(139, 92, 246, 0.4); color: #a78bfa; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                      ⚡ CampusMart • Security Verification
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Your Login OTP Code
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                      Hello <strong style="color: #e2e8f0;">${displayName}</strong>, use the single-use 6-digit code below to securely sign in to your CampusMart account.
                    </p>
                  </td>
                </tr>

                <!-- OTP Code Display Card -->
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <div style="background: rgba(15, 23, 42, 0.8); border: 2px dashed rgba(168, 85, 247, 0.6); border-radius: 18px; padding: 22px 30px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Details & Notice -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="background: rgba(30, 41, 59, 0.5); border-radius: 12px; padding: 14px 18px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                      ⏱️ <strong>Valid for 5 minutes</strong> • Never share this OTP code with anyone, including CampusMart staff.<br>
                      🔒 If you didn't request this verification code, please ignore this email.
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
                    <p style="margin: 0; font-size: 11px; color: #64748b;">
                      &copy; 2026 CampusMart University Marketplace • Flipkart & Amazon Catalog Delivery
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // Path 1: Live SMTP is configured (e.g. Gmail App Password in .env.local)
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"CampusMart Security" <${smtpUser}>`,
        to: cleanEmail,
        subject: `Your CampusMart Login Verification Code: ${otp}`,
        text: `Hello ${displayName},\n\nYour CampusMart 6-digit login verification OTP is: ${otp}\n\nThis code is valid for 5 minutes.\n\nCampusMart University Marketplace`,
        html: htmlContent,
      });

      console.log(`\n========================================`);
      console.log(`✅ Real Gmail SMTP OTP successfully delivered to ${cleanEmail}`);
      console.log(`========================================\n`);

      return {
        success: true,
        isLiveSmtp: true,
        message: `Verification OTP has been delivered to ${cleanEmail}. Please check your inbox (and spam/promotions folder).`,
      };
    } catch (smtpErr: any) {
      console.error('SMTP Delivery error:', smtpErr.message || smtpErr);
      // Fall through to Ethereal / Dev fallback if SMTP failed
    }
  }

  // Path 2: Ethereal test transport or Development Fallback
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: '"CampusMart Security" <no-reply@campusmart.edu>',
      to: cleanEmail,
      subject: `Your CampusMart Login Verification Code: ${otp}`,
      text: `Hello ${displayName},\n\nYour CampusMart 6-digit login verification OTP is: ${otp}\n\nThis code is valid for 5 minutes.`,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    console.log(`\n========================================`);
    console.log(`📨 Ethereal Test Mailer dispatched to ${cleanEmail}`);
    console.log(`🔑 OTP Code: [ ${otp} ]`);
    if (previewUrl) console.log(`🌐 Live Email Preview: ${previewUrl}`);
    console.log(`========================================\n`);

    return {
      success: true,
      isLiveSmtp: false,
      previewUrl,
      otpDev: otp,
      message: `Verification code generated for ${cleanEmail}`,
    };
  } catch (etherealErr) {
    // If external network is unreachable or blocked
    console.log(`\n========================================`);
    console.log(`🔑 Local Dev OTP generated for ${cleanEmail}: [ ${otp} ]`);
    console.log(`========================================\n`);

    return {
      success: true,
      isLiveSmtp: false,
      otpDev: otp,
      message: `Verification code generated for ${cleanEmail}`,
    };
  }
}

