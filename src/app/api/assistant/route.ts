import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getUserFromRequest } from '@/lib/auth';
import { DataStore } from '@/lib/dataStore';
import {
  AssistantRequestSchema,
  checkAssistantRateLimit,
  generateShoppingAssistantReply,
  sanitizeUserMessage,
} from '@/lib/aiAssistant';
import { AssistantStreamEvent, ChatMessage } from '@/types';

export const dynamic = 'force-dynamic';

const GUEST_COOKIE_NAME = 'campusmart_chat_sid';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

function resolveSessionIdentity(req: NextRequest): {
  userId?: string;
  userName?: string;
  sessionKey: string;
  rateLimitKey: string;
  newGuestCookieSid?: string;
} {
  const user = getUserFromRequest(req);
  if (user) {
    return {
      userId: user.userId,
      userName: user.name,
      sessionKey: `user:${user.userId}`,
      rateLimitKey: `user:${user.userId}`,
    };
  }

  const existingSid = req.cookies.get(GUEST_COOKIE_NAME)?.value;
  if (existingSid && /^[a-zA-Z0-9_-]{8,80}$/.test(existingSid)) {
    return {
      sessionKey: `guest:${existingSid}`,
      rateLimitKey: `ip:${getClientIp(req)}`,
    };
  }

  const freshSid = crypto.randomBytes(16).toString('hex');
  return {
    sessionKey: `guest:${freshSid}`,
    rateLimitKey: `ip:${getClientIp(req)}`,
    newGuestCookieSid: freshSid,
  };
}

export async function GET(req: NextRequest) {
  try {
    const identity = resolveSessionIdentity(req);
    const session = await DataStore.getChatSession(identity.sessionKey, identity.userId);
    const res = NextResponse.json({
      success: true,
      sessionId: session?.id ?? identity.sessionKey,
      messages: session?.messages ?? [],
    });

    if (identity.newGuestCookieSid) {
      res.cookies.set(GUEST_COOKIE_NAME, identity.newGuestCookieSid, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load assistant chat history.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const identity = resolveSessionIdentity(req);
    await DataStore.clearChatSession(identity.sessionKey, identity.userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to clear chat session.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = resolveSessionIdentity(req);
    const rate = checkAssistantRateLimit(identity.rateLimitKey);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many requests. Please wait ${rate.resetInSeconds} seconds before messaging CampusMart AI again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.resetInSeconds) },
        }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const parsed = AssistantRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid assistant input.',
        },
        { status: 400 }
      );
    }

    const sanitizedMessage = sanitizeUserMessage(parsed.data.message);
    if (!sanitizedMessage) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    const existingSession = await DataStore.getChatSession(identity.sessionKey, identity.userId);
    const history = (existingSession?.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await generateShoppingAssistantReply({
      userMessage: sanitizedMessage,
      history,
      userId: identity.userId,
      userName: identity.userName,
      wishlistProductIds: parsed.data.wishlistProductIds,
      cartProductIds: parsed.data.cartProductIds,
    });

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content: sanitizedMessage,
      createdAt: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: `msg-a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      content: result.reply,
      products: result.products.length > 0 ? result.products : undefined,
      bundleTotal: result.bundleTotal,
      createdAt: new Date().toISOString(),
    };

    const savedSession = await DataStore.appendChatMessages({
      sessionKey: identity.sessionKey,
      userId: identity.userId,
      newMessages: [userMsg, assistantMsg],
      retentionLimit: 40,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sendEvent = (event: AssistantStreamEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          sendEvent({
            type: 'meta',
            sessionId: savedSession.id,
            provider: result.provider,
            fallbackUsed: result.fallbackUsed,
          });

          // Stream reply word-by-word cleanly for smooth UI rendering
          const chunks = result.reply.match(/\S+\s*/g) || [result.reply];
          for (const chunk of chunks) {
            sendEvent({ type: 'delta', text: chunk });
            if (chunks.length > 4) {
              await new Promise((resolve) => setTimeout(resolve, 12));
            }
          }

          if (result.products.length > 0) {
            sendEvent({
              type: 'products',
              products: result.products,
              bundleTotal: result.bundleTotal,
            });
          }

          sendEvent({ type: 'done', message: assistantMsg });
        } catch {
          sendEvent({
            type: 'error',
            error: 'Stream interrupted while preparing CampusMart recommendations.',
          });
        } finally {
          controller.close();
        }
      },
    });

    const responseHeaders = new Headers({
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    if (identity.newGuestCookieSid) {
      responseHeaders.append(
        'Set-Cookie',
        `${GUEST_COOKIE_NAME}=${identity.newGuestCookieSid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );
    }

    return new NextResponse(stream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to process assistant request right now.' },
      { status: 500 }
    );
  }
}

