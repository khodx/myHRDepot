import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MhdAddTripToClaimInput,
  MhdCreateClaimInput,
  MhdDecideClaimInput,
  MhdMarkClaimExportedInput,
  MhdMileageClaimFilters,
  MhdMileageRateFilters,
  MhdMileageTripFilters,
  MhdProposeRateInput,
  MhdRecordTripInput,
  MhdSetCompanyRatePolicyInput,
  MhdVoidTripInput,
} from './Types';
import { mhdMileageService } from './Service';

export const mhdMileageQueryKeys = {
  rates: (filters: MhdMileageRateFilters) => ['mhd-mileage', 'rates', filters] as const,
  resolvedRate: (category: string, onDate: string) =>
    ['mhd-mileage', 'resolved-rate', category, onDate] as const,
  effectiveRate: (companyId: string | null, onDate: string | null) =>
    ['mhd-mileage', 'effective-rate', companyId ?? '', onDate ?? 'today'] as const,
  trips: (filters: MhdMileageTripFilters) => ['mhd-mileage', 'trips', filters] as const,
  claims: (filters: MhdMileageClaimFilters) => ['mhd-mileage', 'claims', filters] as const,
  claimDetail: (claimId: string | null) => ['mhd-mileage', 'claim-detail', claimId ?? ''] as const,
  privileged: () => ['mhd-mileage', 'privileged'] as const,
};

/**
 * Anything that moves claim state must refresh claims, claim detail AND the
 * trip list together.
 *
 * The three are not independent. Approving a claim stamps its lines, so the
 * detail changes; it also fixes the trips onto that claim so they can no longer
 * be claimed elsewhere, and rejecting or cancelling releases them back to the
 * unclaimed pool. A stale trip list would offer a trip that is already spoken
 * for, or hide one that has just been freed — and either way the user would
 * discover it as a save error from the unique index rather than as the state of
 * the screen.
 */
function useClaimStateInvalidator() {
  const queryClient = useQueryClient();
  return (claimId?: string | null) => {
    void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'claims'] });
    void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'trips'] });
    if (claimId) {
      void queryClient.invalidateQueries({
        queryKey: mhdMileageQueryKeys.claimDetail(claimId),
      });
    } else {
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'claim-detail'] });
    }
  };
}

// ---------------------------------------------------------------------------
// Rate registry (global — Platform Admin writes, everyone reads)
// ---------------------------------------------------------------------------

export function useMhdMileageRates(filters: MhdMileageRateFilters = {}) {
  return useQuery({
    queryKey: mhdMileageQueryKeys.rates(filters),
    queryFn: () => mhdMileageService.listRates(filters),
  });
}

/**
 * The rate that would price a trip on a given date, or null when none is
 * confirmed for it. Render the null — an approval will fail on that same gap,
 * and it is better seen while the claim is still being built.
 */
export function useMhdResolvedRate(category: string | null, onDate: string | null) {
  return useQuery({
    queryKey: mhdMileageQueryKeys.resolvedRate(category ?? '', onDate ?? ''),
    queryFn: () => mhdMileageService.resolveRateForDate(category!, onDate!),
    enabled: Boolean(category && onDate),
  });
}

export function useMhdProposeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdProposeRateInput) => mhdMileageService.proposeRate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'rates'] });
    },
  });
}

export function useMhdConfirmRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rateId: string) => mhdMileageService.confirmRate(rateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'rates'] });
      // Confirming supersedes the incumbent in the same transaction, so both
      // the resolver and every company's effective rate can move — including
      // for companies whose own policy did not change at all.
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'resolved-rate'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'effective-rate'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Company rate policy
// ---------------------------------------------------------------------------

export function useMhdEffectiveRate(companyId: string | null, onDate: string | null = null) {
  return useQuery({
    queryKey: mhdMileageQueryKeys.effectiveRate(companyId, onDate),
    queryFn: () => mhdMileageService.getEffectiveRate(companyId!, onDate),
    enabled: Boolean(companyId),
  });
}

