import { useMemo } from 'react';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRequisitionRecordTabs } from '@/appshell/components/MhdRequisitionRecordTabs';
import { useMhdRecruitingRequisitions } from '../Hook';
import { MhdApplicationInvitePanel } from './MhdApplicationInvitePanel';
import { MhdPipelineBoard } from './MhdPipelineBoard';
import { MhdRequisitionStatusBadge } from './MhdRequisitionStatusBadge';

interface Props {
  companyId: string;
  requisitionId: string;
  canManage: boolean;
  onOpenApplication?: (applicationId: string) => void;
}

/**
 * `/recruiting/requisitions/:reqId/pipeline` — the Pipeline tab: invite an
 * applicant (privileged only) and work the stage board. Split out of
 * `MhdRequisitionDetailPage`, which now covers only the requisition's own
 * fields — see `MhdRequisitionRecordTabs`.
 */
export function MhdRequisitionPipelinePage({
  companyId,
  requisitionId,
  canManage,
  onOpenApplication,
}: Props) {
  const requisitions = useMhdRecruitingRequisitions({ companyId, status: 'ALL' });

  const requisition = useMemo(
    () => (requisitions.data ?? []).find((item) => item.id === requisitionId) ?? null,
    [requisitions.data, requisitionId],
  );

  if (requisitions.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading requisition…</p>;
  }

  if (!requisition) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          backTo="/recruiting"
          backLabel="Requisitions"
          title="Requisition"
          description="This requisition could not be found, or you do not have access to it."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/recruiting/requisitions/${requisitionId}`}
        backLabel="Detail"
        title={requisition.title}
        chips={<MhdRequisitionStatusBadge status={requisition.status} />}
        description={<span className="font-mono">{requisition.referenceId}</span>}
      />

      <MhdRequisitionRecordTabs
        reqId={requisitionId}
        active="pipeline"
        showInterviewGuideTab={canManage}
      />

      {canManage ? (
        <MhdApplicationInvitePanel companyId={companyId} requisitionId={requisitionId} />
      ) : null}

      <MhdPipelineBoard
        companyId={companyId}
        requisitionId={requisitionId}
        canManage={canManage}
        onOpenApplication={onOpenApplication}
      />
    </div>
  );
}
