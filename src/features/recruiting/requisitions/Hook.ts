import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdApplicationFilters,
  MhdCreateRequisitionInput,
  MhdEeoReportFilters,
  MhdInviteApplicationInput,
  MhdMoveApplicationStageInput,
  MhdRejectApplicationInput,
  MhdRequisitionFilters,
  MhdStageUpsertInput,
  MhdTransitionRequisitionInput,
} from './Types';
import { mhdRecruitingService } from './Service';

export const mhdRecruitingQueryKeys = {
  stages: (companyId: string | null) => ['mhd-recruiting', 'stages', companyId ?? 'ALL'] as const,
  reasons: (companyId: string | null) => ['mhd-recruiting', 'reasons', companyId ?? 'ALL'] as const,
  requisitions: (filters: MhdRequisitionFilters) =>
    ['mhd-recruiting', 'requisitions', filters] as const,
  applications: (filters: MhdApplicationFilters) =>
    ['mhd-recruiting', 'applications', filters] as const,
  application: (applicationId: string | null) =>
    ['mhd-recruiting', 'application', applicationId ?? ''] as const,
  applicationHistory: (applicationId: string | null) =>
    ['mhd-recruiting', 'application-history', applicationId ?? ''] as const,
  eeoReport: (filters: MhdEeoReportFilters) => ['mhd-recruiting', 'eeo-report', filters] as const,
  people: (companyId: string | null) => ['mhd-recruiting', 'people', companyId ?? 'ALL'] as const,
};

// Note on the applicant surface: `application_submit` and `eeo_submit` are NOT
// wrapped in hooks here. They are reached UNAUTHENTICATED from the public apply
// page (no react-query cache, no auth session), so that page calls
// `mhdRecruitingService.submitApplication` / `.submitEeo` directly — the same
// pattern the e-sign `/sign` route uses.

// ---------------------------------------------------------------------------
// Config: stages + reasons
// ---------------------------------------------------------------------------

export function useMhdRecruitingStages(companyId: string | null) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.stages(companyId),
    queryFn: () => mhdRecruitingService.listStages(companyId),
    enabled: Boolean(companyId),
  });
}

export function useMhdRecruitingReasons(companyId: string | null) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.reasons(companyId),
    queryFn: () => mhdRecruitingService.listReasons(companyId),
    enabled: Boolean(companyId),
  });
}

export function useMhdUpsertRecruitingStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdStageUpsertInput) => mhdRecruitingService.upsertStage(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'stages'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Requisitions
// ---------------------------------------------------------------------------

export function useMhdRecruitingRequisitions(filters: MhdRequisitionFilters) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.requisitions(filters),
    queryFn: () => mhdRecruitingService.listRequisitions(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdCreateRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateRequisitionInput) => mhdRecruitingService.createRequisition(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'requisitions'] });
    },
  });
}

export function useMhdTransitionRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdTransitionRequisitionInput) =>
      mhdRecruitingService.transitionRequisition(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'requisitions'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export function useMhdRecruitingApplications(filters: MhdApplicationFilters) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.applications(filters),
    queryFn: () => mhdRecruitingService.listApplications(filters),
    enabled: Boolean(filters.requisitionId),
  });
}

export function useMhdRecruitingApplication(applicationId: string | null) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.application(applicationId),
    queryFn: () => mhdRecruitingService.getApplication(applicationId!),
    enabled: Boolean(applicationId),
  });
}

export function useMhdRecruitingApplicationHistory(applicationId: string | null) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.applicationHistory(applicationId),
    queryFn: () => mhdRecruitingService.getApplicationHistory(applicationId!),
    enabled: Boolean(applicationId),
  });
}

/**
 * Inviting adds an application and shifts the requisition's open-application
 * count, so both the applications board and the requisition list are invalidated.
 */
export function useMhdInviteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdInviteApplicationInput) => mhdRecruitingService.inviteApplication(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'applications'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'requisitions'] });
    },
  });
}

/**
 * A stage move changes the board and, when it crosses into a terminal category,
 * the requisition's open count — invalidate both.
 */
export function useMhdMoveApplicationStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdMoveApplicationStageInput) =>
      mhdRecruitingService.moveApplicationStage(input),
    onSuccess: () => {
      // A move changes the board, the single application (stage/lifecycle), its
      // history trail, and the requisition's open count.
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'applications'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'application'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'application-history'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'requisitions'] });
    },
  });
}

export function useMhdRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRejectApplicationInput) => mhdRecruitingService.rejectApplication(input),
    onSuccess: () => {
      // Reject sets REJECTED, records the reason, and writes a history row.
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'applications'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'application'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'application-history'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting', 'requisitions'] });
    },
  });
}

// ---------------------------------------------------------------------------
// EEO aggregate report (Platform-Admin only)
// ---------------------------------------------------------------------------

export function useMhdRecruitingEeoReport(filters: MhdEeoReportFilters) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.eeoReport(filters),
    queryFn: () => mhdRecruitingService.eeoReport(filters),
    enabled: Boolean(filters.companyId),
  });
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

export function useMhdRecruitingPeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdRecruitingQueryKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}
