import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdCreateLeaveCase, useMhdLeaveCases, useMhdLeavePeople } from '../Hook';
import type { MhdLeaveCaseFormValues } from '../Schemas';
import {
  MHD_LEAVE_CASE_STATUSES,
  mhdFormatLeaveCaseStatus,
  type MhdLeaveCaseFilters,
} from '../Types';
import { MhdLeaveCaseForm } from './MhdLeaveCaseForm';
import { MhdLeaveStatusBadge } from './MhdLeaveStatusBadge';

/**
 * `/leaves` — the case board (route entry).
 *
 * Reads `useMhdAuth()` itself, per the app convention: privileged administrators
 * (Platform Admin / HR Partner / Client Admin) see the whole company's cases and
 * can open new ones; a Client User sees only their own (the RPC scopes by
 * `mhd_can_view_leave_person`, so the personId filter here is belt-and-braces,
 * not the enforcement). Viewer never reaches this route (mhdRouteAccess).
 *
 * Nothing on this board is medical — it is who, why-category, when and status.
 */
export function MhdLeavesPage() {
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isPrivileged = mhdLeavesIsPrivileged(roles);
  const selfPersonId = profile?.personId ?? null;

  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState<MhdLeaveCaseFilters>({
    companyId,
    personId: isPrivileged ? null : selfPersonId,
    status: 'ALL',
  });

  const cases = useMhdLeaveCases(filters);
  const people = useMhdLeavePeople(isPrivileged ? companyId || null : null);
  const createCase = useMhdCreateLeaveCase(companyId || null);

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person: { id: string; firstName?: string; lastName?: string }) => ({
        id: person.id,
        displayName: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  async function handleCreate(values: MhdLeaveCaseFormValues) {
    const result = await createCase.mutateAsync({
      companyId: values.companyId,
      personId: values.personId,
      reasonCategory: values.reasonCategory,
      requestedStart: values.requestedStart ?? null,
      requestedEnd: values.requestedEnd ?? null,
      isIntermittent: values.isIntermittent,
    });
    setIsCreating(false);
    navigate(`/leaves/${result.id}`);
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Leaves of absence</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {isPrivileged
              ? 'Leave cases, legal bases and per-basis balances.'
              : 'Your leave cases and their status.'}
          </p>
        </div>
        {isPrivileged ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Open leave case
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-3">
        {isPrivileged ? (
          <select
            value={filters.personId ?? ''}
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, personId: event.target.value || null }))
            }
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">All employees</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        ) : null}

        <select
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value as MhdLeaveCaseFilters['status'],
            }))
          }
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {MHD_LEAVE_CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatLeaveCaseStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {cases.isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (cases.data ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">No leave cases on record.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Reference</th>
                {isPrivileged ? <th className="py-2 pr-4 font-medium">Employee</th> : null}
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Dates</th>
                <th className="py-2 pr-4 text-right font-medium">Bases</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(cases.data ?? []).map((leaveCase) => (
                <tr key={leaveCase.id} className="border-b border-neutral-100 text-neutral-800">
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs">
                    {leaveCase.referenceId}
                  </td>
                  {isPrivileged ? (
                    <td className="py-2 pr-4 whitespace-nowrap">{leaveCase.personDisplayName}</td>
                  ) : null}
                  <td className="py-2 pr-4">{leaveCase.reasonCategory}</td>
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                    {leaveCase.requestedStart ?? '—'}
                    {leaveCase.requestedEnd ? ` → ${leaveCase.requestedEnd}` : ''}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{leaveCase.basisCount}</td>
                  <td className="py-2 pr-4">
                    <MhdLeaveStatusBadge status={leaveCase.status} />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/leaves/${leaveCase.id}`)}
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

      {isCreating && isPrivileged && companyId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Open leave case</h2>
            <MhdLeaveCaseForm
              companyId={companyId}
              people={peopleOptions}
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              isSubmitting={createCase.isPending}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
