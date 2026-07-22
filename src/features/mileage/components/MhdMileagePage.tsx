import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  mhdCanManageMileageRates,
  mhdMileageIsPrivileged,
} from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAddTripToClaim,
  useMhdCancelClaim,
  useMhdCreateClaim,
  useMhdConfirmRate,
  useMhdDecideClaim,
  useMhdEffectiveRate,
  useMhdMileageClaim,
  useMhdMileageClaims,
  useMhdMileagePeople,
  useMhdMileageRates,
  useMhdMileageTrips,
  useMhdProposeRate,
  useMhdRecordTrip,
  useMhdSetCompanyRatePolicy,
  useMhdSubmitClaim,
  useMhdUpdateTrip,
  useMhdVoidTrip,
} from '../Hook';
import {
  mhdClaimPeriodSchema,
  type MhdClaimDecisionFormValues,
  type MhdClaimPeriodFormValues,
  type MhdCompanyRatePolicyFormValues,
  type MhdRateProposalFormValues,
  type MhdTripFormValues,
} from '../Schemas';
import {
  mhdIsTripClaimable,
  type MhdMileageClaimFilters,
  type MhdMileageRateFilters,
  type MhdMileageTrip,
  type MhdMileageTripFilters,
} from '../Types';
import { MhdClaimDetailPanel } from './MhdClaimDetailPanel';
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
        <p className="text-sm text-neutral-500">Loading mileage…</p>
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
  const [tab, setTab] = useState<Tab>('trips');
  const [editingTrip, setEditingTrip] = useState<MhdMileageTrip | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

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
  const claimDetail = useMhdMileageClaim(selectedClaimId);
  const rates = useMhdMileageRates(rateFilters);
  const effectiveRate = useMhdEffectiveRate(companyId);
  const people = useMhdMileagePeople(isPrivileged ? companyId : null);

  const recordTrip = useMhdRecordTrip();
  const updateTrip = useMhdUpdateTrip();
  const voidTrip = useMhdVoidTrip();
  const createClaim = useMhdCreateClaim();
  const addTripToClaim = useMhdAddTripToClaim();
  const submitClaim = useMhdSubmitClaim();
  const decideClaim = useMhdDecideClaim();
  const cancelClaim = useMhdCancelClaim();
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

  const openClaim = claimDetail.data ?? null;

  // Trips a DRAFT claim can still take: inside its period, belonging to its
  // claimant, and not already spoken for. The database guarantees the rule with
  // a unique index; offering only eligible rows is what keeps the user from
  // meeting it as a save error.
  const addableTrips = useMemo(() => {
    if (!openClaim || openClaim.status !== 'DRAFT') return [];
    return (trips.data ?? []).filter(
      (trip) =>
        trip.personId === openClaim.personId &&
        trip.tripDate >= openClaim.periodStart &&
        trip.tripDate <= openClaim.periodEnd &&
        mhdIsTripClaimable(trip),
    );
  }, [openClaim, trips.data]);

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
    setSelectedClaimId(created.id);
    setTab('claims');
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

  async function handleDecide(values: MhdClaimDecisionFormValues) {
    await decideClaim.mutateAsync({
      claimId: values.claimId,
      decision: values.decision,
      decisionNote: values.decisionNote ?? null,
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
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Mileage</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {isPrivileged
              ? 'Trips, claims, and the rates they are priced against.'
              : 'Your business travel and the claims you have made for it.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingTrip(null);
              setIsRecording(true);
            }}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50"
          >
            Record trip
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingClaim((open) => !open)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            New claim
          </button>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-neutral-200 text-sm">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-3 py-2 font-medium ${
              tab === value
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {isCreatingClaim ? (
        <form
          onSubmit={claimForm.handleSubmit(handleCreateClaim)}
          className="grid gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-4"
        >
          <div>
            <label htmlFor="claim-person" className="block text-sm font-medium text-neutral-700">
              Claimant
            </label>
            <select
              id="claim-person"
              {...claimForm.register('personId')}
              disabled={!isPrivileged}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
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
            <label htmlFor="period-start" className="block text-sm font-medium text-neutral-700">
              Period start
            </label>
            <input
              id="period-start"
              type="date"
              {...claimForm.register('periodStart')}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {claimForm.formState.errors.periodStart ? (
              <p className="mt-1 text-xs text-rose-600">
                {claimForm.formState.errors.periodStart.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="period-end" className="block text-sm font-medium text-neutral-700">
              Period end
            </label>
            <input
              id="period-end"
              type="date"
              {...claimForm.register('periodEnd')}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {claimForm.formState.errors.periodEnd ? (
              <p className="mt-1 text-xs text-rose-600">
                {claimForm.formState.errors.periodEnd.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={createClaim.isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {createClaim.isPending ? 'Creating…' : 'Create claim'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingClaim(false)}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
            >
              Cancel
            </button>
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
        <div className="space-y-6">
          <MhdClaimListPanel
            claims={claims.data ?? []}
            filters={claimFilters}
            onFiltersChange={setClaimFilters}
            people={peopleOptions}
            isPrivileged={isPrivileged}
            selectedClaimId={selectedClaimId}
            isLoading={claims.isLoading}
            onSelect={setSelectedClaimId}
          />

          {selectedClaimId && openClaim ? (
            <>
              <MhdClaimDetailPanel
                claim={openClaim}
                isPrivileged={isPrivileged}
                isLoading={claimDetail.isLoading}
                isSubmitting={
                  submitClaim.isPending || decideClaim.isPending || cancelClaim.isPending
                }
                onClose={() => setSelectedClaimId(null)}
                onSubmitClaim={(claimId) => submitClaim.mutateAsync(claimId)}
                onDecide={handleDecide}
                onCancelClaim={(input) => cancelClaim.mutateAsync(input)}
              />

              {openClaim.status === 'DRAFT' ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-700">
                    Trips available for this period
                  </h3>
                  {addableTrips.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No unclaimed trips fall inside this claim's period.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm text-neutral-700">
                      {addableTrips.map((trip) => (
                        <li key={trip.id} className="flex items-center justify-between gap-3">
                          <span>
                            {trip.tripDate} · {trip.origin} → {trip.destination} ·{' '}
                            {trip.reimbursableMiles} mi
                          </span>
                          <button
                            type="button"
                            disabled={addTripToClaim.isPending}
                            onClick={() =>
                              void addTripToClaim.mutateAsync({
                                claimId: openClaim.id,
                                tripId: trip.id,
                              })
                            }
                            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}
            </>
          ) : null}
        </div>
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
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">
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
