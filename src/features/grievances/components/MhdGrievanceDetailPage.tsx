import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  useMhdAcknowledgeGrievance,
  useMhdAddGrievanceStep,
  useMhdGrievance,
  useMhdGrievanceIntakeDetail,
  useMhdGrievanceSteps,
  useMhdRejectGrievance,
  useMhdReferGrievance,
  useMhdResolveGrievance,
} from '../Hook';
import {
  MHD_GRIEVANCE_CATEGORY_LABELS,
  mhdFormatGrievanceStatus,
  type MhdGrievanceStatus,
} from '../Types';

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

function statusVariant(status: MhdGrievanceStatus) {
  if (status === 'RESOLVED') return 'success' as const;
  if (status === 'WITHDRAWN' || status === 'REJECTED_NOT_GRIEVABLE') return 'neutral' as const;
  return 'warning' as const;
}

const CLOSED_STATUSES: MhdGrievanceStatus[] = ['WITHDRAWN', 'RESOLVED', 'REJECTED_NOT_GRIEVABLE'];

type ModalKind = 'step' | 'refer' | 'resolve' | 'reject' | null;

function AddStepForm({ grievanceId, nextOrdinal, onClose, onError }: { grievanceId: string; nextOrdinal: number; onClose: () => void; onError: (message: string) => void }) {
  const addStep = useMhdAddGrievanceStep();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const stepName = String(data.get('stepName') ?? '').trim();
    if (!stepName) { onError('A step name is required.'); return; }
    onError('');
    try {
      await addStep.mutateAsync({
        grievanceId,
        stepOrdinal: nextOrdinal,
        stepName,
        stepOutcome: String(data.get('stepOutcome') ?? '').trim() || null,
        stepNotes: String(data.get('stepNotes') ?? '').trim() || null,
      });
      onClose();
    } catch (error) { onError(errorMessage(error, 'Unable to record the step.')); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <MhdFormFieldStack>
        <div><label htmlFor="step-name">Step name</label><input id="step-name" name="stepName" className={fieldClass} placeholder="e.g. Met with supervisor" /></div>
        <div><label htmlFor="step-outcome">Outcome (optional)</label><input id="step-outcome" name="stepOutcome" className={fieldClass} /></div>
        <div><label htmlFor="step-notes">Notes (optional)</label><textarea id="step-notes" name="stepNotes" rows={3} className={fieldClass} /></div>
      </MhdFormFieldStack>
      <div className="flex justify-end"><Button type="submit" disabled={addStep.isPending}>{addStep.isPending ? 'Saving…' : 'Record Step'}</Button></div>
    </form>
  );
}

function ReferForm({ grievanceId, onClose, onError }: { grievanceId: string; onClose: () => void; onError: (message: string) => void }) {
  const refer = useMhdReferGrievance();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const referredToProcess = String(new FormData(event.currentTarget).get('referredToProcess') ?? '').trim();
    if (!referredToProcess) { onError('State the process this is being referred to.'); return; }
    onError('');
    try { await refer.mutateAsync({ grievanceId, referredToProcess }); onClose(); }
    catch (error) { onError(errorMessage(error, 'Unable to refer the grievance.')); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <MhdFormFieldStack>
        <div><label htmlFor="refer-process">Referred to</label><input id="refer-process" name="referredToProcess" className={fieldClass} placeholder="e.g. Harassment Policy Investigation" /></div>
      </MhdFormFieldStack>
      <div className="flex justify-end"><Button type="submit" disabled={refer.isPending}>{refer.isPending ? 'Referring…' : 'Refer Grievance'}</Button></div>
    </form>
  );
}

function ResolveForm({ grievanceId, onClose, onError }: { grievanceId: string; onClose: () => void; onError: (message: string) => void }) {
  const resolve = useMhdResolveGrievance();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resolution = String(new FormData(event.currentTarget).get('resolution') ?? '').trim();
    if (!resolution) { onError('A resolution statement is required.'); return; }
    onError('');
    try { await resolve.mutateAsync({ grievanceId, resolution }); onClose(); }
    catch (error) { onError(errorMessage(error, 'Unable to resolve the grievance.')); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <MhdFormFieldStack>
        <div><label htmlFor="resolve-text">Resolution</label><textarea id="resolve-text" name="resolution" rows={4} className={fieldClass} /></div>
      </MhdFormFieldStack>
      <div className="flex justify-end"><Button type="submit" disabled={resolve.isPending}>{resolve.isPending ? 'Resolving…' : 'Resolve And Close'}</Button></div>
    </form>
  );
}

