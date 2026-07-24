import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdDashboardService } from './Service';
import type { MhdDashboardState } from './Types';

export function useMhdDashboard(): MhdDashboardState & { refetch: () => void } {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['mhd-dashboard-summary'],
    queryFn: () => mhdDashboardService.getTaskSummary(),
    staleTime: 60_000,
  });

  const myTasksQuery = useQuery({
    queryKey: ['mhd-dashboard-my-tasks'],
    queryFn: () => mhdDashboardService.getMyTasks(),
    staleTime: 60_000,
  });

  const activityQuery = useQuery({
    queryKey: ['mhd-dashboard-activity'],
    queryFn: () => mhdDashboardService.getRecentActivity(20),
    staleTime: 60_000,
  });

  const isLoading = summaryQuery.isLoading || myTasksQuery.isLoading || activityQuery.isLoading;

  const error =
    (summaryQuery.error as Error)?.message ??
    (myTasksQuery.error as Error)?.message ??
    (activityQuery.error as Error)?.message ??
    null;

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ['mhd-dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['mhd-dashboard-my-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['mhd-dashboard-activity'] });
  }

  return {
    isLoading,
    error,
    taskSummary: summaryQuery.data ?? null,
    myTasks: myTasksQuery.data ?? [],
    recentActivity: activityQuery.data ?? [],
    lastRefreshed: summaryQuery.dataUpdatedAt ? new Date(summaryQuery.dataUpdatedAt) : null,
    refetch,
  };
}
