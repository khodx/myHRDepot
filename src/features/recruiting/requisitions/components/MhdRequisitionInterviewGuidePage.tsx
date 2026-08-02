import { useMemo } from 'react';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRequisitionRecordTabs } from '@/appshell/components/MhdRequisitionRecordTabs';
import { MhdInterviewGuideBuilder } from '../../interviews/components/MhdInterviewGuideBuilder';
import { useMhdRecruitingRequisitions } from '../Hook';
import { MhdRequisitionStatusBadge } from './MhdRequisitionStatusBadge';

interface Props {
  companyId: string;
  requisitionId: string;
  canManage: boolean;
}

/**
 * `/recruiting/requisitions/:reqId/interview-guide` — the Interview Guide tab
 * (package 2): the wizard that derives job-specific interview questions from
 * the requisition's job's published-JD competencies. Privileged only; the
 * route hides this tab entirely for a non-privileged viewer (see
 * `MhdRequisitionRecordTabs`'s `showInterviewGuideTab`), and the RPCs re-check
 * `mhd_recruiting_is_privileged` regardless.
 */
export function MhdRequisitionInterviewGuidePage({ companyId, requisitionId, canManage }: Props) {
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
        active="interview-guide"
        showInterviewGuideTab={canManage}
      />

      <MhdInterviewGuideBuilder
        companyId={companyId}
        requisitionId={requisitionId}
        canManage={canManage}
      />
    </div>
  );
}
