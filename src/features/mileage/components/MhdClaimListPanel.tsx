import {
  MHD_MILEAGE_CLAIM_STATUSES,
  mhdFormatClaimStatus,
  type MhdMileageClaimFilters,
  type MhdMileageClaimSummary,
} from '../Types';
import { MhdClaimStatusBadge } from './MhdClaimStatusBadge';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  claims: MhdMileageClaimSummary[];
  filters: MhdMileageClaimFilters;
  onFiltersChange: (filters: MhdMileageClaimFilters) => void;
  people: PersonOption[];
  isPrivileged: boolean;
  selectedClaimId?: string | null;
  isLoading?: boolean;
  onSelect: (claimId: string) => void;
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
});

/**
 * Claims and their totals.
 *
 * A total only exists once a claim has been approved — before that the server
 * stores none, because the figure would move every time a rate or a policy did.
 * The column therefore reads "not yet priced" rather than showing a zero, which
 * would be indistinguishable from a claim genuinely worth nothing.
 */
export function MhdClaimListPanel({
  claims,
  filters,
  onFiltersChange,
  people,
  isPrivileged,
  selectedClaimId,
  isLoading = false,
  onSelect,
}: Props) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-neutral-900">Claims</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {isPrivileged
            ? 'Batched claims across the company.'
            : 'Your claims and where each one has reached.'}
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        {isPrivileged ? (
          <select
            value={filters.personId ?? ''}
            onChange={(event) =>
              onFiltersChange({ ...filters, personId: event.target.value || null })
            }
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">All claimants</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        ) : null}

        <select
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as MhdMileageClaimFilters['status'],
            })
          }
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {MHD_MILEAGE_CLAIM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatClaimStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading claims…</p>
      ) : claims.length === 0 ? (
        <p className="text-sm text-neutral-500">No claims match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Reference</th>
                {isPrivileged ? <th className="py-2 pr-4 font-medium">Claimant</th> : null}
                <th className="py-2 pr-4 font-medium">Period</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 text-right font-medium">Lines</th>
                <th className="py-2 pr-4 text-right font-medium">Total</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr
                  key={claim.id}
                  className={`border-b border-neutral-100 ${
                    selectedClaimId === claim.id ? 'bg-neutral-50' : ''
                  }`}
                >
                  <td className="py-2 pr-4 whitespace-nowrap font-medium text-neutral-900">
                    {claim.referenceId}
                  </td>
                  {isPrivileged ? (
                    <td className="py-2 pr-4 whitespace-nowrap">{claim.personDisplayName}</td>
                  ) : null}
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {claim.periodStart} — {claim.periodEnd}
                  </td>
                  <td className="py-2 pr-4">
                    <MhdClaimStatusBadge status={claim.status} />
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{claim.lineCount}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {claim.totalCompanyAmount == null ? (
                      <span className="text-xs text-neutral-500">not yet priced</span>
                    ) : (
                      currencyFormatter.format(claim.totalCompanyAmount)
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(claim.id)}
                      className="text-sm text-neutral-500"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
