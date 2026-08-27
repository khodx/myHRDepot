import { useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdApplicationRecordTabs } from '@/appshell/components/MhdApplicationRecordTabs';
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
}

function formatDateTime(value: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function formatPayRate(value: number | null): string {
  if (value == null) return '';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

/**
 * `/recruiting/applications/:appId` — the Detail tab: the applicant's
 * structured fields (`application_get`), the append-only stage timeline
 * (`application_history`), and the move / reject controls. Interviews,
 * evaluation, and the offer/hire handoff now live on their own routed tabs —
 * see `MhdApplicationRecordTabs`.
 *
 * EEO NOTE: this decision surface renders NO EEO self-identification data. Neither
 * `application_get` nor `application_history` carries it — that partition is
 * write-only from the app's perspective (the aggregate report aside).
 */
export function MhdApplicationDetailPage({ companyId, applicationId, canManage }: Props) {
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
      <div className="space-y-6">
        <MhdPageHeader
          backTo="/recruiting"
          backLabel="Requisitions"
          title="Application"
          description="This application could not be found, or you do not have access to it."
        />
      </div>
    );
  }

  const canAct = canManage && detail.lifecycle === 'ACTIVE';

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/recruiting/requisitions/${detail.requisitionId}/pipeline`}
        backLabel="Pipeline"
        title={detail.personDisplayName}
        chips={<MhdApplicationStatusBadge lifecycle={detail.lifecycle} />}
        description={
          <>
            <span className="font-mono">{detail.referenceId}</span> · Requisition:{' '}
            {detail.requisitionTitle}
          </>
        }
      />

      <MhdApplicationRecordTabs appId={applicationId} active="detail" showOfferTab={canManage} />

      <MhdCard>
        <dl className="space-y-4 text-sm">
          <MhdDetailField label="Current stage" value={detail.stageName} />
          <MhdDetailField label="Lifecycle" value={mhdFormatApplicationLifecycle(detail.lifecycle)} />
          <MhdDetailField label="Source" value={detail.source} />
          <MhdDetailField label="Desired pay rate" value={formatPayRate(detail.desiredPayRate)} />
          <MhdDetailField label="Available from" value={formatDate(detail.availabilityDate)} />
          <MhdDetailField label="Employment type" value={detail.employmentTypeDesired} />
          <MhdDetailField label="Invited" value={formatDateTime(detail.invitedAt)} />
          <MhdDetailField label="Submitted" value={formatDateTime(detail.submittedAt)} />
        </dl>
      </MhdCard>

      <section>
        <h2 className="text-sm font-semibold text-foreground">Cover note</h2>
        <MhdDetailField label="Cover note" value={detail.coverNote} className="mt-2" />
      </section>

      {detail.lifecycle === 'REJECTED' ? (
        <section className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <h2 className="text-sm font-semibold text-rose-800">Rejected</h2>
          <dl className="mt-2 space-y-3 text-sm text-rose-700">
            <MhdDetailField label="Reason" value={detail.rejectionReasonText} />
            <MhdDetailField label="Note" value={detail.rejectionNote} />
          </dl>
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
