// In-memory store for OTPs (keyed by phone digits or email)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function setOtpForPhone(digits: string, code: string, ttlMs = 5 * 60 * 1000) {
  otpStore.set(digits, {
    code,
    expiresAt: Date.now() + ttlMs,
  });
}

export function getOtpForPhone(digits: string): string | null {
  const item = otpStore.get(digits);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    otpStore.delete(digits);
    return null;
  }
  return item.code;
}

export function setOtpForEmail(email: string, code: string, ttlMs = 5 * 60 * 1000) {
  otpStore.set(email.toLowerCase().trim(), {
    code,
    expiresAt: Date.now() + ttlMs,
  });
}

export function getOtpForEmail(email: string): string | null {
  const item = otpStore.get(email.toLowerCase().trim());
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    otpStore.delete(email.toLowerCase().trim());
    return null;
  }
  return item.code;
}


