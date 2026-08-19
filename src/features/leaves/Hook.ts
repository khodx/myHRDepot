import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MhdAdjustLeaveInput,
  MhdCreateLeaveCaseFromSubmissionInput,
  MhdCreateLeaveCaseInput,
  MhdCreateLeaveTypeInput,
  MhdDesignateLeaveInput,
  MhdForkLeaveTypeInput,
  MhdLeaveCaseFilters,
  MhdMarkCertificationInput,
  MhdRecordCertificationInput,
  MhdSetLeaveCaseBasesInput,
  MhdTransitionLeaveCaseInput,
  MhdUpdateLeaveTypeInput,
} from './Types';
import { mhdLeavesService } from './Service';

export const mhdLeavesQueryKeys = {
  leaveTypes: (companyId: string | null) => ['mhd-leaves', 'leave-types', companyId ?? ''] as const,
  cases: (filters: MhdLeaveCaseFilters) => ['mhd-leaves', 'cases', filters] as const,
  caseBases: (caseId: string | null) => ['mhd-leaves', 'case-bases', caseId ?? ''] as const,
  balance: (personId: string | null, leaveTypeId: string | null, asOf: string | null) =>
    ['mhd-leaves', 'balance', personId ?? '', leaveTypeId ?? '', asOf ?? 'today'] as const,
  ledger: (personId: string | null, leaveTypeId: string | null) =>
    ['mhd-leaves', 'ledger', personId ?? '', leaveTypeId ?? 'ALL'] as const,
  certifications: (caseId: string | null) =>
    ['mhd-leaves', 'certifications', caseId ?? ''] as const,
};

/**
 * Anything that writes to the ledger must refresh every per-basis balance and
 * the ledger itself. Balances are keyed per leave type, so the invalidation is
 * broad (the `balance` prefix) rather than per-type — a concurrent designation
 * moved several clocks at once, and a stale row on any of them would understate
 * how much protected leave the person has left.
 */
function useLedgerInvalidator() {
  const queryClient = useQueryClient();
  return (personId: string | null) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'balance'] });
    void queryClient.invalidateQueries({
      queryKey: mhdLeavesQueryKeys.ledger(personId, null),
    });
    void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'ledger'] });
  };
}

// ---------------------------------------------------------------------------
// Leave types
// ---------------------------------------------------------------------------

export function useMhdLeaveTypes(companyId: string | null) {
  return useQuery({
    queryKey: mhdLeavesQueryKeys.leaveTypes(companyId),
    queryFn: () => mhdLeavesService.listLeaveTypes(companyId!),
    enabled: Boolean(companyId),
  });
}

/**
 * Leave types Studio (0185): author a global (library) or company-owned leave
 * type. Invalidates the whole `leave-types` prefix (not just one company's
 * key) because a global row created here is visible under every company's
 * `useMhdLeaveTypes(companyId)` query.
 */
export function useMhdCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateLeaveTypeInput) => mhdLeavesService.createLeaveType(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'leave-types'] });
    },
  });
}

export function useMhdUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateLeaveTypeInput) => mhdLeavesService.updateLeaveType(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'leave-types'] });
    },
  });
}

export function useMhdForkLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdForkLeaveTypeInput) => mhdLeavesService.forkLeaveType(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'leave-types'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export function useMhdLeaveCases(filters: MhdLeaveCaseFilters) {
  return useQuery({
    queryKey: mhdLeavesQueryKeys.cases(filters),
    queryFn: () => mhdLeavesService.listCases(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdCreateLeaveCase(_companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateLeaveCaseInput) => mhdLeavesService.createCase(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'cases'] });
    },
  });
}

/**
 * Form-driven Leaves intake (0188) — see `mhdLeavesService.createCaseFromSubmission`
 * for the full contract and the documented gap in what currently calls it.
 * Additive to `useMhdCreateLeaveCase` above, never a replacement.
 */
export function useMhdCreateLeaveCaseFromSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateLeaveCaseFromSubmissionInput) =>
      mhdLeavesService.createCaseFromSubmission(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'cases'] });
    },
  });
}

export function useMhdLeaveCaseBases(caseId: string | null) {
  return useQuery({
    queryKey: mhdLeavesQueryKeys.caseBases(caseId),
    queryFn: () => mhdLeavesService.listCaseBases(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdSetLeaveCaseBases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSetLeaveCaseBasesInput) => mhdLeavesService.setCaseBases(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdLeavesQueryKeys.caseBases(input.caseId),
      });
      // The designated set drives which balances the detail page shows, and the
      // case list's basis_count, so both have to refresh.
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'cases'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'balance'] });
    },
  });
}

export function useMhdTransitionLeaveCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdTransitionLeaveCaseInput) => mhdLeavesService.transitionCase(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-leaves', 'cases'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Ledger and balances
// ---------------------------------------------------------------------------

/**
 * One balance query per designated basis, run in parallel. Deliberately NOT a
 * single aggregate: each basis has its own clock and its own measurement window,
 * and the balance panel renders them as separate rows. Summing them here would
 * be the exact bug the module exists to prevent.
 */
export function useMhdLeaveBalances(
  personId: string | null,
  leaveTypeIds: string[],
  asOf: string | null = null,
) {
  return useQueries({
    queries: leaveTypeIds.map((leaveTypeId) => ({
      queryKey: mhdLeavesQueryKeys.balance(personId, leaveTypeId, asOf),
      queryFn: () => mhdLeavesService.balance(personId!, leaveTypeId, asOf),
      enabled: Boolean(personId && leaveTypeId),
    })),
  });
}

export function useMhdLeaveLedger(personId: string | null, leaveTypeId: string | null = null) {
  return useQuery({
    queryKey: mhdLeavesQueryKeys.ledger(personId, leaveTypeId),
    queryFn: () => mhdLeavesService.listLedger(personId!, leaveTypeId),
    enabled: Boolean(personId),
  });
}

export function useMhdDesignateLeave() {
  const invalidateLedger = useLedgerInvalidator();
  return useMutation({
    mutationFn: (input: MhdDesignateLeaveInput) => mhdLeavesService.designate(input),
    // The person id is not on the designate input (the RPC derives it from the
    // case), so invalidate the whole ledger/balance surface.
    onSuccess: () => invalidateLedger(null),
  });
}

export function useMhdAdjustLeave() {
  const invalidateLedger = useLedgerInvalidator();
  return useMutation({
    mutationFn: (input: MhdAdjustLeaveInput) => mhdLeavesService.adjust(input),
    onSuccess: (_result, input) => invalidateLedger(input.personId),
  });
}

// ---------------------------------------------------------------------------
// Certifications — behind the tighter medical gate
// ---------------------------------------------------------------------------

export function useMhdLeaveCertifications(caseId: string | null) {
  return useQuery({
    queryKey: mhdLeavesQueryKeys.certifications(caseId),
    queryFn: () => mhdLeavesService.listCertifications(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdRecordCertification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRecordCertificationInput) => mhdLeavesService.recordCertification(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mhdLeavesQueryKeys.certifications(input.caseId),
      });
    },
  });
}

export function useMhdMarkCertificationSufficient(caseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdMarkCertificationInput) =>
      mhdLeavesService.markCertificationSufficient(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdLeavesQueryKeys.certifications(caseId),
      });
    },
  });
}
