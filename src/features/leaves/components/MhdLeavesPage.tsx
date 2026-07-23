import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
    <div className="space-y-6">
      <MhdPageHeader
        title="Leaves of absence"
        description={
          isPrivileged
            ? 'Leave cases, legal bases and per-basis balances.'
            : 'Your leave cases and their status.'
        }
        actions={
          isPrivileged ? (
            <Button onClick={() => setIsCreating(true)}>Open leave case</Button>
          ) : undefined
        }
      />

      <MhdCard className="grid gap-3 md:grid-cols-3">
        {isPrivileged ? (
          <MhdFilterSelect
            label="Employee"
            value={filters.personId ?? ''}
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, personId: event.target.value || null }))
            }
          >
            <option value="">All employees</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </MhdFilterSelect>
        ) : null}

        <MhdFilterSelect
          label="Status"
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value as MhdLeaveCaseFilters['status'],
            }))
          }
        >
          <option value="ALL">All statuses</option>
          {MHD_LEAVE_CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatLeaveCaseStatus(status)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdCard>

      {cases.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading…</MhdCard>
      ) : (cases.data ?? []).length === 0 ? (
        <MhdCard className="border-dashed">
          <MhdEmptyState icon={CalendarOff} title="No leave cases on record." />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                {isPrivileged ? <MhdTh>Employee</MhdTh> : null}
                <MhdTh>Reason</MhdTh>
                <MhdTh>Dates</MhdTh>
                <MhdTh className="text-right">Bases</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {(cases.data ?? []).map((leaveCase) => (
                <MhdTr key={leaveCase.id}>
                  <MhdTd className="whitespace-nowrap font-mono text-xs">
                    {leaveCase.referenceId}
                  </MhdTd>
                  {isPrivileged ? (
                    <MhdTd className="whitespace-nowrap">{leaveCase.personDisplayName}</MhdTd>
                  ) : null}
                  <MhdTd>{leaveCase.reasonCategory}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {leaveCase.requestedStart ?? '—'}
                    {leaveCase.requestedEnd ? ` → ${leaveCase.requestedEnd}` : ''}
                  </MhdTd>
                  <MhdTd className="text-right tabular-nums">{leaveCase.basisCount}</MhdTd>
                  <MhdTd>
                    <MhdLeaveStatusBadge status={leaveCase.status} />
                  </MhdTd>
                  <MhdTd className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/leaves/${leaveCase.id}`)}
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

      {isCreating && isPrivileged && companyId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Open leave case</h2>
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
