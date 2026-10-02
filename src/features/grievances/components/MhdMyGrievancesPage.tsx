import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdMyGrievances, useMhdWithdrawGrievance } from '../Hook';
import { mhdFormatGrievanceStatus, type MhdGrievanceStatus, type MhdMyGrievance } from '../Types';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ServerError({ message }: { message: string | null }) {
  return message ? (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      {message}
    </div>
  ) : null;
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

const OPEN_STATUSES: MhdGrievanceStatus[] = ['SUBMITTED', 'ACKNOWLEDGED', 'IN_REVIEW', 'REFERRED'];

function statusVariant(status: MhdGrievanceStatus) {
  if (status === 'RESOLVED') return 'success' as const;
  if (status === 'WITHDRAWN' || status === 'REJECTED_NOT_GRIEVABLE') return 'neutral' as const;
  return 'warning' as const;
}

function MyGrievanceRow({
  grievance,
  onError,
}: {
  grievance: MhdMyGrievance;
  onError: (message: string) => void;
}) {
  const withdraw = useMhdWithdrawGrievance();
  const canWithdraw = OPEN_STATUSES.includes(grievance.status);

  async function handleWithdraw() {
    if (!window.confirm('Withdraw this grievance? This cannot be undone.')) return;
    onError('');
    try {
      await withdraw.mutateAsync(grievance.id);
    } catch (error) {
      onError(errorMessage(error, 'Unable to withdraw the grievance.'));
    }
  }

  return (
    <li className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{grievance.referenceId}</p>
        <MhdBadge variant={statusVariant(grievance.status)} hideIcon>
          {mhdFormatGrievanceStatus(grievance.status)}
        </MhdBadge>
      </div>
      <p className="text-xs text-muted-foreground">Submitted {dateTime(grievance.submittedAt)}</p>
      {grievance.referredToProcess ? (
        <p className="text-xs text-muted-foreground">Referred to: {grievance.referredToProcess}</p>
      ) : null}
      {canWithdraw ? (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="text-red-700"
            disabled={withdraw.isPending}
            onClick={() => void handleWithdraw()}
          >
            {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export function MhdMyGrievancesPage() {
  const { profile } = useMhdAuth();
  const personId = profile?.personId ?? null;
  const [error, setError] = useState<string | null>(null);
  const grievances = useMhdMyGrievances(personId);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="My Grievance"
        description="File a written grievance, or check the status of one you've already filed."
        actions={
          personId ? (
            <Link
              to="/my-grievances/new"
              className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              File A Grievance
            </Link>
          ) : undefined
        }
      />
      <ServerError
        message={
          error ??
          (grievances.error
            ? errorMessage(grievances.error, 'Unable to load your grievances.')
            : null)
        }
      />

      {grievances.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (grievances.data ?? []).length === 0 ? (
        <MhdCard>
          <p className="text-sm text-muted-foreground">You have not filed a grievance.</p>
        </MhdCard>
      ) : (
        <ul className="space-y-2">
          {(grievances.data ?? []).map((grievance) => (
            <MyGrievanceRow key={grievance.id} grievance={grievance} onError={setError} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default MhdMyGrievancesPage;
