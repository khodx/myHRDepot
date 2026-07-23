import { useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdCreateRequisition, useMhdRecruitingPeople, useMhdRecruitingRequisitions } from '../Hook';
import type { MhdRequisitionFormValues } from '../Schemas';
import {
  MHD_RECRUITING_REQUISITION_STATUSES,
  mhdFormatRequisitionStatus,
  type MhdRequisitionFilters,
} from '../Types';
import { MhdRequisitionForm } from './MhdRequisitionForm';
import { MhdRequisitionStatusBadge } from './MhdRequisitionStatusBadge';

interface Props {
  companyId: string;
  /**
   * Whether this viewer belongs to the privileged set (Platform Admin / HR
   * Partner / Client Admin) that may create and manage requisitions. This page
   * lives at the admin `/recruiting` route; a hiring manager reaching it sees only
   * their own requisitions (RLS) and no "New requisition" affordance. The RPCs
   * re-check `mhd_recruiting_is_privileged` regardless — this only governs UI.
   */
  canManage: boolean;
  /** Route to a requisition's detail + pipeline board. */
  onOpenRequisition: (requisitionId: string) => void;
}

/**
 * `/recruiting` — the admin list of a company's requisitions, filterable by
 * status. "New requisition" creates a DRAFT and opens it. A hiring manager sees
 * only the requisitions they own.
 */
export function MhdRequisitionListPage({ companyId, canManage, onOpenRequisition }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState<MhdRequisitionFilters>({ companyId, status: 'ALL' });

  const requisitions = useMhdRecruitingRequisitions(filters);
  const people = useMhdRecruitingPeople(canManage ? companyId : null);
  const createRequisition = useMhdCreateRequisition();

  const hiringManagerOptions = useMemo(
    () =>
      (people.data ?? []).map(
        (person: { id: string; firstName?: string | null; lastName?: string | null; preferredName?: string | null }) => ({
          id: person.id,
          displayName:
            person.preferredName ||
            [person.firstName, person.lastName].filter(Boolean).join(' '),
        }),
      ),
    [people.data],
  );

  async function handleCreate(values: MhdRequisitionFormValues) {
    const result = await createRequisition.mutateAsync({
      companyId: values.companyId,
      title: values.title,
      jobId: values.jobId || null,
      hiringManagerPersonId: values.hiringManagerPersonId || null,
      department: values.department || null,
      location: values.location || null,
      employmentType: values.employmentType || null,
      headcount: values.headcount,
      requiresApproval: values.requiresApproval,
    });
    setIsCreating(false);
    onOpenRequisition(result.id);
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Recruiting"
        description="Requisitions for this company. Open a requisition to invite applicants and work the pipeline."
        actions={
          canManage ? (
            <Button onClick={() => setIsCreating(true)}>New requisition</Button>
          ) : undefined
        }
      />

      <MhdCard className="grid gap-3 md:grid-cols-3">
        <MhdFilterSelect
          label="Status"
          id="statusFilter"
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value as MhdRequisitionFilters['status'],
            }))
          }
        >
          <option value="ALL">All statuses</option>
          {MHD_RECRUITING_REQUISITION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatRequisitionStatus(status)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdCard>

      {requisitions.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading requisitions…</MhdCard>
      ) : (requisitions.data ?? []).length === 0 ? (
        <MhdCard className="border-dashed">
          <MhdEmptyState icon={Briefcase} title="No requisitions in this view." />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Title</MhdTh>
                <MhdTh>Hiring manager</MhdTh>
                <MhdTh>Department</MhdTh>
                <MhdTh>Openings</MhdTh>
                <MhdTh>Active applicants</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {(requisitions.data ?? []).map((requisition) => (
                <MhdTr key={requisition.id}>
                  <MhdTd className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {requisition.referenceId}
                  </MhdTd>
                  <MhdTd className="font-medium">{requisition.title}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {requisition.hiringManagerName ?? '—'}
                  </MhdTd>
                  <MhdTd className="text-muted-foreground">{requisition.department ?? '—'}</MhdTd>
                  <MhdTd className="text-muted-foreground">{requisition.headcount}</MhdTd>
                  <MhdTd className="text-muted-foreground">
                    {requisition.openApplicationCount}
                  </MhdTd>
                  <MhdTd>
                    <MhdRequisitionStatusBadge status={requisition.status} />
                  </MhdTd>
                  <MhdTd className="text-right">
                    <button
                      type="button"
                      onClick={() => onOpenRequisition(requisition.id)}
                      className="text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Open
                    </button>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      {isCreating && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">New requisition</h2>
            <MhdRequisitionForm
              companyId={companyId}
              hiringManagers={hiringManagerOptions}
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              isSubmitting={createRequisition.isPending}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
