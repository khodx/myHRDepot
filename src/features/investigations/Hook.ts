import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdAddPartyInput,
  MhdAssignInvestigatorInput,
  MhdCreateInvestigationInput,
  MhdInvestigationCaseFilters,
  MhdInvestigationGrantInput,
  MhdTransitionInvestigationInput,
} from './Types';
import { mhdInvestigationsService } from './Service';

export const mhdInvestigationsQueryKeys = {
  cases: (filters: MhdInvestigationCaseFilters) =>
    ['mhd-investigations', 'cases', filters] as const,
  case: (caseId: string | null) => ['mhd-investigations', 'case', caseId ?? ''] as const,
  grants: (caseId: string | null) => ['mhd-investigations', 'grants', caseId ?? ''] as const,
  parties: (caseId: string | null) => ['mhd-investigations', 'parties', caseId ?? ''] as const,
  people: (companyId: string | null) =>
    ['mhd-investigations', 'people', companyId ?? 'ALL'] as const,
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

/**
 * The grant-filtered case list. This is also the nav gate: the "Investigations"
 * sidebar entry appears only when this query returns ≥1 row — a fresh admin with
 * no grants gets an empty set and does not see the module at all. Gate on the
 * data, never on a role.
 */
export function useMhdInvestigationCases(filters: MhdInvestigationCaseFilters) {
  return useQuery({
    queryKey: mhdInvestigationsQueryKeys.cases(filters),
    queryFn: () => mhdInvestigationsService.listCases(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdInvestigationCase(caseId: string | null) {
  return useQuery({
    queryKey: mhdInvestigationsQueryKeys.case(caseId),
    queryFn: () => mhdInvestigationsService.getCase(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdCreateInvestigationCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateInvestigationInput) => mhdInvestigationsService.createCase(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-investigations', 'cases'] });
    },
  });
}

export function useMhdTransitionInvestigationCase(caseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdTransitionInvestigationInput) =>
      mhdInvestigationsService.transitionCase(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-investigations', 'cases'] });
      void queryClient.invalidateQueries({
        queryKey: mhdInvestigationsQueryKeys.case(caseId),
      });
    },
  });
}

export function useMhdAssignInvestigator(caseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignInvestigatorInput) =>
      mhdInvestigationsService.assignInvestigator(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-investigations', 'cases'] });
      void queryClient.invalidateQueries({
        queryKey: mhdInvestigationsQueryKeys.case(caseId),
      });
      // Assignment transfers the implicit grant, so the grant list changes too.
      void queryClient.invalidateQueries({
        queryKey: mhdInvestigationsQueryKeys.grants(caseId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Reveals — deliberate, audited, never fetched on mount
// ---------------------------------------------------------------------------

/**
 * The allegation reveal, modelled as a MUTATION rather than a query on purpose:
 * every reveal is audited server-side, so it must be a deliberate action the user
 * takes (clicking "Reveal allegation"), never a query that fires on render. There
 * is intentionally no caching key — a fresh audited call each time.
 */
export function useMhdRevealAllegation() {
  return useMutation({
    mutationFn: (caseId: string) => mhdInvestigationsService.revealAllegation(caseId),
  });
}

/** The party statement reveal — same deliberate, audited, mutation-not-query shape. */
export function useMhdRevealStatement() {
  return useMutation({
    mutationFn: (partyId: string) => mhdInvestigationsService.revealStatement(partyId),
  });
}

// ---------------------------------------------------------------------------
// Grants — the access model
// ---------------------------------------------------------------------------

export function useMhdInvestigationGrants(caseId: string | null) {
  return useQuery({
    queryKey: mhdInvestigationsQueryKeys.grants(caseId),
    queryFn: () => mhdInvestigationsService.listGrants(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdGrantInvestigationAccess(caseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdInvestigationGrantInput) => mhdInvestigationsService.grantAccess(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdInvestigationsQueryKeys.grants(caseId),
      });
    },
  });
}

export function useMhdRevokeInvestigationAccess(caseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdInvestigationGrantInput) => mhdInvestigationsService.revokeAccess(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdInvestigationsQueryKeys.grants(caseId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Parties
// ---------------------------------------------------------------------------

export function useMhdInvestigationParties(caseId: string | null) {
  return useQuery({
    queryKey: mhdInvestigationsQueryKeys.parties(caseId),
    queryFn: () => mhdInvestigationsService.listParties(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useMhdAddInvestigationParty(caseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAddPartyInput) => mhdInvestigationsService.addParty(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mhdInvestigationsQueryKeys.parties(caseId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

export function useMhdInvestigationPeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdInvestigationsQueryKeys.people(companyId),
    // The people directory filter requires a search term field; pass an empty
    // string to list the whole company roster.
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}
