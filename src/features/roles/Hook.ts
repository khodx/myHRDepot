import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdRoleService } from './Service';

export const mhdRoleQueryKeys = {
  list: (companyId: string | null) => ['mhd-roles', 'list', companyId ?? 'GLOBAL'] as const,
  userAssignments: (userId: string) => ['mhd-roles', 'user-assignments', userId] as const,
};

export function useMhdRoles(companyId: string | null = null) {
  return useQuery({
    queryKey: mhdRoleQueryKeys.list(companyId),
    queryFn: () => mhdRoleService.listRoles(companyId),
  });
}

export function useMhdUserRoleAssignments(userId: string) {
  return useQuery({
    queryKey: mhdRoleQueryKeys.userAssignments(userId),
    queryFn: () => mhdRoleService.listUserRoleAssignments(userId),
    enabled: userId.length > 0,
  });
}

export function useMhdAssignUserRole(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => mhdRoleService.assignUserRole(userId, roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdRoleQueryKeys.userAssignments(userId) });
    },
  });
}

export function useMhdRevokeUserRole(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => mhdRoleService.revokeUserRole(userId, roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdRoleQueryKeys.userAssignments(userId) });
    },
  });
}
