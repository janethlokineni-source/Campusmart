import test from 'node:test';
import assert from 'node:assert/strict';

// =========================
// Feature 1 Helper Tests (Sanitization, Off-topic Guard, Budget Bundle, Rate Limit)
// =========================
function sanitizeUserMessage(raw) {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function selectBundleWithinBudget(candidates, budget, maxItems = 3) {
  const picked = [];
  let runningTotal = 0;
  const sorted = [...candidates].sort((a, b) => b.rating - a.rating || a.price - b.price);
  for (const item of sorted) {
    if (picked.length >= maxItems) break;
    if (item.stock > 0 && item.price <= budget && runningTotal + item.price <= budget) {
      picked.push(item);
      runningTotal += item.price;
    }
  }
  return { picked, bundleTotal: runningTotal };
}

test('AI Assistant sanitizer strips HTML/control chars and limits length to 500', () => {
  const dirty = '<script>alert(1)</script>  I have ₹500,\n\t need stationery!  ' + 'a'.repeat(600);
  const clean = sanitizeUserMessage(dirty);
  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.startsWith('alert(1) I have ₹500, need stationery!'), true);
  assert.equal(clean.length <= 500, true);
});

test('AI Assistant strict budget bundle keeps total <= ₹500 and excludes out-of-stock items', () => {
  const catalog = [
    { id: '1', name: 'Calculator', price: 1545, rating: 4.9, stock: 10 },
    { id: '2', name: 'Parker Pen', price: 399, rating: 4.8, stock: 15 },
    { id: '3', name: 'Out of stock pen', price: 50, rating: 5.0, stock: 0 },
    { id: '4', name: 'Maggi Pack', price: 56, rating: 4.7, stock: 25 },
  ];
  const { picked, bundleTotal } = selectBundleWithinBudget(catalog, 500, 3);
  assert.deepEqual(
    picked.map((p) => p.id),
    ['2', '4']
  );
  assert.equal(bundleTotal, 455);
  assert.equal(bundleTotal <= 500, true);
  assert.equal(
    picked.every((p) => p.stock > 0 && p.price <= 500),
    true
  );
});

// =========================
// Feature 2 Helper Tests (Price Alert Triggering & Anti-Spam Guard)
// =========================
function shouldTriggerPriceDropNotification(alert, newPrice) {
  if (!alert.active) return false;
  const thresholdMet =
    alert.targetPrice !== undefined
      ? newPrice <= alert.targetPrice
      : newPrice < alert.priceWhenAdded;
  if (!thresholdMet) return false;
  if (alert.lastNotifiedPrice !== undefined && newPrice >= alert.lastNotifiedPrice) {
    return false;
  }
  return true;
}

test('Price Alert triggers only when target or baseline drop is met and blocks duplicate spam', () => {
  const alertWithoutTarget = {
    active: true,
    priceWhenAdded: 1000,
    targetPrice: undefined,
    lastNotifiedPrice: undefined,
  };

  // Price goes up or stays flat -> no notification
  assert.equal(shouldTriggerPriceDropNotification(alertWithoutTarget, 1000), false);
  assert.equal(shouldTriggerPriceDropNotification(alertWithoutTarget, 1099), false);

  // Price drops below baseline -> notify!
  assert.equal(shouldTriggerPriceDropNotification(alertWithoutTarget, 900), true);
  alertWithoutTarget.lastNotifiedPrice = 900;

  // Repeat check at same price or slightly higher -> blocked (anti-spam)
  assert.equal(shouldTriggerPriceDropNotification(alertWithoutTarget, 900), false);
  assert.equal(shouldTriggerPriceDropNotification(alertWithoutTarget, 950), false);

  // Further drop below lastNotifiedPrice -> notify again!
  assert.equal(shouldTriggerPriceDropNotification(alertWithoutTarget, 820), true);
});

test('Price Alert with explicit targetPrice waits until price <= targetPrice', () => {
  const alertWithTarget = {
    active: true,
    priceWhenAdded: 1000,
    targetPrice: 800,
    lastNotifiedPrice: undefined,
  };

  // Partial drop to 850 does not yet hit 800 target
  assert.equal(shouldTriggerPriceDropNotification(alertWithTarget, 850), false);
  // Reaching exact target 800 triggers
  assert.equal(shouldTriggerPriceDropNotification(alertWithTarget, 800), true);
  alertWithTarget.lastNotifiedPrice = 800;
  // Duplicate check at 800 blocked
  assert.equal(shouldTriggerPriceDropNotification(alertWithTarget, 800), false);
  // Lower drop to 740 notifies again
  assert.equal(shouldTriggerPriceDropNotification(alertWithTarget, 740), true);
});

const SHOPPING_KEYWORD_REGEXES = [
  'buy',
  'price',
  'budget',
  'under',
  'cod',
  'book',
  'stationery',
  '₹',
].map((kw) => (kw === '₹' ? /₹/ : new RegExp(`\\b${kw}\\b`, 'i')));

const OFF_TOPIC_PATTERNS = [
  /\b(write code|write a .*script|python script|javascript function|leetcode|solve this equation|debug my code|homework essay|essay on)\b/i,
  /\b(president|prime minister|election|politics|stock market tips|crypto trading|bitcoin prediction)\b/i,
];

const STRICT_COMMERCE_INTENT_REGEX = /\b(buy|price|budget|under|below|shop|store|cart|checkout|order|product|products|catalog|campusmart)\b/i;

function isOffTopicMessage(message) {
  const lower = message.toLowerCase();
  if (OFF_TOPIC_PATTERNS.some((re) => re.test(message)) && !STRICT_COMMERCE_INTENT_REGEX.test(lower)) {
    return true;
  }
  const hasShoppingSignal = SHOPPING_KEYWORD_REGEXES.some((re) => re.test(lower));
  if (hasShoppingSignal) return false;
  if (OFF_TOPIC_PATTERNS.some((re) => re.test(message))) return true;
  if (lower.split(/\s+/).length >= 8 && !/\b(shop|store|item|need|want|looking|suggest|gift|buy)\b/i.test(lower)) {
    return true;
  }
  return false;
}

test('AI Assistant off-topic guard uses word boundaries so "coding" does not match "cod" while "coding book under ₹500" stays allowed', () => {
  assert.equal(isOffTopicMessage('Write a python script for my coding homework essay on politics'), true);
  assert.equal(isOffTopicMessage('I need a coding book under ₹500'), false);
});


