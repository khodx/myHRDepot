import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdLeaveWorkflowService } from './WorkflowService';

export const mhdLeaveWorkflowQueryKey = (caseId: string | null) =>
  ['mhd-leaves', 'workflow', caseId ?? ''] as const;
const key = mhdLeaveWorkflowQueryKey;

export function useMhdLeaveWorkflow(caseId: string | null) {
  return useQuery({
    queryKey: key(caseId),
    queryFn: () => mhdLeaveWorkflowService.get(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdLeaveReadiness() {
  return useQuery({
    queryKey: ['mhd-leaves', 'readiness'],
    queryFn: () => mhdLeaveWorkflowService.readiness(),
  });
}
export function useMhdLeavePayrollHours(caseId: string) {
  return useQuery({
    queryKey: [...key(caseId), 'payroll-hours'],
    queryFn: () => mhdLeaveWorkflowService.getPayrollHours(caseId),
    enabled: Boolean(caseId),
  });
}
export function useMhdLeaveEligibilityFacts(caseId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...key(caseId), 'eligibility-facts'],
    queryFn: () => mhdLeaveWorkflowService.getEligibilityFacts(caseId),
    enabled: Boolean(caseId) && enabled,
  });
}
export function useMhdSetLeaveCaseAnswers(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: {
      adultChildIncapableOfSelfCare: boolean | null;
      employerAgreedIntermittentBonding: boolean | null;
    }) => mhdLeaveWorkflowService.setCaseAnswers({ caseId, ...input }),
    onSuccess: refresh,
  });
}
export function useMhdRecordLeavePayrollHours(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: import('./WorkflowTypes').MhdLeavePayrollHoursInput) =>
      mhdLeaveWorkflowService.recordPayrollHours(input),
    onSuccess: refresh,
  });
}
export function useMhdRunLeaveEligibility(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: () => mhdLeaveWorkflowService.runEligibility(caseId),
    onSuccess: refresh,
  });
}

function useRefresh(caseId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: key(caseId) });
    void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'cases'] });
  };
}

export function useMhdConfirmLeaveEligibility(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (snapshotId: string) => mhdLeaveWorkflowService.confirm(snapshotId),
    onSuccess: refresh,
  });
}

export function useMhdOverrideLeaveEligibility(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.override>[0]) =>
      mhdLeaveWorkflowService.override(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveEvent(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordEvent>[0]) =>
      mhdLeaveWorkflowService.recordEvent(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveReturnToWork(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordReturnToWork>[0]) =>
      mhdLeaveWorkflowService.recordReturnToWork(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveNotice(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordNotice>[0]) =>
      mhdLeaveWorkflowService.recordNotice(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveNoticeDelivery(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.markNoticeDelivery>[0]) =>
      mhdLeaveWorkflowService.markNoticeDelivery(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveSegment(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordSegment>[0]) =>
      mhdLeaveWorkflowService.recordSegment(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveSegmentStatus(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.updateSegmentStatus>[0]) =>
      mhdLeaveWorkflowService.updateSegmentStatus(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveBenefitObligation(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordBenefitObligation>[0]) =>
      mhdLeaveWorkflowService.recordBenefitObligation(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveBenefitObligationStatus(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (
      input: Parameters<typeof mhdLeaveWorkflowService.updateBenefitObligationStatus>[0],
    ) => mhdLeaveWorkflowService.updateBenefitObligationStatus(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveBenefitTransaction(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordBenefitTransaction>[0]) =>
      mhdLeaveWorkflowService.recordBenefitTransaction(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveBondingEvent(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.setBondingEvent>[0]) =>
      mhdLeaveWorkflowService.setBondingEvent(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveDesignatedPerson(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordDesignatedPerson>[0]) =>
      mhdLeaveWorkflowService.recordDesignatedPerson(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveDesignatedPersonVoid(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.voidDesignatedPerson>[0]) =>
      mhdLeaveWorkflowService.voidDesignatedPerson(input),
    onSuccess: refresh,
  });
}

export function useMhdLeavePaySource(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.recordPaySource>[0]) =>
      mhdLeaveWorkflowService.recordPaySource(input),
    onSuccess: refresh,
  });
}

export function useMhdLeavePaySourceStatus(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.updatePaySourceStatus>[0]) =>
      mhdLeaveWorkflowService.updatePaySourceStatus(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveWorkersComp(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.setWorkersComp>[0]) =>
      mhdLeaveWorkflowService.setWorkersComp(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveKeyEmployee(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.setKeyEmployee>[0]) =>
      mhdLeaveWorkflowService.setKeyEmployee(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveEssentialFunctions(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (providedOn?: string | null) =>
      mhdLeaveWorkflowService.recordEssentialFunctions(caseId, providedOn),
    onSuccess: refresh,
  });
}

export function useMhdLeaveChecklistAdd(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.addChecklistItem>[0]) =>
      mhdLeaveWorkflowService.addChecklistItem(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveChecklistEdit(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.editChecklistItem>[0]) =>
      mhdLeaveWorkflowService.editChecklistItem(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveChecklistStatus(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.setChecklistStatus>[0]) =>
      mhdLeaveWorkflowService.setChecklistStatus(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveChecklistRemove(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.removeChecklistItem>[0]) =>
      mhdLeaveWorkflowService.removeChecklistItem(input),
    onSuccess: refresh,
  });
}

export function useMhdLeaveCertificationClearDates(caseId: string) {
  const refresh = useRefresh(caseId);
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdLeaveWorkflowService.clearCertificationDates>[0]) =>
      mhdLeaveWorkflowService.clearCertificationDates(input),
    onSuccess: refresh,
  });
}
