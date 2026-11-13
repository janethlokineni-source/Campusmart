import { StoreSettings, StoreStatus } from '@/types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  openDays: [1, 2, 3, 4, 5], // Monday (1) to Friday (5)
  openTime: "00:00",
  closeTime: "23:59",
  timezone: "Asia/Kolkata",
  overrides: [
    // e.g. { date: '2026-11-15', forceOpen: false, reason: 'Diwali Campus Holiday' }
  ],
  weekendNotice: "Ordering is closed on Saturday and Sunday. Add items to your cart now and order on Monday!",
  updatedAt: new Date().toISOString()
};

export interface LocalTimeParts {
  year: number;
  month: number;
  day: number;
  weekdayName: string;
  dayNumber: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number;
  minute: number;
  second: number;
  dateString: string; // YYYY-MM-DD
  timeString: string; // HH:MM:SS
}

const WEEKDAY_INDEX_MAP: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

/**
 * Extracts local date/time parts for a given Date in a specific IANA timezone
 */
export function getLocalTimeParts(date: Date, timezone: string = 'Asia/Kolkata'): LocalTimeParts {
  try {
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
    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = p.value;
      }
    }

    const weekdayName = map['weekday'] || 'Monday';
    const dayNumber = WEEKDAY_INDEX_MAP[weekdayName] ?? 1;
    const year = parseInt(map['year'] || '2026', 10);
    const month = parseInt(map['month'] || '1', 10);
    const day = parseInt(map['day'] || '1', 10);
    let hour = parseInt(map['hour'] || '0', 10);
    if (hour === 24) hour = 0; // standard formatting safeguard
    const minute = parseInt(map['minute'] || '0', 10);
    const second = parseInt(map['second'] || '0', 10);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateString = `${year}-${pad(month)}-${pad(day)}`;
    const timeString = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

    return {
      year,
      month,
      day,
      weekdayName,
      dayNumber,
      hour,
      minute,
      second,
      dateString,
      timeString
    };
  } catch (err) {
    // Fallback if timezone string is invalid
    const dayNumber = date.getUTCDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      weekdayName: days[dayNumber],
      dayNumber,
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      dateString: date.toISOString().split('T')[0],
      timeString: date.toISOString().split('T')[1].substring(0, 8)
    };
  }
}

/**
 * Calculates the next upcoming open date and time
 */
