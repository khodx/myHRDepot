import { useQuery } from '@tanstack/react-query';
import { mhdGetComplianceReleaseBlockers, mhdListImpersonationSessions } from './Service';

export const mhdAdminQueryKeys = {
  complianceBlockers: ['mhd-admin', 'compliance-blockers'] as const,
  impersonationSessions: (limit: number) =>
    ['mhd-admin', 'impersonation-sessions', limit] as const,
};

export function useMhdComplianceReleaseBlockers() {
  return useQuery({
    queryKey: mhdAdminQueryKeys.complianceBlockers,
    queryFn: mhdGetComplianceReleaseBlockers,
  });
}

export function useMhdImpersonationSessions(limit = 50) {
  return useQuery({
    queryKey: mhdAdminQueryKeys.impersonationSessions(limit),
    queryFn: () => mhdListImpersonationSessions(limit),
  });
}
