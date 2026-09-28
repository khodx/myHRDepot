import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import { mhdCertificatesService } from './Service';
import type { MhdCertificateIssueInput } from './Types';

export const mhdCertificatesQueryKeys = {
  templates: () => ['mhd-certificates', 'templates'] as const,
  list: (companyId: string | null, status: string | null, personId: string | null) =>
    ['mhd-certificates', 'list', companyId ?? '', status ?? 'ALL', personId ?? 'ALL'] as const,
  mine: () => ['mhd-certificates', 'mine'] as const,
  people: (companyId: string | null) => ['mhd-certificates', 'people', companyId ?? ''] as const,
};

export function useMhdCertificateTemplates() {
  return useQuery({
    queryKey: mhdCertificatesQueryKeys.templates(),
    queryFn: () => mhdCertificatesService.listIssuableTemplates(),
  });
}

export function useMhdCertificatesForCompany(
  companyId: string | null,
  status: string | null = null,
  personId: string | null = null,
) {
  return useQuery({
    queryKey: mhdCertificatesQueryKeys.list(companyId, status, personId),
    queryFn: () => mhdCertificatesService.listForCompany(companyId!, status, personId),
    enabled: Boolean(companyId),
  });
}

export function useMhdMyCertificates() {
  return useQuery({
    queryKey: mhdCertificatesQueryKeys.mine(),
    queryFn: () => mhdCertificatesService.listMine(),
  });
}

/** Same list-people-for-a-wizard pattern as useMhdAccommodationPeople. */
export function useMhdCertificateEligiblePeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdCertificatesQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}

export function useMhdIssueCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCertificateIssueInput) => mhdCertificatesService.issue(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-certificates', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-certificates', 'mine'] });
    },
  });
}

export function useMhdRevokeCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ certificateId, reason }: { certificateId: string; reason: string }) =>
      mhdCertificatesService.revoke(certificateId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-certificates', 'list'] });
    },
  });
}
