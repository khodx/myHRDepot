import { Button } from '@/components/ui/Button';
import { useMhdDashboard } from '../Hook';
import { MhdDashboardGreetingBanner } from './MhdDashboardGreetingBanner';
import { MhdDashboardModuleLinks } from './MhdDashboardModuleLinks';

export function MhdDashboardPage() {
  const { isLoading, error, lastRefreshed, refetch } = useMhdDashboard();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="secondary" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdDashboardGreetingBanner lastRefreshed={lastRefreshed} onRefresh={refetch} />

      <MhdDashboardModuleLinks />
    </div>
  );
}
