import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdCalendarService } from './Service';
import type { MhdCalendarEventInput, MhdCalendarFilters } from './Types';

export const mhdCalendarQueryKeys = {
  events: (start: string, end: string, filters: MhdCalendarFilters) =>
    ['mhd-calendar', 'events', start, end, filters] as const,
  event: (id: string) => ['mhd-calendar', 'event', id] as const,
};

export function useMhdCalendarEvents(start: string, end: string, filters: MhdCalendarFilters) {
  return useQuery({
    queryKey: mhdCalendarQueryKeys.events(start, end, filters),
    queryFn: () => mhdCalendarService.listEvents(start, end, filters),
    enabled: start.length > 0 && end.length > 0,
  });
}

export function useMhdCalendarEvent(id: string | null) {
  return useQuery({
    queryKey: mhdCalendarQueryKeys.event(id ?? ''),
    queryFn: () => mhdCalendarService.getEvent(id as string),
    enabled: id !== null,
  });
}

function useInvalidateCalendarEvents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['mhd-calendar'] });
}

export function useMhdCreateCalendarEvent() {
  const invalidate = useInvalidateCalendarEvents();
  return useMutation({
    mutationFn: (input: MhdCalendarEventInput) => mhdCalendarService.createEvent(input),
    onSuccess: invalidate,
  });
}

export function useMhdUpdateCalendarEvent() {
  const invalidate = useInvalidateCalendarEvents();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MhdCalendarEventInput }) =>
      mhdCalendarService.updateEvent(id, input),
    onSuccess: invalidate,
  });
}

export function useMhdDeleteCalendarEvent() {
  const invalidate = useInvalidateCalendarEvents();
  return useMutation({
    mutationFn: (id: string) => mhdCalendarService.deleteEvent(id),
    onSuccess: invalidate,
  });
}
