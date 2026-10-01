import { useQuery } from '@tanstack/react-query';
import { mhdModuleAlertsService } from './Service';
import type { MhdModuleAlertCounts } from './Types';

const NO_ALERTS: MhdModuleAlertCounts = {};

/**
 * The signed-in user's per-module attention counts, keyed by route. One shared
 * query: the dashboard and every category landing page read the same cached
 * result, so a badge can never disagree between two pages.
 */
export function useMhdModuleAlerts(): { counts: MhdModuleAlertCounts; isLoading: boolean } {
  const query = useQuery({
    queryKey: ['mhd-module-alerts'],
    queryFn: () => mhdModuleAlertsService.getCounts(),
    staleTime: 60_000,
  });

  return { counts: query.data ?? NO_ALERTS, isLoading: query.isLoading };
}
