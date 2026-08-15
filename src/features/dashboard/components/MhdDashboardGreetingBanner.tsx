import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MhdAvatarCircle } from '@/components/ui/MhdAvatar';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdPersonCurrentEmploymentState, useMhdPersonPhotoUrl } from '@/features/people/Hook';

/**
 * Time-of-day greeting driven by the signed-in user's own machine clock
 * (not a server timestamp) so it reflects whatever timezone the PC is set
 * to. Boundaries follow the common 5am–12pm / 12pm–6pm / 6pm–5am convention.
 */
export function mhdTimeOfDayGreeting(hour: number): 'Good Morning' | 'Good Afternoon' | 'Good Evening' {
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

interface MhdDashboardGreetingBannerProps {
  lastRefreshed: Date | null;
  onRefresh: () => void;
}

/**
 * Replaces the plain "Dashboard" page title. Styled with the same rail
 * tokens as the left nav (bg-rail / text-rail-text / rail-border) so it
 * reads as one continuous branded surface, plus a subtle raised bevel (see
 * .mhd-greeting-banner) so it reads as the page's lead panel.
 */
export function MhdDashboardGreetingBanner({ lastRefreshed, onRefresh }: MhdDashboardGreetingBannerProps) {
  const { profile } = useMhdAuth();
  const employmentStateQuery = useMhdPersonCurrentEmploymentState(profile?.personId ?? null);
  const photoUrlQuery = useMhdPersonPhotoUrl(profile?.photoPath);

  // Ticks every second so the digital clock stays live; the date and tenure
  // readouts derive from the same clock rather than each keeping their own.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = mhdTimeOfDayGreeting(now.getHours());
  // preferred_name wins over the legal first name when the person has set
  // one (see people.preferred_name); falls back to no name at all for a
  // user who hasn't completed their profile yet rather than showing "null".
  const name = profile?.preferredName || profile?.firstName || null;

  // Tenure only reads as accurate while the person's open state is ACTIVE —
  // an open ON_LEAVE/SUSPENDED row's effective_from is a status-change date,
  // not a hire date, so showing tenure against it would understate service.
  const employmentState = employmentStateQuery.data;
  const tenureLabel =
    employmentState?.state === 'ACTIVE'
      ? mhdFormatTenure(mhdComputeTenureParts(new Date(employmentState.effectiveFrom), now))
      : null;

  const avatarName = profile?.displayName ?? name ?? 'User';
  const photoUrl = photoUrlQuery.data ?? null;

  return (
    <div className="mhd-greeting-banner flex items-stretch rounded-lg border border-rail-border bg-[#5C5C5C] text-rail-text">
      {/* A large circular photo floats on the banner's navy fill with a
          thick white ring and a deep drop shadow, so it reads as raised off
          the surface rather than flush with it. With no photo, the small
          circular initials avatar is the fallback instead. */}
      {photoUrl ? (
        <div className="flex items-center px-[15px] py-[10.90px]">
          <img
            src={photoUrl}
            alt={avatarName}
            className="aspect-square h-[138.08px] shrink-0 rounded-full border-4 border-white object-cover shadow-2xl"
          />
        </div>
      ) : (
        <div className="flex items-center pl-[33.6px]">
          <MhdAvatarCircle name={avatarName} size="lg" className="bg-white/10 text-white" />
        </div>
      )}

      <div className="flex flex-1 flex-wrap items-start justify-between gap-6 py-[25.44px] pl-[16px] pr-[33.6px]">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[28px] font-bold leading-tight text-white">
            {greeting}
            {name ? `, ${name} 😊` : ''}!
          </h1>
        </div>

        <div className="flex flex-col items-end gap-[4.36px] text-right">
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh dashboard"
            className="flex items-center gap-1.5 text-xs text-rail-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString()}` : 'Refresh'}
          </button>

          <p
            className="rounded-md bg-black/25 px-3 py-[2.91px] font-mono text-[21.15px] font-bold tabular-nums text-white"
            aria-label="Current time"
          >
            {mhdFormatDigitalClock(now)}
          </p>

          <p className="text-[18.75px] font-medium text-white">{mhdFormatGreetingWeekday(now)}</p>
          <p className="text-[18.75px] font-medium text-white">{mhdFormatGreetingMonthDay(now)}</p>

          {tenureLabel ? (
            <p className="text-[9.45px] text-rail-muted">
              <span className="font-semibold text-white">Tenure:</span> {tenureLabel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