function RejectForm({ grievanceId, onClose, onError }: { grievanceId: string; onClose: () => void; onError: (message: string) => void }) {
  const reject = useMhdRejectGrievance();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    if (!reason) { onError('A stated reason is required.'); return; }
    onError('');
    try { await reject.mutateAsync({ grievanceId, reason }); onClose(); }
    catch (error) { onError(errorMessage(error, 'Unable to reject the grievance.')); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <MhdFormFieldStack>
        <p className="text-xs text-muted-foreground">Per policy, an oral reprimand not recorded in the personnel file is not grievable. State the reason for this rejection.</p>
        <div><label htmlFor="reject-reason">Reason</label><textarea id="reject-reason" name="reason" rows={3} className={fieldClass} /></div>
      </MhdFormFieldStack>
      <div className="flex justify-end"><Button type="submit" disabled={reject.isPending} className="bg-red-700 hover:bg-red-800">{reject.isPending ? 'Rejecting…' : 'Reject — Not Grievable'}</Button></div>
    </form>
  );
}

export function MhdGrievanceDetailPage() {
  const { grievanceId = '' } = useParams<{ grievanceId: string }>();
  const [modal, setModal] = useState<ModalKind>(null);
  const [error, setError] = useState<string | null>(null);
  const grievance = useMhdGrievance(grievanceId || null);
  const steps = useMhdGrievanceSteps(grievanceId || null);
  const intake = useMhdGrievanceIntakeDetail(grievanceId || null);
  const acknowledge = useMhdAcknowledgeGrievance();

  const detail = grievance.data;
  const isClosed = detail ? CLOSED_STATUSES.includes(detail.status) : false;
  const canAcknowledge = detail ? ['SUBMITTED', 'REFERRED'].includes(detail.status) : false;

  async function handleAcknowledge() {
    setError(null);
    try { await acknowledge.mutateAsync(grievanceId); } catch (caught) { setError(errorMessage(caught, 'Unable to acknowledge the grievance.')); }
  }

  if (grievance.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (grievance.error || !detail) {
    return <ServerError message={errorMessage(grievance.error, 'Grievance not found.')} />;
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={`Grievance ${detail.referenceId}`}
        description="Review and resolve this grievance under the Dispute Resolution Policy."
        actions={<MhdBadge variant={statusVariant(detail.status)} hideIcon>{mhdFormatGrievanceStatus(detail.status)}</MhdBadge>}
      />
      <ServerError message={error} />

      {detail.isHarassmentRelated ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This grievance was flagged as harassment-related and routed to the Harassment Policy process. This record holds only the intake and the referral, not the investigation.
        </div>
      ) : null}

      <MhdCard className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-sm text-muted-foreground">Who</p><p>{detail.grievanceWho ?? '—'}</p></div>
          <div><p className="text-sm text-muted-foreground">Where</p><p>{detail.grievanceWhere ?? '—'}</p></div>
          <div><p className="text-sm text-muted-foreground">When</p><p>{dateTime(detail.grievanceWhen)}</p></div>
          <div><p className="text-sm text-muted-foreground">Submitted</p><p>{dateTime(detail.submittedAt)}</p></div>
        </div>
        <div><p className="text-sm text-muted-foreground">What happened</p><p className="whitespace-pre-wrap">{detail.grievanceWhat ?? '—'}</p></div>
        {detail.grievanceWhy ? <div><p className="text-sm text-muted-foreground">Why (as stated)</p><p className="whitespace-pre-wrap">{detail.grievanceWhy}</p></div> : null}
        <div><p className="text-sm text-muted-foreground">Why the employee disagrees</p><p className="whitespace-pre-wrap">{detail.disagreementExplanation ?? '—'}</p></div>
        <div><p className="text-sm text-muted-foreground">Remedy requested</p><p className="whitespace-pre-wrap">{detail.remedyRequested ?? '—'}</p></div>
        <div><p className="text-sm text-muted-foreground">Employee signature</p><p>{detail.employeeSignatureName ?? '—'} · {dateTime(detail.employeeSignatureAt)}</p></div>
      </MhdCard>

      {intake.data?.retaliationConcern ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          The employee said they are worried about retaliation for filing this. Protect their confidentiality and follow up promptly.
        </div>
      ) : null}

      {intake.data ? (
        <MhdCard className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Intake detail</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Type of concern</p>
              <p>{intake.data.grievanceCategory ? MHD_GRIEVANCE_CATEGORY_LABELS[intake.data.grievanceCategory] : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Concerns</p>
              <p>{intake.data.personGrievedAgainstName ?? '—'}</p>
            </div>
          </div>
          {intake.data.stepsAlreadyTaken ? (
            <div><p className="text-sm text-muted-foreground">What the employee already tried</p><p className="whitespace-pre-wrap">{intake.data.stepsAlreadyTaken}</p></div>
          ) : null}
          {detail.concernsUnrecordedOralReprimand ? (
            <p className="text-sm text-amber-900">The employee said this concerns an oral reprimand that was not recorded in writing.</p>
          ) : null}
          <div>
            <p className="text-sm text-muted-foreground">Witnesses</p>
            {intake.data.witnesses.length === 0 ? (
              <p>None listed.</p>
            ) : (
              <ul className="list-disc pl-5">
                {intake.data.witnesses.map((witness) => (
                  <li key={witness.id}>{witness.witnessName}{witness.whatTheyKnow ? ` — ${witness.whatTheyKnow}` : ''}</li>
                ))}
              </ul>
            )}
          </div>
        </MhdCard>
      ) : null}

      {detail.referredToInvestigationId ? (
        <MhdCard>
          <p className="text-sm text-muted-foreground">Investigation</p>
          <Link className="text-accent hover:underline" to={`/investigations/${detail.referredToInvestigationId}`}>Open the investigation</Link>
        </MhdCard>
      ) : null}

      {detail.referredToProcess ? (
        <MhdCard><p className="text-sm text-muted-foreground">Referred to</p><p>{detail.referredToProcess} · {dateTime(detail.referredAt)}</p></MhdCard>
      ) : null}
      {detail.resolution ? (
        <MhdCard><p className="text-sm text-muted-foreground">{detail.status === 'REJECTED_NOT_GRIEVABLE' ? 'Rejection reason' : 'Resolution'}</p><p className="whitespace-pre-wrap">{detail.resolution}</p><p className="mt-1 text-xs text-muted-foreground">{dateTime(detail.resolutionAt)}</p></MhdCard>
      ) : null}

      <MhdCard className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Review steps</h2>
        {steps.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (steps.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No steps recorded yet.</p> : (
          <ul className="space-y-2">
            {(steps.data ?? []).map((step) => (
              <li key={step.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{step.stepOrdinal}. {step.stepName}</p>
                <p className="text-xs text-muted-foreground">{step.handledByName ?? 'Unknown'} · {dateTime(step.handledAt)}</p>
                {step.stepOutcome ? <p className="text-sm">Outcome: {step.stepOutcome}</p> : null}
                {step.stepNotes ? <p className="text-sm text-muted-foreground">{step.stepNotes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </MhdCard>

      {!isClosed ? (
        <div className="flex flex-wrap gap-2">
          {canAcknowledge ? <Button onClick={() => void handleAcknowledge()} disabled={acknowledge.isPending}>{acknowledge.isPending ? 'Acknowledging…' : 'Acknowledge'}</Button> : null}
          <Button variant="secondary" onClick={() => { setError(null); setModal('step'); }}>Record Step</Button>
          <Button variant="secondary" onClick={() => { setError(null); setModal('refer'); }}>Refer</Button>
          {!detail.referredToInvestigationId ? (
            <Link
              to={`/investigations/new?sourceType=GRIEVANCE&sourceId=${grievanceId}`}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-950 hover:opacity-80"
            >
              Open An Investigation
            </Link>
          ) : null}
          <Button onClick={() => { setError(null); setModal('resolve'); }}>Resolve</Button>
          <Button variant="ghost" className="text-red-700" onClick={() => { setError(null); setModal('reject'); }}>Reject — Not Grievable</Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">This grievance is closed. No further action is available.</p>
      )}

      {modal === 'step' ? <MhdModal title="Record a review step" onClose={() => setModal(null)}><AddStepForm grievanceId={grievanceId} nextOrdinal={(steps.data ?? []).length + 1} onClose={() => setModal(null)} onError={setError} /></MhdModal> : null}
      {modal === 'refer' ? <MhdModal title="Refer this grievance" onClose={() => setModal(null)}><ReferForm grievanceId={grievanceId} onClose={() => setModal(null)} onError={setError} /></MhdModal> : null}
      {modal === 'resolve' ? <MhdModal title="Resolve this grievance" onClose={() => setModal(null)}><ResolveForm grievanceId={grievanceId} onClose={() => setModal(null)} onError={setError} /></MhdModal> : null}
      {modal === 'reject' ? <MhdModal title="Reject as not grievable" onClose={() => setModal(null)}><RejectForm grievanceId={grievanceId} onClose={() => setModal(null)} onError={setError} /></MhdModal> : null}
    </div>
  );
}

export default MhdGrievanceDetailPage;
