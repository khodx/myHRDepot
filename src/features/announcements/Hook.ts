import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdAnnouncementsService } from './Service';
import type { MhdCreateAnnouncementInput, MhdUpdateAnnouncementInput } from './Types';

export const mhdAnnouncementQueryKeys = {
  list: (companyId: string | null, status: string | null) =>
    ['mhd-announcements', 'list', companyId ?? '', status ?? 'ALL'] as const,
  active: (companyId: string | null) => ['mhd-announcements', 'active', companyId ?? ''] as const,
  detail: (id: string | null) => ['mhd-announcements', 'detail', id ?? ''] as const,
};

function useInvalidateAnnouncements() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-announcements'] });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: mhdAnnouncementQueryKeys.detail(id) });
    }
  };
}

export function useMhdAnnouncements(companyId: string | null, status?: string | null) {
  return useQuery({
    queryKey: mhdAnnouncementQueryKeys.list(companyId, status ?? null),
    queryFn: () => mhdAnnouncementsService.listAnnouncements(companyId!, status),
    enabled: Boolean(companyId),
  });
}

export function useMhdActiveAnnouncements(companyId: string | null) {
  return useQuery({
    queryKey: mhdAnnouncementQueryKeys.active(companyId),
    queryFn: () => mhdAnnouncementsService.listActiveAnnouncements(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdAnnouncement(id: string | null) {
  return useQuery({
    queryKey: mhdAnnouncementQueryKeys.detail(id),
    queryFn: () => mhdAnnouncementsService.getAnnouncement(id!),
    enabled: Boolean(id),
  });
}

export function useMhdCreateAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: (input: MhdCreateAnnouncementInput) => mhdAnnouncementsService.createAnnouncement(input),
    onSuccess: () => invalidate(),
  });
}

export function useMhdUpdateAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: (input: MhdUpdateAnnouncementInput) => mhdAnnouncementsService.updateAnnouncement(input),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useMhdPublishAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: (id: string) => mhdAnnouncementsService.publishAnnouncement(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useMhdArchiveAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: (id: string) => mhdAnnouncementsService.archiveAnnouncement(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}
