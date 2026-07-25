import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
        <h2 className="text-base font-semibold text-foreground">Claims</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPrivileged
            ? 'Batched claims across the company.'
            : 'Your claims and where each one has reached.'}
        </p>
      </header>

      <MhdCard className="grid gap-3 md:grid-cols-3">
        {isPrivileged ? (
          <MhdFilterSelect
            label="Claimant"
            value={filters.personId ?? ''}
            onChange={(event) =>
              onFiltersChange({ ...filters, personId: event.target.value || null })
            }
          >
            <option value="">All claimants</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </MhdFilterSelect>
        ) : null}

        <MhdFilterSelect
          label="Status"
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as MhdMileageClaimFilters['status'],
            })
          }
        >
          <option value="ALL">All statuses</option>
          {MHD_MILEAGE_CLAIM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatClaimStatus(status)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdCard>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading claims…</p>
      ) : claims.length === 0 ? (
        <p className="text-sm text-muted-foreground">No claims match these filters.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                {isPrivileged ? <MhdTh>Claimant</MhdTh> : null}
                <MhdTh>Period</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh className="text-right">Lines</MhdTh>
                <MhdTh className="text-right">Total</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <MhdTr
                  key={claim.id}
                  onClick={() => onSelect(claim.id)}
                  className={selectedClaimId === claim.id ? 'bg-accent-tint' : undefined}
                >
                  <MhdTd className="whitespace-nowrap font-medium">{claim.referenceId}</MhdTd>
                  {isPrivileged ? (
                    <MhdTd className="whitespace-nowrap">{claim.personDisplayName}</MhdTd>
                  ) : null}
                  <MhdTd className="whitespace-nowrap">
                    {claim.periodStart} — {claim.periodEnd}
                  </MhdTd>
                  <MhdTd>
                    <MhdClaimStatusBadge status={claim.status} />
                  </MhdTd>
                  <MhdTd className="text-right tabular-nums">{claim.lineCount}</MhdTd>
                  <MhdTd className="text-right tabular-nums">
                    {claim.totalCompanyAmount == null ? (
                      <span className="text-xs text-muted-foreground">not yet priced</span>
                    ) : (
                      currencyFormatter.format(claim.totalCompanyAmount)
                    )}
                  </MhdTd>
                  <MhdTd className="text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(claim.id)}
                      className="text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Open
                    </button>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </section>
  );
}
