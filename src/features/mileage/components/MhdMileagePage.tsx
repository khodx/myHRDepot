import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { mhdCanManageMileageRates, mhdMileageIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateClaim,
  useMhdConfirmRate,
  useMhdEffectiveRate,
  useMhdMileageClaims,
  useMhdMileagePeople,
  useMhdMileageRates,
  useMhdMileageTrips,
  useMhdProposeRate,
  useMhdRecordTrip,
  useMhdSetCompanyRatePolicy,
  useMhdUpdateTrip,
  useMhdVoidTrip,
} from '../Hook';
import {
  mhdClaimPeriodSchema,
  type MhdClaimPeriodFormValues,
  type MhdCompanyRatePolicyFormValues,
  type MhdRateProposalFormValues,
  type MhdTripFormValues,
} from '../Schemas';
import type {
  MhdMileageClaimFilters,
  MhdMileageRateFilters,
  MhdMileageTrip,
  MhdMileageTripFilters,
} from '../Types';
import { MhdClaimListPanel } from './MhdClaimListPanel';
import { MhdCompanyRatePolicyForm } from './MhdCompanyRatePolicyForm';
import { MhdMileageRatesPanel } from './MhdMileageRatesPanel';
import { MhdTripForm } from './MhdTripForm';
import { MhdTripListPanel } from './MhdTripListPanel';

interface BoardProps {
  companyId: string;
  /** Privileged = Platform Admin / HR Partner / Client Admin (mhdRouteAccess). */
  isPrivileged: boolean;
  /** Platform Admin only — the registry is global and nobody else may write it. */
  canManageRates?: boolean;
  /** The viewer's own person id — present for an employee viewing themselves. */
  selfPersonId: string | null;
}

type Tab = 'trips' | 'claims' | 'rates' | 'policy';

/**
 * `/mileage` route entry.
 *
 * Reads the current principal from `useMhdAuth` and derives the two role gates
 * the module needs — `isPrivileged` (the whole company plus the registry and
 * policy tabs) and `canManageRates` (Platform Admin only, because the registry
 * is global). Both are also enforced server-side by the RPCs; deriving them here
 * only decides what is worth rendering. The board below stays props-driven so it
 * can be unit-tested without an auth context.
 */
export function MhdMileagePage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPrivileged = mhdMileageIsPrivileged(roles);
  const canManageRates = mhdCanManageMileageRates(roles);
  const selfPersonId = profile?.personId ?? null;

  if (!companyId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading mileage…</p>
      </div>
    );
  }

  return (
    <MhdMileageBoard
      companyId={companyId}
      isPrivileged={isPrivileged}
      canManageRates={canManageRates}
      selfPersonId={selfPersonId}
    />
  );
}

/**
 * Two renderings behind one route:
 *
 * - **Privileged**: the whole company, plus the rate registry and the company
 *   rate policy.
 * - **Employee**: their own trips and their own claims, and nothing else.
 *
 * The employee case pins `personId` to the viewer, but that pin is a convenience
 * for the query rather than the security boundary. The RPCs refuse to return
 * anybody else's rows regardless, which is why no filtering of privileged data
 * happens here — a client-side filter over data the server should never have
 * sent would be a leak wearing a disguise.
 */
