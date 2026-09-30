/**
 * Time-of-day greeting driven by the signed-in user's own machine clock
 * (not a server timestamp) so it reflects whatever timezone the PC is set
 * to. Boundaries follow the common 5am–12pm / 12pm–6pm / 6pm–5am convention.
 */
export function mhdTimeOfDayGreeting(
  hour: number,
): 'Good Morning' | 'Good Afternoon' | 'Good Evening' {
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

/** "Thursday" in the browser's local timezone — the greeting date's first row. */
export function mhdFormatGreetingWeekday(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

/** "August 13, 2026" in the browser's local timezone — the greeting date's second row. */
export function mhdFormatGreetingMonthDay(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** "3:45:12 PM" — a live digital-clock readout in the browser's local timezone. */
export function mhdFormatDigitalClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface MhdTenureParts {
  years: number;
  months: number;
  weeks: number;
  days: number;
}

/**
 * Calendar-accurate breakdown of the time elapsed since `start` — years and
 * months follow actual calendar length (not a flat 30/365-day estimate),
 * and only the remainder is split into whole weeks + leftover days.
 *
 * Walks a cursor forward by whole years, then whole months, only advancing
 * while the next step doesn't overshoot `now` — relying on JS Date's own
 * month/day rollover rather than manual day-of-month subtraction, which
 * mishandles a start date late in a long month (e.g. Jan 31) once the
 * calendar crosses a shorter month (Feb).
 */
export function mhdComputeTenureParts(start: Date, now: Date): MhdTenureParts {
  if (now <= start) {
    return { years: 0, months: 0, weeks: 0, days: 0 };
  }

  let cursor = start;
  let years = 0;
  for (let next = mhdAddYears(cursor, 1); next <= now; next = mhdAddYears(cursor, 1)) {
    cursor = next;
    years += 1;
  }

  let months = 0;
  for (let next = mhdAddMonths(cursor, 1); next <= now; next = mhdAddMonths(cursor, 1)) {
    cursor = next;
    months += 1;
  }

  // Stepping by whole days (rather than dividing the millisecond gap by
  // 86_400_000) keeps this correct across a DST transition — a raw ms
  // division undercounts by a day whenever the span crosses a spring-forward
  // (a 23-hour local day) near a day boundary.
  let remainingDays = 0;
  for (let next = mhdAddDays(cursor, 1); next <= now; next = mhdAddDays(cursor, 1)) {
    cursor = next;
    remainingDays += 1;
  }

  return { years, months, weeks: Math.floor(remainingDays / 7), days: remainingDays % 7 };
}

// Each preserves time-of-day (not just the calendar date) so stepping by
// years/months/days never silently truncates cursor to midnight partway
// through, which would throw off the later day-stepping loop.
function mhdAddYears(date: Date, years: number): Date {
  return new Date(
    date.getFullYear() + years,
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function mhdAddMonths(date: Date, months: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function mhdAddDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

/** "2 Years, 1 Month, 3 Weeks, 2 Days" — always shows all four units, per spec. */
export function mhdFormatTenure(parts: MhdTenureParts): string {
  return [
    pluralize(parts.years, 'Year'),
    pluralize(parts.months, 'Month'),
    pluralize(parts.weeks, 'Week'),
    pluralize(parts.days, 'Day'),
  ].join(', ');
}
