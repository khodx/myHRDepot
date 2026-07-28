import { useMemo, useState } from 'react';
import {
  useMhdMoveApplicationStage,
  useMhdRecruitingApplications,
  useMhdRecruitingReasons,
  useMhdRecruitingStages,
  useMhdRejectApplication,
} from '../Hook';
import type { MhdRejectApplicationFormValues } from '../Schemas';
import type { MhdRecruitingApplication, MhdRecruitingStage } from '../Types';
import { MhdApplicationStatusBadge } from './MhdApplicationStatusBadge';
import { MhdRejectDialog } from './MhdRejectDialog';

interface Props {
  companyId: string;
  requisitionId: string;
  /**
   * Whether the viewer may move / reject. A hiring manager can VIEW the board but
   * the move / reject RPCs are privileged-only — they re-check regardless, so this
   * only governs affordances.
   */
  canManage: boolean;
  /** Open a single application's detail. */
  onOpenApplication?: (applicationId: string) => void;
}

/**
 * The pipeline board — applications grouped into columns by `current_stage_id`,
 * using the company's stages from `stage_list`. A move calls `move_stage` (which
 * syncs the lifecycle from the destination stage's category server-side); reject
 * is the inline `MhdRejectDialog` with a reason from `reason_list` — never a
 * `window.prompt`.
 *
 * EEO NOTE: nothing on this board — or anywhere in the recruiter/HM UI — renders
 * EEO self-identification. That partition is write-only from the app's
 * perspective; its sole read surface is the Platform-Admin aggregate report.
 */
export function MhdPipelineBoard({
  companyId,
  requisitionId,
  canManage,
  onOpenApplication,
}: Props) {
  const [rejecting, setRejecting] = useState<MhdRecruitingApplication | null>(null);

  const stages = useMhdRecruitingStages(companyId);
  const applications = useMhdRecruitingApplications({ requisitionId });
  const reasons = useMhdRecruitingReasons(companyId);
  const moveStage = useMhdMoveApplicationStage();
  const rejectApplication = useMhdRejectApplication();

  const stageList = useMemo(() => stages.data ?? [], [stages.data]);

  // Group applications by their current stage id. An INVITED application has no
  // stage yet (it lands in the first ACTIVE stage only on submit) — collect those
  // into a leading "Invited" column so the recruiter can see who has not applied.
  const byStage = useMemo(() => {
    const groups = new Map<string, MhdRecruitingApplication[]>();
    const invited: MhdRecruitingApplication[] = [];
    for (const application of applications.data ?? []) {
      if (!application.currentStageId) {
        invited.push(application);
        continue;
      }
      const bucket = groups.get(application.currentStageId) ?? [];
      bucket.push(application);
      groups.set(application.currentStageId, bucket);
    }
    return { groups, invited };
  }, [applications.data]);

  async function handleMove(application: MhdRecruitingApplication, toStageId: string) {
    if (!toStageId || toStageId === application.currentStageId) return;
    await moveStage.mutateAsync({ applicationId: application.id, toStageId });
  }

  async function handleReject(values: MhdRejectApplicationFormValues) {
    await rejectApplication.mutateAsync({
      applicationId: values.applicationId,
      reasonId: values.reasonId || null,
      note: values.note || null,
    });
    setRejecting(null);
  }

  function renderCard(application: MhdRecruitingApplication, stages: MhdRecruitingStage[]) {
    return (
      <div
        key={application.id}
        className="space-y-1.5 rounded-md border border-border bg-card p-2 shadow-sm"
      >
        <div className="flex items-start justify-between gap-1.5">
          <button
            type="button"
            onClick={() => onOpenApplication?.(application.id)}
            className="truncate text-left text-xs font-medium text-accent hover:text-accent-hover"
          >
            {application.personDisplayName}
          </button>
          <MhdApplicationStatusBadge lifecycle={application.lifecycle} />
        </div>

        <p className="truncate text-[11px] text-muted-foreground">
          {application.referenceId}
          {application.source ? ` · ${application.source}` : ''}
        </p>

        {canManage && application.lifecycle === 'ACTIVE' ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            <select
              value={application.currentStageId ?? ''}
              disabled={moveStage.isPending}
              onChange={(event) => void handleMove(application, event.target.value)}
              className="w-full rounded-md border border-border px-1.5 py-0.5 text-[11px] disabled:opacity-50"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  Move to {stage.stageName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setRejecting(application)}
              className="whitespace-nowrap text-[11px] font-medium text-red-700 hover:text-red-800"
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (stages.isLoading || applications.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading pipeline…</p>;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Pipeline</h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* The Invited column: applicants who have been sent a link but have not
            yet submitted (no stage yet). */}
        {byStage.invited.length > 0 ? (
          <div className="w-72 flex-shrink-0 space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Invited</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {byStage.invited.length}
              </span>
            </div>
            {byStage.invited.map((application) => renderCard(application, stageList))}
          </div>
        ) : null}

        {stageList.map((stage) => {
          const cards = byStage.groups.get(stage.id) ?? [];
          return (
            <div key={stage.id} className="w-72 flex-shrink-0 space-y-2 rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{stage.stageName}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {cards.length}
                </span>
              </div>
              {cards.length === 0 ? (
                <p className="text-xs text-muted-foreground">Empty</p>
              ) : (
                cards.map((application) => renderCard(application, stageList))
              )}
            </div>
          );
        })}
      </div>

      {rejecting ? (
        <MhdRejectDialog
          application={rejecting}
          reasons={reasons.data ?? []}
          onSubmit={handleReject}
          onCancel={() => setRejecting(null)}
          isSubmitting={rejectApplication.isPending}
        />
      ) : null}
    </section>
  );
}
