import { RefreshCw } from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';

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

interface MhdDashboardGreetingBannerProps {
  lastRefreshed: Date | null;
  onRefresh: () => void;
}

/**
 * Replaces the plain "Dashboard" page title. Styled with the same rail
 * tokens as the left nav (bg-rail / text-rail-text / rail-border) so it
 * reads as one continuous branded surface, plus the elevated 3D card
 * treatment so it stands out as the page's lead panel.
 */
export function MhdDashboardGreetingBanner({ lastRefreshed, onRefresh }: MhdDashboardGreetingBannerProps) {
  const { profile } = useMhdAuth();
  const greeting = mhdTimeOfDayGreeting(new Date().getHours());
  // preferred_name wins over the legal first name when the person has set
  // one (see people.preferred_name); falls back to no name at all for a
  // user who hasn't completed their profile yet rather than showing "null".
  const name = profile?.preferredName || profile?.firstName || null;

  return (
    <div className="mhd-card-elevated flex flex-wrap items-center justify-between gap-4 rounded-lg border border-rail-border bg-rail px-6 py-5 text-rail-text">
      <h1 className="text-[28px] font-bold leading-tight text-white">
        {greeting}
        {name ? `, ${name}` : ''}!
      </h1>
      <button
        type="button"
        onClick={onRefresh}
        title="Refresh dashboard"
        className="flex items-center gap-1.5 text-xs text-rail-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        {lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString()}` : 'Refresh'}
      </button>
    </div>
  );
}
