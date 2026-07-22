import { useMemo, useState } from 'react';
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
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Recruiting</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Requisitions for this company. Open a requisition to invite applicants and work the
            pipeline.
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            New requisition
          </button>
        ) : null}
      </header>

      <div className="flex items-center gap-3">
        <label htmlFor="statusFilter" className="text-sm text-neutral-600">
          Status
        </label>
        <select
          id="statusFilter"
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value as MhdRequisitionFilters['status'],
            }))
          }
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {MHD_RECRUITING_REQUISITION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatRequisitionStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {requisitions.isLoading ? (
        <p className="text-sm text-neutral-500">Loading requisitions…</p>
      ) : (requisitions.data ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">No requisitions in this view.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Reference</th>
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Hiring manager</th>
                <th className="py-2 pr-4 font-medium">Department</th>
                <th className="py-2 pr-4 font-medium">Openings</th>
                <th className="py-2 pr-4 font-medium">Active applicants</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(requisitions.data ?? []).map((requisition) => (
                <tr
                  key={requisition.id}
                  className="border-b border-neutral-100 text-neutral-800"
                >
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs text-neutral-400">
                    {requisition.referenceId}
                  </td>
                  <td className="py-2 pr-4 font-medium text-neutral-900">{requisition.title}</td>
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                    {requisition.hiringManagerName ?? '—'}
                  </td>
                  <td className="py-2 pr-4 text-neutral-600">{requisition.department ?? '—'}</td>
                  <td className="py-2 pr-4 text-neutral-600">{requisition.headcount}</td>
                  <td className="py-2 pr-4 text-neutral-600">
                    {requisition.openApplicationCount}
                  </td>
                  <td className="py-2 pr-4">
                    <MhdRequisitionStatusBadge status={requisition.status} />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenRequisition(requisition.id)}
                      className="text-sm text-neutral-500 underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreating && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">New requisition</h2>
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
