import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdSafetyService } from './Service';
import type {
  MhdCertifyOshaAnnualSummaryInput,
  MhdCreateOshaEstablishmentInput,
  MhdCreateSafetyIncidentInput,
  MhdUpdateOshaEstablishmentInput,
  MhdUpdateSafetyIncidentInput,
} from './Types';

export const mhdSafetyQueryKeys = {
  establishments: (companyId: string | null) =>
    ['mhd-safety', 'establishments', companyId ?? ''] as const,
  incidents: (companyId: string | null, establishmentId: string | null, calendarYear: number | null) =>
    ['mhd-safety', 'incidents', companyId ?? '', establishmentId ?? 'ALL', calendarYear ?? 'ALL'] as const,
  incident: (incidentId: string | null) => ['mhd-safety', 'incident', incidentId ?? ''] as const,
  thresholds: (establishmentId: string | null) =>
    ['mhd-safety', 'thresholds', establishmentId ?? ''] as const,
  annualSummary: (summaryId: string | null) => ['mhd-safety', 'annual-summary', summaryId ?? ''] as const,
  annualSummaries: (establishmentId: string | null) =>
    ['mhd-safety', 'annual-summaries', establishmentId ?? ''] as const,
};

function useInvalidateSafety() {
  const queryClient = useQueryClient();
  return (opts?: { companyId?: string; establishmentId?: string; incidentId?: string; summaryId?: string }) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-safety'] });
    if (opts?.incidentId) {
      void queryClient.invalidateQueries({ queryKey: mhdSafetyQueryKeys.incident(opts.incidentId) });
    }
    if (opts?.summaryId) {
      void queryClient.invalidateQueries({ queryKey: mhdSafetyQueryKeys.annualSummary(opts.summaryId) });
    }
  };
}

export function useMhdOshaEstablishments(companyId: string | null) {
  return useQuery({
    queryKey: mhdSafetyQueryKeys.establishments(companyId),
    queryFn: () => mhdSafetyService.listEstablishments(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMhdSafetyIncidents(
  companyId: string | null,
  establishmentId?: string | null,
  calendarYear?: number | null,
) {
  return useQuery({
    queryKey: mhdSafetyQueryKeys.incidents(companyId, establishmentId ?? null, calendarYear ?? null),
    queryFn: () => mhdSafetyService.listIncidents(companyId!, establishmentId, calendarYear),
    enabled: Boolean(companyId),
  });
}

export function useMhdSafetyIncident(incidentId: string | null) {
  return useQuery({
    queryKey: mhdSafetyQueryKeys.incident(incidentId),
    queryFn: () => mhdSafetyService.getIncident(incidentId!),
    enabled: Boolean(incidentId),
  });
}

export function useMhdOshaThresholds(establishmentId: string | null) {
  return useQuery({
    queryKey: mhdSafetyQueryKeys.thresholds(establishmentId),
    queryFn: () => mhdSafetyService.computeThresholds(establishmentId!),
    enabled: Boolean(establishmentId),
  });
}

export function useMhdOshaAnnualSummary(summaryId: string | null) {
  return useQuery({
    queryKey: mhdSafetyQueryKeys.annualSummary(summaryId),
    queryFn: () => mhdSafetyService.getAnnualSummary(summaryId!),
    enabled: Boolean(summaryId),
  });
}

export function useMhdOshaAnnualSummaries(establishmentId: string | null) {
  return useQuery({
    queryKey: mhdSafetyQueryKeys.annualSummaries(establishmentId),
    queryFn: () => mhdSafetyService.listAnnualSummaries(establishmentId!),
    enabled: Boolean(establishmentId),
  });
}

export function useMhdCreateOshaEstablishment() {
  const invalidate = useInvalidateSafety();
  return useMutation({
    mutationFn: (input: MhdCreateOshaEstablishmentInput) => mhdSafetyService.createEstablishment(input),
    onSuccess: (_, variables) => invalidate({ companyId: variables.companyId }),
  });
}

export function useMhdUpdateOshaEstablishment() {
  const invalidate = useInvalidateSafety();
  return useMutation({
    mutationFn: (input: MhdUpdateOshaEstablishmentInput) => mhdSafetyService.updateEstablishment(input),
    onSuccess: () => invalidate(),
  });
}

export function useMhdCreateSafetyIncident() {
  const invalidate = useInvalidateSafety();
  return useMutation({
    mutationFn: (input: MhdCreateSafetyIncidentInput) => mhdSafetyService.createIncident(input),
    onSuccess: (_, variables) =>
      invalidate({ companyId: variables.companyId, establishmentId: variables.establishmentId }),
  });
}

export function useMhdUpdateSafetyIncident() {
  const invalidate = useInvalidateSafety();
  return useMutation({
    mutationFn: (input: MhdUpdateSafetyIncidentInput) => mhdSafetyService.updateIncident(input),
    onSuccess: (_, variables) => invalidate({ incidentId: variables.incidentId }),
  });
}

export function useMhdGenerateOshaAnnualSummary() {
  const invalidate = useInvalidateSafety();
  return useMutation({
    mutationFn: (input: { establishmentId: string; calendarYear: number }) =>
      mhdSafetyService.generateAnnualSummary(input.establishmentId, input.calendarYear),
    onSuccess: (_, variables) => invalidate({ establishmentId: variables.establishmentId }),
  });
}

export function useMhdCertifyOshaAnnualSummary() {
  const invalidate = useInvalidateSafety();
  return useMutation({
    mutationFn: (input: MhdCertifyOshaAnnualSummaryInput) => mhdSafetyService.certifyAnnualSummary(input),
    onSuccess: (_, variables) => invalidate({ summaryId: variables.summaryId }),
  });
}

export function useMhdQueueOshaItaSubmission() {
  const invalidate = useInvalidateSafety();
  return useMutation({
    mutationFn: (summaryId: string) => mhdSafetyService.queueItaSubmission(summaryId),
    onSuccess: (_, summaryId) => invalidate({ summaryId }),
  });
}