export function calculateNextOpenAt(
  now: Date,
  timezone: string,
  settings: StoreSettings,
  currentParts: LocalTimeParts
): string {
  const [openH, openM] = (settings.openTime || "00:00").split(':').map(Number);
  
  // Search up to 14 days ahead for next open slot
  for (let i = 0; i <= 14; i++) {
    // check day i
    const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const parts = getLocalTimeParts(checkDate, timezone);
    
    // Check override for this date
    const override = (settings.overrides || []).find(o => o.date === parts.dateString);
    if (override) {
      if (override.forceOpen) {
        if (i === 0) {
          // If today, check if open time is in future
          if (parts.hour < openH || (parts.hour === openH && parts.minute < openM)) {
            return `${parts.dateString}T${settings.openTime}:00`;
          }
        } else {
          return `${parts.dateString}T${settings.openTime}:00`;
        }
      }
      // If override is forceClosed, skip this day
      continue;
    }

    // Normal day check
    if (settings.openDays.includes(parts.dayNumber)) {
      if (i === 0) {
        // Today is an open day, check if it hasn't opened yet
        if (parts.hour < openH || (parts.hour === openH && parts.minute < openM)) {
          return `${parts.dateString}T${settings.openTime}:00`;
        }
      } else {
        return `${parts.dateString}T${settings.openTime}:00`;
      }
    }
  }

  // Fallback default
  return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Main evaluation function: is ordering currently open?
 */
export function isOrderingOpen(
  now: Date = new Date(),
  timezone: string = DEFAULT_STORE_SETTINGS.timezone,
  settings: StoreSettings = DEFAULT_STORE_SETTINGS
): StoreStatus {
  // If settings has a custom timezone, use it; otherwise use the passed timezone argument or default
  const effectiveTimezone = (settings && settings.timezone && settings !== DEFAULT_STORE_SETTINGS) 
    ? settings.timezone 
    : (timezone || settings?.timezone || "Asia/Kolkata");
  const parts = getLocalTimeParts(now, effectiveTimezone);
  
  const [openH, openM] = (settings.openTime || "00:00").split(':').map(Number);
  const [closeH, closeM] = (settings.closeTime || "23:59").split(':').map(Number);
  const currentTotalMins = parts.hour * 60 + parts.minute;
  const openTotalMins = openH * 60 + openM;
  const closeTotalMins = closeH * 60 + closeM;

  // 1. Check Date Overrides first
  const dateOverride = (settings.overrides || []).find(o => o.date === parts.dateString);
  if (dateOverride) {
    if (dateOverride.forceOpen) {
      const isWithinHours = currentTotalMins >= openTotalMins && currentTotalMins <= closeTotalMins;
      return {
        isOpen: isWithinHours,
        currentDay: parts.weekdayName,
        currentDayNumber: parts.dayNumber,
        currentTimeString: parts.timeString,
        nextOpenAt: isWithinHours ? "" : calculateNextOpenAt(now, effectiveTimezone, settings, parts),
        message: isWithinHours 
          ? `Store is open! Special schedule: ${dateOverride.reason}`
          : `Ordering opens at ${settings.openTime} (${dateOverride.reason})`,
        timezone: effectiveTimezone,
        openingHours: `${settings.openTime} - ${settings.closeTime}`,
        isOverride: true
      };
    } else {
      // Force closed
      const nextOpen = calculateNextOpenAt(now, effectiveTimezone, settings, parts);
      return {
        isOpen: false,
        currentDay: parts.weekdayName,
        currentDayNumber: parts.dayNumber,
        currentTimeString: parts.timeString,
        nextOpenAt: nextOpen,
        message: `Store is closed today: ${dateOverride.reason}. Orders resume soon!`,
        timezone: effectiveTimezone,
        openingHours: `${settings.openTime} - ${settings.closeTime}`,
        isOverride: true
      };
    }
  }

  // 2. Check Open Days (Default: Mon-Fri = [1, 2, 3, 4, 5])
  const isDayAllowed = settings.openDays.includes(parts.dayNumber);

  if (!isDayAllowed) {
    const isWeekend = parts.dayNumber === 0 || parts.dayNumber === 6;
    const nextOpen = calculateNextOpenAt(now, effectiveTimezone, settings, parts);
    return {
      isOpen: false,
      currentDay: parts.weekdayName,
      currentDayNumber: parts.dayNumber,
      currentTimeString: parts.timeString,
      nextOpenAt: nextOpen,
      message: isWeekend 
        ? (settings.weekendNotice || "Ordering is closed on Saturday and Sunday. Add items to your cart now and order on Monday!")
        : `Store is closed on ${parts.weekdayName}s. Add items to cart for our next delivery window!`,
      timezone: effectiveTimezone,
      openingHours: `${settings.openTime} - ${settings.closeTime}`,
      isOverride: false
    };
  }

  // 3. Check Operating Hours
  const isWithinHours = currentTotalMins >= openTotalMins && currentTotalMins <= closeTotalMins;

  if (!isWithinHours) {
    const nextOpen = calculateNextOpenAt(now, effectiveTimezone, settings, parts);
    const msg = currentTotalMins < openTotalMins
      ? `Store opens today at ${settings.openTime}. Browse and build your cart now!`
      : `Store closed for today at ${settings.closeTime}. Orders resume next scheduled day!`;

    return {
      isOpen: false,
      currentDay: parts.weekdayName,
      currentDayNumber: parts.dayNumber,
      currentTimeString: parts.timeString,
      nextOpenAt: nextOpen,
      message: msg,
      timezone: effectiveTimezone,
      openingHours: `${settings.openTime} - ${settings.closeTime}`,
      isOverride: false
    };
  }

  // Store is open!
  return {
    isOpen: true,
    currentDay: parts.weekdayName,
    currentDayNumber: parts.dayNumber,
    currentTimeString: parts.timeString,
    nextOpenAt: "",
    message: "Store is open for campus orders! Fast hostel & campus delivery active.",
    timezone: effectiveTimezone,
    openingHours: `${settings.openTime} - ${settings.closeTime}`,
    isOverride: false
  };
}
