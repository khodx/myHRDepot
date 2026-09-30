import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MhdAvatarCircle } from '@/components/ui/MhdAvatar';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdPersonCurrentEmploymentState, useMhdPersonPhotoUrl } from '@/features/people/Hook';
import { MhdDashboardQuoteOfTheDay } from './MhdDashboardQuoteOfTheDay';
import { mhdTimeOfDayGreeting, mhdFormatGreetingWeekday, mhdFormatGreetingMonthDay, mhdFormatDigitalClock, mhdComputeTenureParts, mhdFormatTenure } from './MhdDashboardGreetingBannerUtils';

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
export function MhdDashboardGreetingBanner({
  lastRefreshed,
  onRefresh,
}: MhdDashboardGreetingBannerProps) {
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
    <div className="mhd-greeting-banner flex items-stretch rounded-lg border border-rail-border bg-rail text-rail-text">
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

      <div className="flex flex-1 flex-wrap items-start justify-between gap-6 py-[13px] pl-[16px] pr-[15px]">
        <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1 self-stretch">
          <h1 className="text-[39.2px] font-bold leading-tight text-white">
            {greeting}
            {name ? `, ${name} 😊` : ''}!
          </h1>
          <MhdDashboardQuoteOfTheDay />
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
            <p className="text-[18.75px] text-rail-muted">
              <span className="font-semibold text-white">Tenure:</span> {tenureLabel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
