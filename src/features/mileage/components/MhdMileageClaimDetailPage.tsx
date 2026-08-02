import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdMileageClaimRecordTabs } from '@/appshell/components/MhdMileageClaimRecordTabs';
import { mhdMileageIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAddTripToClaim,
  useMhdCancelClaim,
  useMhdDecideClaim,
  useMhdMileageClaim,
  useMhdMileageTrips,
  useMhdSubmitClaim,
} from '../Hook';
import type { MhdClaimDecisionFormValues } from '../Schemas';
import { mhdIsTripClaimable } from '../Types';
import { MhdClaimDetailPanel } from './MhdClaimDetailPanel';
import { MhdClaimStatusBadge } from './MhdClaimStatusBadge';

/**
 * `/mileage/claims/:claimId` — one claim's own detail page.
 *
 * Mirrors the shape MhdTaskDetailPage and MhdAccommodationCaseDetailPage
 * already use: MhdPageHeader with a back link to the list, a single-tab
 * MhdMileageClaimRecordTabs bar underneath it (a claim has no separate
 * notes/attachments/audit sub-view — it is its lines plus workflow actions),
 * and the record body below. The "trips available for this period" section
 * — previously rendered under the claim in the list page's Claims tab — moves
 * here, since it is part of *viewing and building* one claim, not part of
 * browsing the claims list.
 */
export function MhdMileageClaimDetailPage() {
  const { claimId = '' } = useParams<{ claimId: string }>();
  const { profile, roles } = useMhdAuth();
  const isPrivileged = mhdMileageIsPrivileged(roles);

  const claimDetail = useMhdMileageClaim(claimId || null);
  const claim = claimDetail.data ?? null;

  const tripFilters = useMemo(
    () => ({
      companyId: claim ? profile?.companyId ?? null : null,
      personId: claim?.personId ?? null,
      unclaimedOnly: true,
      includeVoided: false,
    }),
    [claim, profile?.companyId],
  );
  const trips = useMhdMileageTrips(tripFilters);

  const addTripToClaim = useMhdAddTripToClaim();
  const submitClaim = useMhdSubmitClaim();
  const decideClaim = useMhdDecideClaim();
  const cancelClaim = useMhdCancelClaim();

  // Trips a DRAFT claim can still take: inside its period, belonging to its
  // claimant, and not already spoken for. The database guarantees the rule
  // with a unique index; offering only eligible rows is what keeps the user
  // from meeting it as a save error instead of as the state of the screen.
  const addableTrips = useMemo(() => {
    if (!claim || claim.status !== 'DRAFT') return [];
    return (trips.data ?? []).filter(
      (trip) =>
        trip.personId === claim.personId &&
        trip.tripDate >= claim.periodStart &&
        trip.tripDate <= claim.periodEnd &&
        mhdIsTripClaimable(trip),
    );
  }, [claim, trips.data]);

  async function handleDecide(values: MhdClaimDecisionFormValues) {
    await decideClaim.mutateAsync({
      claimId: values.claimId,
      decision: values.decision,
      decisionNote: values.decisionNote ?? null,
    });
  }

  if (claimDetail.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading claim…</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="space-y-6">
        <MhdPageHeader backTo="/mileage" backLabel="Mileage" title="Claim not found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/mileage"
        backLabel="Mileage"
        title={claim.referenceId}
        chips={<MhdClaimStatusBadge status={claim.status} />}
        description={`${claim.personDisplayName} · ${claim.periodStart} — ${claim.periodEnd}`}
      />

      <MhdMileageClaimRecordTabs claimId={claim.id} active="detail" />

      <MhdClaimDetailPanel
        claim={claim}
        isPrivileged={isPrivileged}
        isLoading={claimDetail.isLoading}
        isSubmitting={submitClaim.isPending || decideClaim.isPending || cancelClaim.isPending}
        onSubmitClaim={(id) => submitClaim.mutateAsync(id)}
        onDecide={handleDecide}
        onCancelClaim={(input) => cancelClaim.mutateAsync(input)}
      />

      {claim.status === 'DRAFT' ? (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Trips available for this period</h3>
          {addableTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unclaimed trips fall inside this claim's period.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-foreground">
              {addableTrips.map((trip) => (
                <li key={trip.id} className="flex items-center justify-between gap-3">
                  <span>
                    {trip.tripDate} · {trip.origin} → {trip.destination} · {trip.reimbursableMiles}{' '}
                    mi
                  </span>
                  <Button
                    variant="secondary"
                    className="px-3 py-1"
                    disabled={addTripToClaim.isPending}
                    onClick={() =>
                      void addTripToClaim.mutateAsync({
                        claimId: claim.id,
                        tripId: trip.id,
                      })
                    }
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
