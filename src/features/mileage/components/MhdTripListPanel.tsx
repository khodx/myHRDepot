import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  mhdFormatClaimStatus,
  mhdIsTripClaimable,
  type MhdMileageTrip,
  type MhdMileageTripFilters,
  type MhdVoidTripInput,
} from '../Types';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  trips: MhdMileageTrip[];
  filters: MhdMileageTripFilters;
  onFiltersChange: (filters: MhdMileageTripFilters) => void;
  /** Empty for an employee: the person filter is theirs alone and is not shown. */
  people: PersonOption[];
  /** Privileged viewers see the traveller column and may record on behalf. */
  isPrivileged: boolean;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onEdit?: (trip: MhdMileageTrip) => void;
  onVoid: (input: MhdVoidTripInput) => Promise<void>;
}

const milesFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const DATE_INPUT_CLASSES =
  'rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * The trip log.
 *
 * A trip's availability is the column that matters here: a trip already sitting
 * on a live claim cannot go on another one, and the claim builder would fail on
 * a unique index rather than explain itself. So the state is shown in the list —
 * available, or spoken for by a named claim — rather than discovered at save.
 *
 * Voiding takes a reason inline. There are no hard deletes in this module; a
 * voided trip stays readable and the reason is part of the record.
 */
export function MhdTripListPanel({
  trips,
  filters,
  onFiltersChange,
  people,
  isPrivileged,
  isLoading = false,
  isSubmitting = false,
  onEdit,
  onVoid,
}: Props) {
  const [voidingTripId, setVoidingTripId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submitVoid(tripId: string) {
    if (!reason.trim()) {
      setError('A reason is required to void a trip.');
      return;
    }
    setError(null);
    await onVoid({ tripId, reason: reason.trim() });
    setVoidingTripId(null);
    setReason('');
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-foreground">Trips</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPrivileged
            ? 'Every recorded journey for the company, and whether it is still available to claim.'
            : 'Your recorded journeys, and whether each one is still available to claim.'}
        </p>
      </header>

      <MhdCard className="flex flex-wrap items-end gap-3">
        {isPrivileged ? (
          <MhdFilterSelect
            label="Traveller"
            value={filters.personId ?? ''}
            onChange={(event) =>
              onFiltersChange({ ...filters, personId: event.target.value || null })
            }
          >
            <option value="">All travellers</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </MhdFilterSelect>
        ) : null}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <MhdDateField
            value={filters.from ?? ''}
            onChange={(nextValue) => onFiltersChange({ ...filters, from: nextValue || null })}
            className={DATE_INPUT_CLASSES}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <MhdDateField
            value={filters.to ?? ''}
            onChange={(nextValue) => onFiltersChange({ ...filters, to: nextValue || null })}
            className={DATE_INPUT_CLASSES}
          />
        </label>

        <label className="flex items-center gap-2 pb-1.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={Boolean(filters.unclaimedOnly)}
            onChange={(event) =>
              onFiltersChange({ ...filters, unclaimedOnly: event.target.checked })
            }
            className="h-4 w-4 rounded border-border"
          />
          Unclaimed only
        </label>

        <label className="flex items-center gap-2 pb-1.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={Boolean(filters.includeVoided)}
            onChange={(event) =>
              onFiltersChange({ ...filters, includeVoided: event.target.checked })
            }
            className="h-4 w-4 rounded border-border"
          />
          Include voided
        </label>
      </MhdCard>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading trips…</p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trips match these filters.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Date</MhdTh>
                {isPrivileged ? <MhdTh>Traveller</MhdTh> : null}
                <MhdTh>Journey</MhdTh>
                <MhdTh>Purpose</MhdTh>
                <MhdTh className="text-right">Miles</MhdTh>
                <MhdTh className="text-right">Reimbursable</MhdTh>
                <MhdTh>Availability</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const claimable = mhdIsTripClaimable(trip);
                return (
                  <MhdTr
                    key={trip.id}
                    className={trip.voidedAt ? 'text-muted-foreground line-through' : undefined}
                  >
                    <MhdTd className="whitespace-nowrap align-top">{trip.tripDate}</MhdTd>
                    {isPrivileged ? (
                      <MhdTd className="whitespace-nowrap align-top">
                        {trip.personDisplayName}
                        {/* Who logged it is part of the record, not a detail. */}
                        {trip.recordedOnBehalf ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            recorded on behalf
                          </span>
                        ) : null}
                      </MhdTd>
                    ) : null}
                    <MhdTd className="align-top">
                      {trip.origin} → {trip.destination}
                    </MhdTd>
                    <MhdTd className="max-w-xs align-top">{trip.businessPurpose}</MhdTd>
                    <MhdTd className="text-right align-top tabular-nums">
                      {milesFormatter.format(trip.miles)}
                    </MhdTd>
                    <MhdTd className="text-right align-top tabular-nums">
                      {milesFormatter.format(trip.reimbursableMiles)}
                    </MhdTd>
                    <MhdTd className="whitespace-nowrap align-top">
                      {trip.voidedAt ? (
                        <span className="text-xs text-muted-foreground">Voided</span>
                      ) : claimable ? (
                        <span className="text-xs font-medium text-emerald-700">Available</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          On a {trip.claimStatus ? mhdFormatClaimStatus(trip.claimStatus) : ''}{' '}
                          claim
                        </span>
                      )}
                    </MhdTd>
                    <MhdTd className="whitespace-nowrap text-right align-top">
                      {!trip.voidedAt ? (
                        <div className="flex justify-end gap-3">
                          {onEdit && claimable ? (
                            <button
                              type="button"
                              onClick={() => onEdit(trip)}
                              className="text-sm font-medium text-accent hover:text-accent-hover"
                            >
                              Edit
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setVoidingTripId(trip.id);
                              setReason('');
                              setError(null);
                            }}
                            className="text-sm font-medium text-accent hover:text-accent-hover"
                          >
                            Void
                          </button>
                        </div>
                      ) : null}

                      {voidingTripId === trip.id ? (
                        <div className="mt-2 space-y-2 text-left">
                          <label
                            htmlFor={`void-reason-${trip.id}`}
                            className="block text-xs font-medium text-foreground"
                          >
                            Reason for voiding (required)
                          </label>
                          <textarea
                            id={`void-reason-${trip.id}`}
                            rows={2}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className="w-64 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="px-3 py-1.5"
                              onClick={() => setVoidingTripId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="px-3 py-1.5"
                              disabled={isSubmitting}
                              onClick={() => void submitVoid(trip.id)}
                            >
                              {isSubmitting ? 'Voiding…' : 'Void trip'}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </MhdTd>
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </section>
  );
}
