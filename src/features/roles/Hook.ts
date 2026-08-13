import { useQuery } from '@tanstack/react-query';
import { mhdRoleService } from './Service';

export const mhdRoleQueryKeys = {
  list: (companyId: string | null) => ['mhd-roles', 'list', companyId ?? 'GLOBAL'] as const,
};

export function useMhdRoles(companyId: string | null = null) {
  return useQuery({
    queryKey: mhdRoleQueryKeys.list(companyId),
    queryFn: () => mhdRoleService.listRoles(companyId),
  });
}
