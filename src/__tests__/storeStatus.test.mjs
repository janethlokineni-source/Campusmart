import test from 'node:test';
import assert from 'node:assert/strict';

// Import our logic (compiled or transpiled, or directly standard JS representation)
// To keep it standalone and testable via node test runner without complex bundling:
const WEEKDAY_INDEX_MAP = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

function getLocalTimeParts(date, timezone = 'Asia/Kolkata') {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const weekdayName = map['weekday'] || 'Monday';
  const dayNumber = WEEKDAY_INDEX_MAP[weekdayName] ?? 1;
  const year = parseInt(map['year'] || '2026', 10);
  const month = parseInt(map['month'] || '1', 10);
  const day = parseInt(map['day'] || '1', 10);
  let hour = parseInt(map['hour'] || '0', 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(map['minute'] || '0', 10);
  const second = parseInt(map['second'] || '0', 10);

  const pad = (n) => n.toString().padStart(2, '0');
  const dateString = `${year}-${pad(month)}-${pad(day)}`;
  const timeString = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  return { year, month, day, weekdayName, dayNumber, hour, minute, second, dateString, timeString };
}

function isOrderingOpen(
  now = new Date(),
  timezone = 'Asia/Kolkata',
  settings = null
) {
  const effectiveTimezone = (settings && settings.timezone) ? settings.timezone : (timezone || 'Asia/Kolkata');
  const activeSettings = settings || {
    openDays: [1, 2, 3, 4, 5],
    openTime: '00:00',
    closeTime: '23:59',
    timezone: effectiveTimezone,
    overrides: [],
    weekendNotice: 'Ordering is closed on Saturday and Sunday. Add items to your cart now and order on Monday!'
  };
  const parts = getLocalTimeParts(now, effectiveTimezone);
  
  const [openH, openM] = (activeSettings.openTime || '00:00').split(':').map(Number);
  const [closeH, closeM] = (activeSettings.closeTime || '23:59').split(':').map(Number);
  const currentTotalMins = parts.hour * 60 + parts.minute;
  const openTotalMins = openH * 60 + openM;
  const closeTotalMins = closeH * 60 + closeM;

  const dateOverride = (activeSettings.overrides || []).find(o => o.date === parts.dateString);
  if (dateOverride) {
    if (dateOverride.forceOpen) {
      const isWithinHours = currentTotalMins >= openTotalMins && currentTotalMins <= closeTotalMins;
      return {
        isOpen: isWithinHours,
        currentDay: parts.weekdayName,
        currentDayNumber: parts.dayNumber,
        isOverride: true
      };
    } else {
      return {
        isOpen: false,
        currentDay: parts.weekdayName,
        currentDayNumber: parts.dayNumber,
        isOverride: true
      };
    }
  }

  const isDayAllowed = activeSettings.openDays.includes(parts.dayNumber);
  if (!isDayAllowed) {
    return {
      isOpen: false,
      currentDay: parts.weekdayName,
      currentDayNumber: parts.dayNumber,
      isOverride: false
    };
  }

  const isWithinHours = currentTotalMins >= openTotalMins && currentTotalMins <= closeTotalMins;
  return {
    isOpen: isWithinHours,
    currentDay: parts.weekdayName,
    currentDayNumber: parts.dayNumber,
    isOverride: false
  };
}

test('Weekday Ordering Tests (Monday to Friday)', () => {
  // Monday: Oct 26, 2026, 14:00 IST
  const monday = new Date('2026-10-26T08:30:00Z'); // 14:00 IST
  const monRes = isOrderingOpen(monday, 'Asia/Kolkata');
  assert.equal(monRes.isOpen, true, 'Monday should be open');
  assert.equal(monRes.currentDay, 'Monday');

  // Tuesday: Oct 27, 2026
  const tuesday = new Date('2026-10-27T08:30:00Z');
  assert.equal(isOrderingOpen(tuesday, 'Asia/Kolkata').isOpen, true, 'Tuesday should be open');

  // Wednesday: Oct 28, 2026
  const wednesday = new Date('2026-10-28T08:30:00Z');
  assert.equal(isOrderingOpen(wednesday, 'Asia/Kolkata').isOpen, true, 'Wednesday should be open');

  // Thursday: Oct 29, 2026
  const thursday = new Date('2026-10-29T08:30:00Z');
  assert.equal(isOrderingOpen(thursday, 'Asia/Kolkata').isOpen, true, 'Thursday should be open');

  // Friday: Oct 30, 2026
  const friday = new Date('2026-10-30T08:30:00Z');
  assert.equal(isOrderingOpen(friday, 'Asia/Kolkata').isOpen, true, 'Friday should be open');
});

test('Weekend Closed Tests (Saturday and Sunday)', () => {
  // Saturday: Oct 31, 2026, 12:00 IST
  const saturday = new Date('2026-10-31T06:30:00Z');
  const satRes = isOrderingOpen(saturday, 'Asia/Kolkata');
  assert.equal(satRes.isOpen, false, 'Saturday must be closed');
  assert.equal(satRes.currentDay, 'Saturday');

  // Sunday: Nov 1, 2026, 16:00 IST
  const sunday = new Date('2026-11-01T10:30:00Z');
  const sunRes = isOrderingOpen(sunday, 'Asia/Kolkata');
  assert.equal(sunRes.isOpen, false, 'Sunday must be closed');
  assert.equal(sunRes.currentDay, 'Sunday');
});

test('Midnight Boundaries: Friday night to Saturday morning', () => {
  // Friday 23:59:00 IST = Friday 18:29:00 UTC
  const friNight = new Date('2026-10-30T18:29:00Z');
  const friRes = isOrderingOpen(friNight, 'Asia/Kolkata');
  assert.equal(friRes.isOpen, true, 'Friday 23:59 should be open');
  assert.equal(friRes.currentDay, 'Friday');

  // Saturday 00:01:00 IST = Friday 18:31:00 UTC
  const satMidnight = new Date('2026-10-30T18:31:00Z');
  const satRes = isOrderingOpen(satMidnight, 'Asia/Kolkata');
  assert.equal(satRes.isOpen, false, 'Saturday 00:01 should be closed');
  assert.equal(satRes.currentDay, 'Saturday');
});

test('Midnight Boundaries: Sunday night to Monday morning', () => {
  // Sunday 23:59:00 IST = Sunday 18:29:00 UTC
  const sunNight = new Date('2026-11-01T18:29:00Z');
  const sunRes = isOrderingOpen(sunNight, 'Asia/Kolkata');
  assert.equal(sunRes.isOpen, false, 'Sunday 23:59 should be closed');

  // Monday 00:01:00 IST = Sunday 18:31:00 UTC
  const monMidnight = new Date('2026-11-01T18:31:00Z');
  const monRes = isOrderingOpen(monMidnight, 'Asia/Kolkata');
  assert.equal(monRes.isOpen, true, 'Monday 00:01 should be open');
  assert.equal(monRes.currentDay, 'Monday');
});

test('Server Timezone Accuracy: UTC vs Asia/Kolkata vs America/New_York', () => {
  // At 2026-10-30 20:00:00 UTC:
  // In Asia/Kolkata (UTC+5:30) => Saturday Oct 31, 01:30 AM (CLOSED)
  // In America/New_York (UTC-4) => Friday Oct 30, 16:00 PM (OPEN)
  const probeDate = new Date('2026-10-30T20:00:00Z');
  
  const kolkataRes = isOrderingOpen(probeDate, 'Asia/Kolkata');
  assert.equal(kolkataRes.isOpen, false, 'Already Saturday in Kolkata -> closed');
  assert.equal(kolkataRes.currentDay, 'Saturday');

  const nyRes = isOrderingOpen(probeDate, 'America/New_York');
  assert.equal(nyRes.isOpen, true, 'Still Friday afternoon in NY -> open');
  assert.equal(nyRes.currentDay, 'Friday');
});

test('Opening & Closing Hours restrictions', () => {
  const customSettings = {
    openDays: [1, 2, 3, 4, 5],
    openTime: '09:00',
    closeTime: '21:00',
    timezone: 'Asia/Kolkata',
    overrides: []
  };

  // Wednesday at 08:30 IST (before opening)
  const wedEarly = new Date('2026-10-28T03:00:00Z'); // 08:30 IST
  assert.equal(isOrderingOpen(wedEarly, 'Asia/Kolkata', customSettings).isOpen, false, 'Before 9 AM should be closed');

  // Wednesday at 14:00 IST (during hours)
  const wedMid = new Date('2026-10-28T08:30:00Z'); // 14:00 IST
  assert.equal(isOrderingOpen(wedMid, 'Asia/Kolkata', customSettings).isOpen, true, '14:00 should be open');

  // Wednesday at 22:00 IST (after closing)
  const wedLate = new Date('2026-10-28T16:30:00Z'); // 22:00 IST
  assert.equal(isOrderingOpen(wedLate, 'Asia/Kolkata', customSettings).isOpen, false, 'After 21:00 should be closed');
});

test('Admin Date Overrides: Force Open on Weekend & Force Close on Weekday', () => {
  const festSettings = {
    openDays: [1, 2, 3, 4, 5],
    openTime: '00:00',
    closeTime: '23:59',
    timezone: 'Asia/Kolkata',
    overrides: [
      { date: '2026-10-31', forceOpen: true, reason: 'Annual Campus Cultural Fest' },
      { date: '2026-10-28', forceOpen: false, reason: 'Campus Maintenance Holiday' }
    ]
  };

  // Saturday Oct 31, 2026 normally closed, but has forceOpen = true
  const saturday = new Date('2026-10-31T06:30:00Z');
  const satRes = isOrderingOpen(saturday, 'Asia/Kolkata', festSettings);
  assert.equal(satRes.isOpen, true, 'Saturday with forceOpen should be open');
  assert.equal(satRes.isOverride, true);

  // Wednesday Oct 28, 2026 normally open, but has forceOpen = false
  const wednesday = new Date('2026-10-28T08:30:00Z');
  const wedRes = isOrderingOpen(wednesday, 'Asia/Kolkata', festSettings);
  assert.equal(wedRes.isOpen, false, 'Wednesday with forceClose should be closed');
  assert.equal(wedRes.isOverride, true);
});
