/**
 * Date-only (no time-of-day) business-day arithmetic. Dates are plain
 * `YYYY-MM-DD` strings, matching the shape of Postgres `date` columns —
 * parsed/formatted via UTC components throughout so a caller's local
 * timezone never shifts the calendar day.
 */

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Adds `days` business days to `startIsoDate`, skipping Saturdays, Sundays,
 * and any date in `holidayIsoDates`. Returns a `YYYY-MM-DD` string.
 */
export function addBusinessDays(
  startIsoDate: string,
  days: number,
  holidayIsoDates: readonly string[] = [],
): string {
  const holidays = new Set(holidayIsoDates);
  const cursor = parseIsoDate(startIsoDate);
  let remaining = days;

  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWeekend(cursor) || holidays.has(formatIsoDate(cursor))) {
      continue;
    }
    remaining -= 1;
  }

  return formatIsoDate(cursor);
}
