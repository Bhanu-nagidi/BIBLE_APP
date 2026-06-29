/**
 * Utility to assist with formatting, parsing, and scheduling delays for daily notifications.
 */

/**
 * Calculates milliseconds until a specific time of day (HH:MM).
 * If the time has already passed today, schedules it for tomorrow.
 */
export function getMsUntilTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1); // schedule for tomorrow
  }

  return target.getTime() - now.getTime();
}

/**
 * Formats a 24-hour time string "HH:MM" to localized 12-hour AM/PM string.
 */
export function formatTo12Hour(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMinute = String(m).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Parses 24-hour time string into separate hour, minute, and period components.
 */
export function parseTimeTo12HourComponents(timeStr) {
  const [hStr, mStr] = (timeStr || '08:00').split(':');
  const h24 = parseInt(hStr, 10);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    hour: String(h12).padStart(2, '0'),
    minute: mStr,
    period
  };
}

/**
 * Converts 12-hour components back into 24-hour "HH:MM" string.
 */
export function convertTo24HourTime(hour12, minute, period) {
  let h24 = parseInt(hour12, 10);
  if (period === 'PM' && h24 !== 12) {
    h24 += 12;
  } else if (period === 'AM' && h24 === 12) {
    h24 = 0;
  }
  return `${String(h24).padStart(2, '0')}:${minute}`;
}
