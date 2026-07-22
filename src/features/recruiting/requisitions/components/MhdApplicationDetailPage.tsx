import { useState } from 'react';
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
export function MhdApplicationDetailPage({
  companyId,
  applicationId,
  canManage,
  onBack,
}: Props) {
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
    return <p className="p-6 text-sm text-neutral-500">Loading application…</p>;
  }

  if (application.isError || !detail) {
    return (
      <div className="p-6">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-sm text-neutral-500 underline">
            ← Back to pipeline
          </button>
        ) : null}
        <p className="mt-4 text-sm text-neutral-500">
          This application could not be found, or you do not have access to it.
        </p>
      </div>
    );
  }

  const canAct = canManage && detail.lifecycle === 'ACTIVE';

  return (
    <div className="space-y-6 p-6">
      {onBack ? (
        <button type="button" onClick={onBack} className="text-sm text-neutral-500 underline">
          ← Back to pipeline
        </button>
      ) : null}

      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-neutral-900">{detail.personDisplayName}</h1>
          <MhdApplicationStatusBadge lifecycle={detail.lifecycle} />
        </div>
        <p className="font-mono text-xs text-neutral-400">{detail.referenceId}</p>
        <p className="text-sm text-neutral-600">Requisition: {detail.requisitionTitle}</p>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Current stage</dt>
          <dd className="text-neutral-800">{detail.stageName ?? 'Not yet in a stage'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Lifecycle</dt>
          <dd className="text-neutral-800">{mhdFormatApplicationLifecycle(detail.lifecycle)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Source</dt>
          <dd className="text-neutral-800">{detail.source ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Desired pay rate</dt>
          <dd className="text-neutral-800">{formatPayRate(detail.desiredPayRate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Available from</dt>
          <dd className="text-neutral-800">{formatDate(detail.availabilityDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Employment type</dt>
          <dd className="text-neutral-800">{detail.employmentTypeDesired ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Invited</dt>
          <dd className="text-neutral-800">{formatDateTime(detail.invitedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Submitted</dt>
          <dd className="text-neutral-800">{formatDateTime(detail.submittedAt)}</dd>
        </div>
      </dl>

      {detail.coverNote ? (
        <section>
          <h2 className="text-sm font-semibold text-neutral-700">Cover note</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{detail.coverNote}</p>
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
        <h2 className="text-sm font-semibold text-neutral-700">Stage history</h2>
        {history.isLoading ? (
          <p className="mt-1 text-sm text-neutral-500">Loading history…</p>
        ) : (history.data ?? []).length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">No stage changes recorded yet.</p>
        ) : (
          <ol className="mt-2 space-y-2 border-l border-neutral-200 pl-4">
            {(history.data ?? []).map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-neutral-300" />
                <div className="text-sm text-neutral-800">
                  {entry.fromStageName ? `${entry.fromStageName} → ` : ''}
                  {entry.toStageName ?? '—'}
                </div>
                {entry.note ? <div className="text-xs text-neutral-500">{entry.note}</div> : null}
                <div className="text-xs text-neutral-400">{formatDateTime(entry.movedAt)}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {canAct ? (
        <section className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="appStage" className="text-sm text-neutral-600">
              Move to stage
            </label>
            <select
              id="appStage"
              value={detail.currentStageId ?? ''}
              disabled={moveStage.isPending}
              onChange={(event) => void handleMove(event.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
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
            className="rounded-md border border-rose-300 bg-white px-4 py-1.5 text-sm font-medium text-rose-700"
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
