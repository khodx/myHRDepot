import { useQuery } from '@tanstack/react-query';
import { mhdCalendarService } from './Service';
import type { MhdCalendarFilters } from './Types';

export const mhdCalendarQueryKeys = {
  events: (start: string, end: string, filters: MhdCalendarFilters) =>
    ['mhd-calendar', 'events', start, end, filters] as const,
};

export function useMhdCalendarEvents(start: string, end: string, filters: MhdCalendarFilters) {
  return useQuery({
    queryKey: mhdCalendarQueryKeys.events(start, end, filters),
    queryFn: () => mhdCalendarService.listEvents(start, end, filters),
    enabled: start.length > 0 && end.length > 0,
  });
}
