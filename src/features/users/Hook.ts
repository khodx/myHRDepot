import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPlatformUserService } from './Service';
import type {
  MhdInvitePlatformUserInput,
  MhdPlatformUserMutationContext,
  MhdUpdatePlatformUserInput,
  MhdUsersListFilters,
} from './Types';

export const mhdPlatformUserQueryKeys = {
  all: ['mhd-users'] as const,
  list: (filters: MhdUsersListFilters) => [...mhdPlatformUserQueryKeys.all, 'list', filters] as const,
  detail: (userId: string) => [...mhdPlatformUserQueryKeys.all, 'detail', userId] as const,
};

export function useMhdPlatformUsers(filters: MhdUsersListFilters) {
  return useQuery({
    queryKey: mhdPlatformUserQueryKeys.list(filters),
    queryFn: () => mhdPlatformUserService.listUsers(filters),
  });
}

export function useMhdPlatformUser(userId: string) {
  return useQuery({
    queryKey: mhdPlatformUserQueryKeys.detail(userId),
    queryFn: () => mhdPlatformUserService.getUserById(userId),
    enabled: userId.length > 0,
  });
}

export function useMhdUpdatePlatformUser(
  userId: string,
  context: MhdPlatformUserMutationContext,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MhdUpdatePlatformUserInput) =>
      mhdPlatformUserService.updateUser(userId, input, context),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdPlatformUserQueryKeys.all });
    },
  });
}

export function useMhdDeletePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => mhdPlatformUserService.deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdPlatformUserQueryKeys.all });
    },
  });
}

export function useMhdDeactivatePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => mhdPlatformUserService.deactivateUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdPlatformUserQueryKeys.all });
    },
  });
}

export function useMhdReactivatePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => mhdPlatformUserService.reactivateUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdPlatformUserQueryKeys.all });
    },
  });
}

export function useMhdInvitePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MhdInvitePlatformUserInput) => mhdPlatformUserService.inviteUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mhdPlatformUserQueryKeys.all });
    },
  });
}
