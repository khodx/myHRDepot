import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdGrievances } from '../Hook';
import { MHD_GRIEVANCE_STATUSES, mhdFormatGrievanceStatus, type MhdGrievanceStatus } from '../Types';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function statusVariant(status: MhdGrievanceStatus) {
  if (status === 'RESOLVED') return 'success' as const;
  if (status === 'WITHDRAWN' || status === 'REJECTED_NOT_GRIEVABLE') return 'neutral' as const;
  return 'warning' as const;
}

type FilterValue = 'OPEN' | 'ALL' | MhdGrievanceStatus;

export function MhdGrievancesPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const [filter, setFilter] = useState<FilterValue>('OPEN');
  const status = filter === 'OPEN' || filter === 'ALL' ? null : filter;
  const grievances = useMhdGrievances({ companyId, status });

  // The RPC filters by an exact status or returns everything (p_status null); "Open"
  // has no server-side equivalent, so it's applied client-side over the unfiltered set.
  const CLOSED_STATUSES: MhdGrievanceStatus[] = ['RESOLVED', 'WITHDRAWN', 'REJECTED_NOT_GRIEVABLE'];
  const rows =
    filter === 'OPEN'
      ? (grievances.data ?? []).filter((row) => !CLOSED_STATUSES.includes(row.status))
      : grievances.data ?? [];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Grievances"
        description="Review and resolve grievances filed by employees under the Dispute Resolution Policy."
      />
      <div className="flex items-center gap-3">
        <label htmlFor="grievance-filter" className="text-sm font-medium">Status</label>
        <select
          id="grievance-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as FilterValue)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="OPEN">Open</option>
          <option value="ALL">All</option>
          {MHD_GRIEVANCE_STATUSES.map((value) => (
            <option key={value} value={value}>{mhdFormatGrievanceStatus(value)}</option>
          ))}
        </select>
      </div>

      {grievances.error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage(grievances.error, 'Unable to load grievances.')}
        </div>
      ) : null}

      {grievances.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <MhdCard><p className="text-sm text-muted-foreground">No grievances match this filter.</p></MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Employee</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Submitted</MhdTh>
                <MhdTh>Harassment-related</MhdTh>
                <MhdTh>Actions</MhdTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((grievance) => (
                <MhdTr key={grievance.id}>
                  <MhdTd className="font-mono text-xs">{grievance.referenceId}</MhdTd>
                  <MhdTd className="font-medium">{grievance.personDisplayName}</MhdTd>
                  <MhdTd><MhdBadge variant={statusVariant(grievance.status)} hideIcon>{mhdFormatGrievanceStatus(grievance.status)}</MhdBadge></MhdTd>
                  <MhdTd>{dateTime(grievance.submittedAt)}</MhdTd>
                  <MhdTd>{grievance.isHarassmentRelated ? 'Yes' : 'No'}</MhdTd>
                  <MhdTd><Link to={`/grievances/${grievance.id}`} className="text-sm font-medium text-accent">View</Link></MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}

export default MhdGrievancesPage;
