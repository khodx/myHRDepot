import { useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import {
  useMhdMoveApplicationStage,
  useMhdRecruitingApplication,
  useMhdRecruitingApplicationHistory,
  useMhdRecruitingReasons,
  useMhdRecruitingStages,
  useMhdRejectApplication,
} from '../Hook';
import type { MhdRejectApplicationFormValues } from '../Schemas';
import { mhdFormatApplicationLifecycle } from '../Types';
import { MhdApplicationStatusBadge } from './MhdApplicationStatusBadge';
import { MhdRejectDialog } from './MhdRejectDialog';

interface Props {
  companyId: string;
  applicationId: string;
  canManage: boolean;
  onBack?: () => void;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function formatPayRate(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

/**
 * A single application's detail — its stage, lifecycle, the structured applicant
 * fields (`application_get`), and the append-only stage timeline
 * (`application_history`), plus the move / reject controls.
 *
 * EEO NOTE: this decision surface renders NO EEO self-identification data. Neither
 * `application_get` nor `application_history` carries it — that partition is
 * write-only from the app's perspective (the aggregate report aside).
 */
export function MhdApplicationDetailPage({ companyId, applicationId, canManage, onBack }: Props) {
  const [rejecting, setRejecting] = useState(false);

  const application = useMhdRecruitingApplication(applicationId);
  const history = useMhdRecruitingApplicationHistory(applicationId);
  const stages = useMhdRecruitingStages(companyId);
  const reasons = useMhdRecruitingReasons(companyId);
  const moveStage = useMhdMoveApplicationStage();
  const rejectApplication = useMhdRejectApplication();

  const detail = application.data ?? null;

  async function handleMove(toStageId: string) {
    if (!detail || !toStageId || toStageId === detail.currentStageId) return;
    await moveStage.mutateAsync({ applicationId: detail.id, toStageId });
  }

  async function handleReject(values: MhdRejectApplicationFormValues) {
    await rejectApplication.mutateAsync({
      applicationId: values.applicationId,
      reasonId: values.reasonId || null,
      note: values.note || null,
    });
    setRejecting(false);
  }

  if (application.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading application…</p>;
  }

  if (application.isError || !detail) {
    return (
      <div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            ← Back to pipeline
          </button>
        ) : null}
        <p className="mt-4 text-sm text-muted-foreground">
          This application could not be found, or you do not have access to it.
        </p>
      </div>
    );
  }

  const canAct = canManage && detail.lifecycle === 'ACTIVE';

  return (
    <div className="space-y-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-accent hover:text-accent-hover"
        >
          ← Back to pipeline
        </button>
      ) : null}

      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{detail.personDisplayName}</h1>
          <MhdApplicationStatusBadge lifecycle={detail.lifecycle} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">{detail.referenceId}</p>
        <p className="text-sm text-muted-foreground">Requisition: {detail.requisitionTitle}</p>
      </header>

      <MhdCard>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Current stage</dt>
            <dd className="text-foreground">{detail.stageName ?? 'Not yet in a stage'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Lifecycle</dt>
            <dd className="text-foreground">{mhdFormatApplicationLifecycle(detail.lifecycle)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Source</dt>
            <dd className="text-foreground">{detail.source ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Desired pay rate
            </dt>
            <dd className="text-foreground">{formatPayRate(detail.desiredPayRate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Available from
            </dt>
            <dd className="text-foreground">{formatDate(detail.availabilityDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Employment type
            </dt>
            <dd className="text-foreground">{detail.employmentTypeDesired ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Invited</dt>
            <dd className="text-foreground">{formatDateTime(detail.invitedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Submitted</dt>
            <dd className="text-foreground">{formatDateTime(detail.submittedAt)}</dd>
          </div>
        </dl>
      </MhdCard>

      {detail.coverNote ? (
        <section>
          <h2 className="text-sm font-semibold text-foreground">Cover note</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{detail.coverNote}</p>
        </section>
      ) : null}

      {detail.lifecycle === 'REJECTED' ? (
        <section className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <h2 className="text-sm font-semibold text-rose-800">Rejected</h2>
          <p className="mt-1 text-sm text-rose-700">
            Reason: {detail.rejectionReasonText ?? '—'}
            {detail.rejectionNote ? ` · ${detail.rejectionNote}` : ''}
          </p>
        </section>
      ) : null}

      {/* The append-only stage timeline from `application_history`. */}
      <section>
        <h2 className="text-sm font-semibold text-foreground">Stage history</h2>
        {history.isLoading ? (
          <p className="mt-1 text-sm text-muted-foreground">Loading history…</p>
        ) : (history.data ?? []).length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No stage changes recorded yet.</p>
        ) : (
          <ol className="mt-2 space-y-2 border-l border-border pl-4">
            {(history.data ?? []).map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-border" />
                <div className="text-sm text-foreground">
                  {entry.fromStageName ? `${entry.fromStageName} → ` : ''}
                  {entry.toStageName ?? '—'}
                </div>
                {entry.note ? (
                  <div className="text-xs text-muted-foreground">{entry.note}</div>
                ) : null}
                <div className="text-xs text-muted-foreground">{formatDateTime(entry.movedAt)}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {canAct ? (
        <section className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="appStage" className="text-sm text-muted-foreground">
              Move to stage
            </label>
            <select
              id="appStage"
              value={detail.currentStageId ?? ''}
              disabled={moveStage.isPending}
              onChange={(event) => void handleMove(event.target.value)}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {(stages.data ?? []).map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.stageName}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="rounded-md border border-rose-300 bg-card px-4 py-1.5 text-sm font-medium text-rose-700"
          >
            Reject
          </button>
        </section>
      ) : null}

      {rejecting ? (
        <MhdRejectDialog
          application={detail}
          reasons={reasons.data ?? []}
          onSubmit={handleReject}
          onCancel={() => setRejecting(false)}
          isSubmitting={rejectApplication.isPending}
        />
      ) : null}
    </div>
  );
}
