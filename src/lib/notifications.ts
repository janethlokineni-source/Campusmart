import nodemailer from 'nodemailer';

export type ExternalChannelType = 'email' | 'push' | 'whatsapp';

export interface PriceDropNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  userId: string;
  productId: string;
  productName: string;
  productSlug: string;
  oldPrice: number;
  newPrice: number;
  dropPercent: number;
  targetPrice?: number;
}

export interface ChannelDispatchResult {
  channel: ExternalChannelType;
  sent: boolean;
  provider: string;
  detail?: string;
}

export interface NotificationChannelAdapter {
  readonly channel: ExternalChannelType;
  isConfigured(): boolean;
  send(payload: PriceDropNotificationPayload): Promise<ChannelDispatchResult>;
}

function buildProductUrl(slug: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    'http://localhost:3000';
  return `${baseUrl.replace(/\/$/, '')}/products/${slug}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPriceDropEmailHtml(payload: PriceDropNotificationPayload): string {
  const productUrl = buildProductUrl(payload.productSlug);
  const savedAmount = Math.max(0, payload.oldPrice - payload.newPrice);
  const safeName = escapeHtml(payload.recipientName);
  const safeProduct = escapeHtml(payload.productName);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0d0d0d; color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
      <div style="background: linear-gradient(135deg, #ff6a00, #ff2d16); padding: 24px 28px;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #fff3e6;">
          CampusMart Price Drop Alert
        </p>
        <h1 style="margin: 6px 0 0; font-size: 22px; color: #ffffff;">
          ${payload.dropPercent}% OFF on Your Watched Item
        </h1>
      </div>
      <div style="padding: 26px 28px;">
        <p style="font-size: 14px; color: #d4d4d4; margin-top: 0;">Hi ${safeName},</p>
        <p style="font-size: 14px; color: #d4d4d4; line-height: 1.6;">
          Great news! <strong>${safeProduct}</strong> just dropped in price on CampusMart:
        </p>
        <div style="background: #171717; border: 1px solid #2e2e2e; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
          <div style="font-size: 13px; color: #a3a3a3;">Previous baseline price: <span style="text-decoration: line-through;">&#8377;${payload.oldPrice.toLocaleString('en-IN')}</span></div>
          <div style="font-size: 26px; font-weight: bold; color: #ff8800; margin-top: 4px;">
            &#8377;${payload.newPrice.toLocaleString('en-IN')}
            <span style="font-size: 13px; color: #34d399; margin-left: 8px;">Save &#8377;${savedAmount.toLocaleString('en-IN')} (${payload.dropPercent}% OFF)</span>
          </div>
          ${
            payload.targetPrice !== undefined
              ? `<div style="font-size: 12px; color: #34d399; margin-top: 6px;">Met your target alert of &#8377;${payload.targetPrice.toLocaleString('en-IN')}</div>`
              : ''
          }
        </div>
        <a href="${productUrl}" style="display: inline-block; background: linear-gradient(90deg, #ff6a00, #ff2d16); color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 22px; border-radius: 10px;">
          View Deal on CampusMart
        </a>
        <p style="font-size: 11px; color: #737373; margin-top: 24px; line-height: 1.5;">
          CampusMart checkout is open Monday–Friday. On Saturday &amp; Sunday you can add items to your cart and place orders starting Monday.
        </p>
      </div>
    </div>
  `;
}

const EmailNotificationAdapter: NotificationChannelAdapter = {
  channel: 'email',

  isConfigured() {
    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
    const smtpUser = process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
    return Boolean(hasResend || (smtpUser && smtpPass));
  },

  async send(payload) {
    const subject = `Price Drop: ${payload.productName} is now ₹${payload.newPrice.toLocaleString('en-IN')} (${payload.dropPercent}% OFF)`;
    const html = buildPriceDropEmailHtml(payload);

    // 1. Prefer Resend if configured
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      const fromAddress =
        process.env.EMAIL_FROM?.trim() || 'CampusMart Alerts <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [payload.recipientEmail],
          subject,
          html,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const errBody = await res.text();
        return {
          channel: 'email',
          sent: false,
          provider: 'resend',
          detail: `Resend HTTP ${res.status}: ${errBody.slice(0, 120)}`,
        };
      }

      return { channel: 'email', sent: true, provider: 'resend' };
    }

    // 2. Fall back to Nodemailer SMTP configuration
    const smtpUser = process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM?.trim() || `"CampusMart Alerts" <${smtpUser}>`,
        to: payload.recipientEmail,
        subject,
        html,
      });

      return { channel: 'email', sent: true, provider: 'nodemailer' };
    }

    // 3. Dev preview log (never throws without SMTP)
    console.info(
      `[CampusMart Price Alert Email Preview] To: ${payload.recipientEmail} | ${subject}`
    );
    return {
      channel: 'email',
      sent: false,
      provider: 'dev-preview-log',
      detail: 'No RESEND_API_KEY or SMTP credentials configured; logged locally.',
    };
  },
};

/**
 * Extensible Web Push / FCM webhook adapter stub ready for future activation.
 */
const PushWebhookAdapter: NotificationChannelAdapter = {
  channel: 'push',
  isConfigured() {
    return Boolean(process.env.PUSH_WEBHOOK_URL?.trim());
  },
  async send(payload) {
    const url = process.env.PUSH_WEBHOOK_URL?.trim();
    if (!url) {
      return { channel: 'push', sent: false, provider: 'unconfigured' };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payload.userId,
        title: `Price Drop: ${payload.productName}`,
        body: `Now ₹${payload.newPrice} (${payload.dropPercent}% off)`,
        url: buildProductUrl(payload.productSlug),
      }),
      signal: AbortSignal.timeout(6_000),
    });
    return {
      channel: 'push',
      sent: res.ok,
      provider: 'push-webhook',
    };
  },
};

/**
 * Extensible WhatsApp Business webhook adapter stub ready for future activation.
 */
const WhatsAppWebhookAdapter: NotificationChannelAdapter = {
  channel: 'whatsapp',
  isConfigured() {
    return Boolean(process.env.WHATSAPP_WEBHOOK_URL?.trim());
  },
  async send(payload) {
    const url = process.env.WHATSAPP_WEBHOOK_URL?.trim();
    if (!url || !payload.recipientPhone) {
      return { channel: 'whatsapp', sent: false, provider: 'unconfigured' };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: payload.recipientPhone,
        message: `CampusMart Price Drop! ${payload.productName} is now ₹${payload.newPrice} (${payload.dropPercent}% OFF). ${buildProductUrl(payload.productSlug)}`,
      }),
      signal: AbortSignal.timeout(6_000),
    });
    return {
      channel: 'whatsapp',
      sent: res.ok,
      provider: 'whatsapp-webhook',
    };
  },
};

const EXTERNAL_CHANNEL_ADAPTERS: NotificationChannelAdapter[] = [
  EmailNotificationAdapter,
  PushWebhookAdapter,
  WhatsAppWebhookAdapter,
];

export async function dispatchExternalPriceDropChannels(
  payload: PriceDropNotificationPayload
): Promise<ChannelDispatchResult[]> {
  const results = await Promise.allSettled(
    EXTERNAL_CHANNEL_ADAPTERS.map(async (adapter) => {
      if (adapter.channel !== 'email' && !adapter.isConfigured()) {
        return {
          channel: adapter.channel,
          sent: false,
          provider: 'disabled',
        } satisfies ChannelDispatchResult;
      }
      return await adapter.send(payload);
    })
  );

  return results.map((r, idx) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      channel: EXTERNAL_CHANNEL_ADAPTERS[idx].channel,
      sent: false,
      provider: 'error',
      detail: r.reason instanceof Error ? r.reason.message : 'Channel error',
    };
  });
}

