import { useState } from 'react';
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
        <h2 className="text-base font-semibold text-neutral-900">Trips</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {isPrivileged
            ? 'Every recorded journey for the company, and whether it is still available to claim.'
            : 'Your recorded journeys, and whether each one is still available to claim.'}
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        {isPrivileged ? (
          <select
            value={filters.personId ?? ''}
            onChange={(event) =>
              onFiltersChange({ ...filters, personId: event.target.value || null })
            }
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">All travellers</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        ) : null}

        <label className="text-sm text-neutral-700">
          From
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(event) => onFiltersChange({ ...filters, from: event.target.value || null })}
            className="ml-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </label>

        <label className="text-sm text-neutral-700">
          To
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(event) => onFiltersChange({ ...filters, to: event.target.value || null })}
            className="ml-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(filters.unclaimedOnly)}
            onChange={(event) =>
              onFiltersChange({ ...filters, unclaimedOnly: event.target.checked })
            }
            className="h-4 w-4 rounded border-neutral-300"
          />
          Unclaimed only
        </label>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(filters.includeVoided)}
            onChange={(event) =>
              onFiltersChange({ ...filters, includeVoided: event.target.checked })
            }
            className="h-4 w-4 rounded border-neutral-300"
          />
          Include voided
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading trips…</p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-neutral-500">No trips match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Date</th>
                {isPrivileged ? <th className="py-2 pr-4 font-medium">Traveller</th> : null}
                <th className="py-2 pr-4 font-medium">Journey</th>
                <th className="py-2 pr-4 font-medium">Purpose</th>
                <th className="py-2 pr-4 text-right font-medium">Miles</th>
                <th className="py-2 pr-4 text-right font-medium">Reimbursable</th>
                <th className="py-2 pr-4 font-medium">Availability</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const claimable = mhdIsTripClaimable(trip);
                return (
                  <tr
                    key={trip.id}
                    className={`border-b border-neutral-100 align-top ${
                      trip.voidedAt ? 'text-neutral-400 line-through' : 'text-neutral-800'
                    }`}
                  >
                    <td className="py-2 pr-4 whitespace-nowrap">{trip.tripDate}</td>
                    {isPrivileged ? (
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {trip.personDisplayName}
                        {/* Who logged it is part of the record, not a detail. */}
                        {trip.recordedOnBehalf ? (
                          <span className="ml-2 text-xs text-neutral-500">recorded on behalf</span>
                        ) : null}
                      </td>
                    ) : null}
                    <td className="py-2 pr-4">
                      {trip.origin} → {trip.destination}
                    </td>
                    <td className="py-2 pr-4 max-w-xs">{trip.businessPurpose}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {milesFormatter.format(trip.miles)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {milesFormatter.format(trip.reimbursableMiles)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {trip.voidedAt ? (
                        <span className="text-xs text-neutral-500">Voided</span>
                      ) : claimable ? (
                        <span className="text-xs font-medium text-emerald-700">Available</span>
                      ) : (
                        <span className="text-xs text-neutral-600">
                          On a {trip.claimStatus ? mhdFormatClaimStatus(trip.claimStatus) : ''} claim
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {!trip.voidedAt ? (
                        <div className="flex justify-end gap-3">
                          {onEdit && claimable ? (
                            <button
                              type="button"
                              onClick={() => onEdit(trip)}
                              className="text-sm text-neutral-500"
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
                            className="text-sm text-neutral-500"
                          >
                            Void
                          </button>
                        </div>
                      ) : null}

                      {voidingTripId === trip.id ? (
                        <div className="mt-2 space-y-2 text-left">
                          <label
                            htmlFor={`void-reason-${trip.id}`}
                            className="block text-xs font-medium text-neutral-700"
                          >
                            Reason for voiding (required)
                          </label>
                          <textarea
                            id={`void-reason-${trip.id}`}
                            rows={2}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                          />
                          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setVoidingTripId(null)}
                              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => void submitVoid(trip.id)}
                              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Voiding…' : 'Void trip'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
