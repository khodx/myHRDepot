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
        className="space-y-2 rounded-md border border-neutral-200 bg-card p-3 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <button
              type="button"
              onClick={() => onOpenApplication?.(application.id)}
              className="text-left text-sm font-medium text-neutral-900 hover:underline"
            >
              {application.personDisplayName}
            </button>
            <div className="font-mono text-xs text-neutral-400">{application.referenceId}</div>
          </div>
          <MhdApplicationStatusBadge lifecycle={application.lifecycle} />
        </div>

        {application.source ? (
          <p className="text-xs text-neutral-500">Source: {application.source}</p>
        ) : null}

        {canManage && application.lifecycle === 'ACTIVE' ? (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={application.currentStageId ?? ''}
              disabled={moveStage.isPending}
              onChange={(event) => void handleMove(application, event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
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
              className="whitespace-nowrap text-xs text-rose-600 underline"
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (stages.isLoading || applications.isLoading) {
    return <p className="text-sm text-neutral-500">Loading pipeline…</p>;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-neutral-900">Pipeline</h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* The Invited column: applicants who have been sent a link but have not
            yet submitted (no stage yet). */}
        {byStage.invited.length > 0 ? (
          <div className="w-72 flex-shrink-0 space-y-2 rounded-lg bg-neutral-50 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-700">Invited</h3>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                {byStage.invited.length}
              </span>
            </div>
            {byStage.invited.map((application) => renderCard(application, stageList))}
          </div>
        ) : null}

        {stageList.map((stage) => {
          const cards = byStage.groups.get(stage.id) ?? [];
          return (
            <div
              key={stage.id}
              className="w-72 flex-shrink-0 space-y-2 rounded-lg bg-neutral-50 p-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-700">{stage.stageName}</h3>
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                  {cards.length}
                </span>
              </div>
              {cards.length === 0 ? (
                <p className="text-xs text-neutral-400">Empty</p>
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