export function useMhdSetCompanyRatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdSetCompanyRatePolicyInput) => mhdMileageService.setCompanyPolicy(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'effective-rate'] });
      // A new policy changes what unapproved claims are worth, but never
      // restates an approved one — stamped lines keep the policy they were
      // priced against.
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'claims'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export function useMhdMileageTrips(filters: MhdMileageTripFilters) {
  return useQuery({
    queryKey: mhdMileageQueryKeys.trips(filters),
    queryFn: () => mhdMileageService.listTrips(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdRecordTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRecordTripInput) => mhdMileageService.recordTrip(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-mileage', 'trips'] });
    },
  });
}

/**
 * Voiding removes any unstamped claim line with the trip, so a draft claim's
 * composition and totals both move — the full claim surface has to refresh, not
 * just the trip list the user was looking at.
 */
export function useMhdVoidTrip() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: (input: MhdVoidTripInput) => mhdMileageService.voidTrip(input),
    onSuccess: () => invalidateClaimState(null),
  });
}

export function useMhdUpdateTrip() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: (input: Parameters<typeof mhdMileageService.updateTrip>[0]) =>
      mhdMileageService.updateTrip(input),
    onSuccess: () => invalidateClaimState(null),
  });
}

export function useMhdRemoveTripFromClaim() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: ({ claimId, tripId }: { claimId: string; tripId: string }) =>
      mhdMileageService.removeTripFromClaim(claimId, tripId),
    onSuccess: () => invalidateClaimState(null),
  });
}

/**
 * Cancelling frees every trip on the claim, so the trip list changes as well as
 * the claim — which is exactly what the shared invalidator covers.
 */
export function useMhdCancelClaim() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason: string }) =>
      mhdMileageService.cancelClaim(claimId, reason),
    onSuccess: () => invalidateClaimState(null),
  });
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export function useMhdMileageClaims(filters: MhdMileageClaimFilters) {
  return useQuery({
    queryKey: mhdMileageQueryKeys.claims(filters),
    queryFn: () => mhdMileageService.listClaims(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdMileageClaim(claimId: string | null) {
  return useQuery({
    queryKey: mhdMileageQueryKeys.claimDetail(claimId),
    queryFn: () => mhdMileageService.getClaim(claimId!),
    enabled: Boolean(claimId),
  });
}

export function useMhdCreateClaim() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: (input: MhdCreateClaimInput) => mhdMileageService.createClaim(input),
    onSuccess: () => invalidateClaimState(null),
  });
}

export function useMhdAddTripToClaim() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: (input: MhdAddTripToClaimInput) => mhdMileageService.addTripToClaim(input),
    onSuccess: (_result, input) => invalidateClaimState(input.claimId),
  });
}

export function useMhdSubmitClaim() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: (claimId: string) => mhdMileageService.submitClaim(claimId),
    onSuccess: (_result, claimId) => invalidateClaimState(claimId),
  });
}

/**
 * The decision moves the most state of anything in the module. APPROVED stamps
 * every line and writes the claim's three totals; REJECTED releases the trips
 * back to the unclaimed pool. Both are handled by the shared invalidator for
 * exactly that reason.
 */
export function useMhdDecideClaim() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: (input: MhdDecideClaimInput) => mhdMileageService.decideClaim(input),
    onSuccess: (_result, input) => invalidateClaimState(input.claimId),
  });
}

export function useMhdMarkClaimExported() {
  const invalidateClaimState = useClaimStateInvalidator();
  return useMutation({
    mutationFn: (input: MhdMarkClaimExportedInput) => mhdMileageService.markExported(input),
    onSuccess: (_result, input) => invalidateClaimState(input.claimId),
  });
}

// ---------------------------------------------------------------------------
// Visibility + pickers
// ---------------------------------------------------------------------------

/**
 * Gates the registry and policy editors, which are hidden from an employee
 * entirely rather than shown disabled. The RPCs enforce this regardless — this
 * only decides what is worth rendering.
 */
export function useMhdMileageIsPrivileged() {
  return useQuery({
    queryKey: mhdMileageQueryKeys.privileged(),
    queryFn: () => mhdMileageService.isPrivileged(),
  });
}
