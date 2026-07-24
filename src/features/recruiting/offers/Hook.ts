import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MhdAcceptOfferInput,
  MhdCreateOfferInput,
  MhdDeclineOfferInput,
  MhdExtendOfferInput,
  MhdRescindOfferInput,
} from './Types';
import { mhdOfferService } from './Service';

// Query keys for the offers surface. Offers hang off an application, so the list
// is keyed by `applicationId` and the detail by `offerId`. These are the ONLY
// keys this package owns — cross-invalidation into Recruiting package 1 (the
// parent application / requisition queries, whose lifecycle the HANDOFF changes)
// is left to the host: it knows package 1's keys, and this package deliberately
// does NOT import package 1's service to invalidate them. See the note on
// `useMhdAcceptOffer`.
export const mhdOfferQueryKeys = {
  all: ['mhd-recruiting-offer'] as const,
  offers: (applicationId: string | null) =>
    ['mhd-recruiting-offer', 'list', applicationId ?? ''] as const,
  offer: (offerId: string | null) => ['mhd-recruiting-offer', 'detail', offerId ?? ''] as const,
  // The onboarding-feed preview, keyed by application. The accept mutation seeds
  // the onboarding records, so it also invalidates this key below.
  hirePayload: (applicationId: string | null) =>
    ['mhd-recruiting-offer', 'hire-payload', applicationId ?? ''] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useMhdOffers(applicationId: string | null) {
  return useQuery({
    queryKey: mhdOfferQueryKeys.offers(applicationId),
    queryFn: () => mhdOfferService.listOffers(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useMhdOffer(offerId: string | null) {
  return useQuery({
    queryKey: mhdOfferQueryKeys.offer(offerId),
    queryFn: () => mhdOfferService.getOffer(offerId!),
    enabled: Boolean(offerId),
  });
}

/**
 * The read-only hire payload — what the onboarding feed writes at the handoff.
 * Previews the terms + mapped recommendation/rating for an application.
 */
export function useMhdHirePayload(applicationId: string | null) {
  return useQuery({
    queryKey: mhdOfferQueryKeys.hirePayload(applicationId),
    queryFn: () => mhdOfferService.getHirePayload(applicationId!),
    enabled: Boolean(applicationId),
  });
}

// ---------------------------------------------------------------------------
// Mutations
//
// Every offer mutation invalidates BOTH the offer list (the panel's projection)
// and the offer detail — the partial-unique "one live offer" index means a
// create/terminal transition changes what the list shows, and the lifecycle
// actions change the single offer. Cross-invalidating the parent application is
// the host's job (see the header note); mutation callers may also pass their own
// `onSuccess` through `mutate`/`mutateAsync` to trigger it.
// ---------------------------------------------------------------------------

export function useMhdCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateOfferInput) => mhdOfferService.createOffer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'list'] });
    },
  });
}

export function useMhdExtendOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdExtendOfferInput) => mhdOfferService.extendOffer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'detail'] });
    },
  });
}

/**
 * THE HIRE HANDOFF. Accepting creates the `job_assignment` and marks the parent
 * application HIRED — so besides the offer list/detail, the HOST should invalidate
 * Recruiting package 1's application + requisition queries. This package does not
 * import package 1's service; wire that cross-invalidation by passing an
 * `onSuccess` to `acceptOffer.mutateAsync(input, { onSuccess })` at the call site,
 * or invalidate `['mhd-recruiting', 'application']` / `'requisitions'` there.
 */
export function useMhdAcceptOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAcceptOfferInput) => mhdOfferService.acceptOffer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'detail'] });
      // The handoff seeds the onboarding offer letter + candidate evaluation, so
      // the hire-payload preview changes too.
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'hire-payload'] });
    },
  });
}

export function useMhdDeclineOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdDeclineOfferInput) => mhdOfferService.declineOffer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'detail'] });
    },
  });
}

export function useMhdRescindOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdRescindOfferInput) => mhdOfferService.rescindOffer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-recruiting-offer', 'detail'] });
    },
  });
}
