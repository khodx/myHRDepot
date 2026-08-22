import { useQuery } from '@tanstack/react-query';
import { mhdCommandCenterService } from './Service';
import type { MhdCommandCenterFilters } from './Types';

export function useMhdCommandCenterList(filters: MhdCommandCenterFilters) {
  return useQuery({
    queryKey: ['command-center', 'list', filters],
    queryFn: () => mhdCommandCenterService.list(filters),
  });
}