function MhdMileageBoard({
  companyId,
  isPrivileged,
  canManageRates = false,
  selfPersonId,
}: BoardProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('trips');
  const [editingTrip, setEditingTrip] = useState<MhdMileageTrip | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);

  const [tripFilters, setTripFilters] = useState<MhdMileageTripFilters>({
    companyId,
    personId: isPrivileged ? null : selfPersonId,
    from: null,
    to: null,
    unclaimedOnly: false,
    includeVoided: false,
  });
  const [claimFilters, setClaimFilters] = useState<MhdMileageClaimFilters>({
    companyId,
    personId: isPrivileged ? null : selfPersonId,
    status: 'ALL',
  });
  const [rateFilters, setRateFilters] = useState<MhdMileageRateFilters>({
    category: 'BUSINESS',
    status: 'ALL',
  });

  const trips = useMhdMileageTrips(tripFilters);
  const claims = useMhdMileageClaims(claimFilters);
  const rates = useMhdMileageRates(rateFilters);
  const effectiveRate = useMhdEffectiveRate(companyId);
  const people = useMhdMileagePeople(isPrivileged ? companyId : null);

  const recordTrip = useMhdRecordTrip();
  const updateTrip = useMhdUpdateTrip();
  const voidTrip = useMhdVoidTrip();
  const createClaim = useMhdCreateClaim();
  const proposeRate = useMhdProposeRate();
  const confirmRate = useMhdConfirmRate();
  const setPolicy = useMhdSetCompanyRatePolicy();

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person: { id: string; firstName?: string; lastName?: string }) => ({
        id: person.id,
        displayName: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  const claimForm = useForm<MhdClaimPeriodFormValues>({
    resolver: zodResolver(mhdClaimPeriodSchema),
    defaultValues: {
      personId: isPrivileged ? '' : (selfPersonId ?? ''),
      periodStart: '',
      periodEnd: '',
    },
  });

  async function handleTripSubmit(values: MhdTripFormValues) {
    // Editing never re-records. The update RPC keeps the trip's identity, which
    // is what any claim line, audit row or void reason already points at.
    if (editingTrip) {
      await updateTrip.mutateAsync({
        tripId: editingTrip.id,
        tripDate: values.tripDate,
        miles: values.miles,
        origin: values.origin,
        destination: values.destination,
        businessPurpose: values.businessPurpose,
        commuteDeductionMiles: values.commuteDeductionMiles ?? null,
        odometerStart: values.odometerStart ?? null,
        odometerEnd: values.odometerEnd ?? null,
        vehicleDescription: values.vehicleDescription ?? null,
        notes: values.notes ?? null,
      });
      setIsRecording(false);
      setEditingTrip(null);
      return;
    }

    await recordTrip.mutateAsync({
      personId: values.personId,
      tripDate: values.tripDate,
      miles: values.miles,
      origin: values.origin,
      destination: values.destination,
      businessPurpose: values.businessPurpose,
      notOrdinaryCommuting: values.notOrdinaryCommuting,
      isRoundTrip: values.isRoundTrip,
      odometerStart: values.odometerStart ?? null,
      odometerEnd: values.odometerEnd ?? null,
      commuteDeductionMiles: values.commuteDeductionMiles ?? null,
      vehicleDescription: values.vehicleDescription ?? null,
      notes: values.notes ?? null,
    });
    setIsRecording(false);
    setEditingTrip(null);
  }

  async function handleCreateClaim(values: MhdClaimPeriodFormValues) {
    const created = await createClaim.mutateAsync({
      personId: values.personId,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
    });
    claimForm.reset();
    setIsCreatingClaim(false);
    // The new claim is opened on its own detail page rather than selected
    // inline — see MhdMileageClaimDetailPage.
    navigate(`/mileage/claims/${created.id}`);
  }

  async function handleProposeRate(values: MhdRateProposalFormValues) {
    await proposeRate.mutateAsync({
      category: values.category,
      ratePerMile: values.ratePerMile,
      effectiveFrom: values.effectiveFrom,
      sourceUrl: values.sourceUrl,
      noticeNumber: values.noticeNumber,
      sourceDocumentDate: values.sourceDocumentDate ?? null,
      notes: values.notes ?? null,
    });
  }

  async function handleSetPolicy(values: MhdCompanyRatePolicyFormValues) {
    await setPolicy.mutateAsync({
      companyId: values.companyId,
      effectiveFrom: values.effectiveFrom,
      rateMode: values.rateMode,
      fixedRatePerMile: values.fixedRatePerMile ?? null,
      policyNote: values.policyNote ?? null,
    });
  }

  const tabs: Array<[Tab, string]> = isPrivileged
    ? [
        ['trips', 'Trips'],
        ['claims', 'Claims'],
        ['rates', 'IRS rates'],
        ['policy', 'Company rate'],
      ]
    : [
        ['trips', 'Trips'],
        ['claims', 'Claims'],
      ];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Mileage"
        description={
          isPrivileged
            ? 'Trips, claims, and the rates they are priced against.'
            : 'Your business travel and the claims you have made for it.'
        }
        actions={
          <>
            <Button
              onClick={() => {
                setEditingTrip(null);
                setIsRecording(true);
              }}
            >
              Record trip
            </Button>
            <Button variant="secondary" onClick={() => setIsCreatingClaim((open) => !open)}>
              New claim
            </Button>
          </>
        }
      />

      <MhdTabs
        tabs={tabs.map(([value, label]) => ({ value, label }))}
        value={tab}
        onChange={setTab}
      />

      {isCreatingClaim ? (
        <form
          onSubmit={claimForm.handleSubmit(handleCreateClaim)}
          className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-4"
        >
          <div>
            <label htmlFor="claim-person" className="block text-sm font-medium text-foreground">
              Claimant
            </label>
            <select
              id="claim-person"
              {...claimForm.register('personId')}
              disabled={!isPrivileged}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
            >
              <option value="">Select an employee…</option>
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            {claimForm.formState.errors.personId ? (
              <p className="mt-1 text-xs text-rose-600">
                {claimForm.formState.errors.personId.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="period-start" className="block text-sm font-medium text-foreground">
              Period start
            </label>
            <input
              id="period-start"
              type="date"
              {...claimForm.register('periodStart')}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            {claimForm.formState.errors.periodStart ? (
              <p className="mt-1 text-xs text-rose-600">
                {claimForm.formState.errors.periodStart.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="period-end" className="block text-sm font-medium text-foreground">
              Period end
            </label>
            <input
              id="period-end"
              type="date"
              {...claimForm.register('periodEnd')}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            {claimForm.formState.errors.periodEnd ? (
              <p className="mt-1 text-xs text-rose-600">
                {claimForm.formState.errors.periodEnd.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" disabled={createClaim.isPending}>
              {createClaim.isPending ? 'Creating…' : 'Create claim'}
            </Button>
            <Button variant="secondary" onClick={() => setIsCreatingClaim(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {tab === 'trips' ? (
        <MhdTripListPanel
          trips={trips.data ?? []}
          filters={tripFilters}
          onFiltersChange={setTripFilters}
          people={peopleOptions}
          isPrivileged={isPrivileged}
          isLoading={trips.isLoading}
          isSubmitting={voidTrip.isPending}
          onEdit={(trip) => {
            setEditingTrip(trip);
            setIsRecording(true);
          }}
          onVoid={(input) => voidTrip.mutateAsync(input)}
        />
      ) : null}

      {tab === 'claims' ? (
        <MhdClaimListPanel
          claims={claims.data ?? []}
          filters={claimFilters}
          onFiltersChange={setClaimFilters}
          people={peopleOptions}
          isPrivileged={isPrivileged}
          isLoading={claims.isLoading}
        />
      ) : null}

      {/*
        The registry is global and read-only to everyone but a Platform Admin,
        but it is not secret: every claim line cites a row in it, so a reader has
        to be able to reach the row the figure came from.
      */}
      {isPrivileged && tab === 'rates' ? (
        <MhdMileageRatesPanel
          rates={rates.data ?? []}
          filters={rateFilters}
          onFiltersChange={setRateFilters}
          canManage={canManageRates}
          isLoading={rates.isLoading}
          isProposing={proposeRate.isPending}
          isConfirming={confirmRate.isPending}
          onPropose={handleProposeRate}
          onConfirm={(rateId) => confirmRate.mutateAsync(rateId)}
        />
      ) : null}

      {isPrivileged && tab === 'policy' ? (
        <MhdCompanyRatePolicyForm
          companyId={companyId}
          effectiveRate={effectiveRate.data ?? null}
          onSubmit={handleSetPolicy}
          onCancel={() => setTab('trips')}
          isSubmitting={setPolicy.isPending}
        />
      ) : null}

      {isRecording ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              {editingTrip ? 'Edit trip' : 'Record trip'}
            </h2>
            <MhdTripForm
              companyId={companyId}
              people={peopleOptions}
              presetPersonId={isPrivileged ? null : selfPersonId}
              trip={editingTrip}
              onSubmit={handleTripSubmit}
              onCancel={() => {
                setIsRecording(false);
                setEditingTrip(null);
              }}
              isSubmitting={recordTrip.isPending || updateTrip.isPending}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
