import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mhdNotificationService } from './Service';
import type { MhdNotificationState } from './Types';

const NOTIFICATIONS_KEY = ['mhd-notifications'] as const;
const UNREAD_COUNT_KEY = ['mhd-notifications-unread'] as const;

export function useMhdNotifications(): MhdNotificationState & {
  markRead: (ids: string[]) => void;
  markAllRead: () => void;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => mhdNotificationService.listNotifications(50),
    staleTime: 30_000,
    refetchInterval: 60_000, // poll every 60 s for new notifications
  });

  const unreadCountQuery = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => mhdNotificationService.getUnreadCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => mhdNotificationService.markRead(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => mhdNotificationService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    error:
      (notificationsQuery.error as Error | null)?.message ??
      (unreadCountQuery.error as Error | null)?.message ??
      null,
    markRead: (ids) => markReadMutation.mutate(ids),
    markAllRead: () => markAllReadMutation.mutate(),
    refetch: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  };
}
