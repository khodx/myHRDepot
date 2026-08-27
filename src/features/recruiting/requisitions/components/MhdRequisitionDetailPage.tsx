import { useMemo } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRequisitionRecordTabs } from '@/appshell/components/MhdRequisitionRecordTabs';
import { useMhdRecruitingRequisitions, useMhdTransitionRequisition } from '../Hook';
import {
  MHD_RECRUITING_REQUISITION_STATUSES,
  mhdFormatRequisitionStatus,
  type MhdRecruitingRequisitionStatus,
} from '../Types';
import { MhdRequisitionStatusBadge } from './MhdRequisitionStatusBadge';

interface Props {
  companyId: string;
  requisitionId: string;
  canManage: boolean;
}

/**
 * `/recruiting/requisitions/:reqId` — the Detail tab: the requisition's own
 * fields and its status transition. The invite panel + pipeline board moved
 * to the Pipeline tab (`MhdRequisitionPipelinePage`); the interview guide
 * builder moved to the Interview Guide tab (`MhdRequisitionInterviewGuidePage`)
 * — see `MhdRequisitionRecordTabs`.
 *
 * FORCED DEVIATION: package 1 exposes no `requisition_get` RPC, so the record is
 * located inside the company's `requisition_list` by id (RLS already narrows the
 * list to what the caller may see). If a future package adds a single-get, swap
 * this lookup for it. Status transitions go through `requisition_transition`; the
 * approval gate for OPEN is orchestrated app-layer.
 */
export function MhdRequisitionDetailPage({ companyId, requisitionId, canManage }: Props) {
  const requisitions = useMhdRecruitingRequisitions({ companyId, status: 'ALL' });
  const transition = useMhdTransitionRequisition();

  const requisition = useMemo(
    () => (requisitions.data ?? []).find((item) => item.id === requisitionId) ?? null,
    [requisitions.data, requisitionId],
  );

  async function handleTransition(newStatus: MhdRecruitingRequisitionStatus) {
    await transition.mutateAsync({ reqId: requisitionId, newStatus });
  }

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
        backTo="/recruiting"
        backLabel="Requisitions"
        title={requisition.title}
        chips={<MhdRequisitionStatusBadge status={requisition.status} />}
        description={<span className="font-mono">{requisition.referenceId}</span>}
      />

      <MhdRequisitionRecordTabs
        reqId={requisitionId}
        active="detail"
        showInterviewGuideTab={canManage}
      />

      <MhdCard>
        <dl className="space-y-4 text-sm">
          <MhdDetailField label="Hiring manager" value={requisition.hiringManagerName} />
          <MhdDetailField label="Department" value={requisition.department} />
          <MhdDetailField label="Location" value={requisition.location} />
          <MhdDetailField label="Employment type" value={requisition.employmentType} />
          <MhdDetailField label="Headcount" value={requisition.headcount} />
          <MhdDetailField label="Active applicants" value={requisition.openApplicationCount} />
          <MhdDetailField label="Requires approval" value={requisition.requiresApproval ? 'Yes' : 'No'} />
        </dl>
      </MhdCard>

      {canManage ? (
        <MhdCard className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="reqStatus" className="text-sm text-muted-foreground">
              Set status
            </label>
            <select
              id="reqStatus"
              value={requisition.status}
              disabled={transition.isPending}
              onChange={(event) =>
                void handleTransition(event.target.value as MhdRecruitingRequisitionStatus)
              }
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {MHD_RECRUITING_REQUISITION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {mhdFormatRequisitionStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </MhdCard>
      ) : null}
    </div>
  );
}
