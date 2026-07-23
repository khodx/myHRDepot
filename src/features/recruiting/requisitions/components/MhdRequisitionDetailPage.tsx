import { useMemo } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { useMhdRecruitingRequisitions, useMhdTransitionRequisition } from '../Hook';
import {
  MHD_RECRUITING_REQUISITION_STATUSES,
  mhdFormatRequisitionStatus,
  type MhdRecruitingRequisitionStatus,
} from '../Types';
import { MhdApplicationInvitePanel } from './MhdApplicationInvitePanel';
import { MhdPipelineBoard } from './MhdPipelineBoard';
import { MhdRequisitionStatusBadge } from './MhdRequisitionStatusBadge';

interface Props {
  companyId: string;
  requisitionId: string;
  canManage: boolean;
  onBack?: () => void;
  onOpenApplication?: (applicationId: string) => void;
}

/**
 * A requisition's detail + its pipeline board.
 *
 * FORCED DEVIATION: package 1 exposes no `requisition_get` RPC, so the record is
 * located inside the company's `requisition_list` by id (RLS already narrows the
 * list to what the caller may see). If a future package adds a single-get, swap
 * this lookup for it. Status transitions go through `requisition_transition`; the
 * approval gate for OPEN is orchestrated app-layer.
 */
export function MhdRequisitionDetailPage({
  companyId,
  requisitionId,
  canManage,
  onBack,
  onOpenApplication,
}: Props) {
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
      <div>
        {onBack ? (
          <button type="button" onClick={onBack} className="text-sm font-medium text-accent hover:text-accent-hover">
            ← Back to requisitions
          </button>
        ) : null}
        <p className="mt-4 text-sm text-muted-foreground">
          This requisition could not be found, or you do not have access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onBack ? (
        <button type="button" onClick={onBack} className="text-sm font-medium text-accent hover:text-accent-hover">
          ← Back to requisitions
        </button>
      ) : null}

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{requisition.title}</h1>
              <MhdRequisitionStatusBadge status={requisition.status} />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{requisition.referenceId}</p>
          </div>

          {canManage ? (
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
          ) : null}
        </div>

        <MhdCard>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Hiring manager</dt>
            <dd className="text-foreground">{requisition.hiringManagerName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Department</dt>
            <dd className="text-foreground">{requisition.department ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Location</dt>
            <dd className="text-foreground">{requisition.location ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Employment type</dt>
            <dd className="text-foreground">{requisition.employmentType ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Headcount</dt>
            <dd className="text-foreground">{requisition.headcount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Active applicants</dt>
            <dd className="text-foreground">{requisition.openApplicationCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Requires approval</dt>
            <dd className="text-foreground">{requisition.requiresApproval ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
        </MhdCard>
      </header>

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
