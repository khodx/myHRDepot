import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdMyGrievances, useMhdSubmitGrievance, useMhdWithdrawGrievance } from '../Hook';
import { mhdFormatGrievanceStatus, type MhdGrievanceStatus, type MhdMyGrievance } from '../Types';

const fieldClass = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ServerError({ message }: { message: string | null }) {
  return message ? (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
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

function SubmitGrievanceForm({
  companyId,
  personId,
  onSaved,
  onError,
}: {
  companyId: string;
  personId: string;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const submit = useMhdSubmitGrievance();
  const [isHarassmentRelated, setIsHarassmentRelated] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const grievanceWhat = String(data.get('grievanceWhat') ?? '').trim();
    const disagreementExplanation = String(data.get('disagreementExplanation') ?? '').trim();
    const remedyRequested = String(data.get('remedyRequested') ?? '').trim();
    const employeeSignatureName = String(data.get('employeeSignatureName') ?? '').trim();
    if (!grievanceWhat || !disagreementExplanation || !remedyRequested || !employeeSignatureName) {
      onError('What happened, why you disagree, the remedy requested, and your signature are all required.');
      return;
    }
    onError('');
    try {
      await submit.mutateAsync({
        companyId,
        personId,
        grievanceWhat,
        disagreementExplanation,
        remedyRequested,
        employeeSignatureName,
        grievanceWho: String(data.get('grievanceWho') ?? '').trim() || null,
        grievanceWhere: String(data.get('grievanceWhere') ?? '').trim() || null,
        grievanceWhy: String(data.get('grievanceWhy') ?? '').trim() || null,
        isHarassmentRelated,
      });
      onSaved();
    } catch (error) {
      onError(errorMessage(error, 'Unable to submit the grievance.'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MhdFormFieldStack>
        <p className="text-sm text-muted-foreground">
          Company policy requires all grievances to be in writing, stating who, what, where, when, and
          why, why you disagree, and the remedy you are requesting, signed and dated.
        </p>
        <div>
          <label htmlFor="grievance-who">Who is this grievance about (optional)</label>
          <input id="grievance-who" name="grievanceWho" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="grievance-what">What happened</label>
          <textarea id="grievance-what" name="grievanceWhat" rows={3} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="grievance-where">Where it happened (optional)</label>
          <input id="grievance-where" name="grievanceWhere" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="grievance-why">Why it happened, if known (optional)</label>
          <textarea id="grievance-why" name="grievanceWhy" rows={2} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="grievance-disagreement">Why you disagree with what happened</label>
          <textarea id="grievance-disagreement" name="disagreementExplanation" rows={3} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="grievance-remedy">The remedy you are requesting</label>
          <textarea id="grievance-remedy" name="remedyRequested" rows={2} className={fieldClass} />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="grievance-harassment"
            type="checkbox"
            checked={isHarassmentRelated}
            onChange={(event) => setIsHarassmentRelated(event.target.checked)}
          />
          <label htmlFor="grievance-harassment" className="text-sm">
            This concerns harassment — route to the Harassment Policy process instead
          </label>
        </div>
        <div>
          <label htmlFor="grievance-signature">Your signature (type your full name)</label>
          <input id="grievance-signature" name="employeeSignatureName" className={fieldClass} />
        </div>
      </MhdFormFieldStack>
      <div className="flex justify-end">
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Submitting…' : 'Submit Grievance'}
        </Button>
      </div>
    </form>
  );
}

function MyGrievanceRow({ grievance, onError }: { grievance: MhdMyGrievance; onError: (message: string) => void }) {
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
          <Button variant="ghost" className="text-red-700" disabled={withdraw.isPending} onClick={() => void handleWithdraw()}>
            {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export function MhdMyGrievancesPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const personId = profile?.personId ?? null;
  const [isFiling, setIsFiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const grievances = useMhdMyGrievances(personId);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="My Grievance"
        description="File a written grievance, or check the status of one you've already filed."
        actions={<Button onClick={() => { setError(null); setIsFiling(true); }}>File A Grievance</Button>}
      />
      <ServerError message={error ?? (grievances.error ? errorMessage(grievances.error, 'Unable to load your grievances.') : null)} />

      {grievances.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (grievances.data ?? []).length === 0 ? (
        <MhdCard><p className="text-sm text-muted-foreground">You have not filed a grievance.</p></MhdCard>
      ) : (
        <ul className="space-y-2">
          {(grievances.data ?? []).map((grievance) => (
            <MyGrievanceRow key={grievance.id} grievance={grievance} onError={setError} />
          ))}
        </ul>
      )}

      {isFiling && personId ? (
        <MhdModal title="File a grievance" onClose={() => setIsFiling(false)}>
          <SubmitGrievanceForm
            companyId={companyId}
            personId={personId}
            onSaved={() => setIsFiling(false)}
            onError={setError}
          />
        </MhdModal>
      ) : null}
    </div>
  );
}

export default MhdMyGrievancesPage;
