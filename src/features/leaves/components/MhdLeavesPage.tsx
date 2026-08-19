import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { cn } from '@/utils/cn';
import { mhdPaginationSummary, MhdPaginationControls, useMhdPagination } from '@/components/ui/MhdPagination';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { MhdViewToggle } from '@/components/ui/MhdViewToggle';
import {
  mhdReadPersistedViewMode,
  mhdWritePersistedViewMode,
  type MhdViewMode,
} from '@/components/ui/MhdViewToggleUtils';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdCreateLeaveCase, useMhdLeaveCases } from '../Hook';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import type { MhdLeaveCaseFormValues } from '../Schemas';
import {
  MHD_LEAVE_CASE_STATUSES,
  mhdFormatLeaveCaseStatus,
  type MhdLeaveCaseFilters,
} from '../Types';
import { MhdLeaveBoard } from './MhdLeaveBoard';
import { MhdLeaveCaseForm } from './MhdLeaveCaseForm';
import { MhdLeaveStatusBadge } from './MhdLeaveStatusBadge';

const MHD_LEAVES_VIEW_KEY = 'mhd:leaves:view';

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
  const [viewMode, setViewMode] = useState<MhdViewMode>(() =>
    mhdReadPersistedViewMode(MHD_LEAVES_VIEW_KEY),
  );

  function handleViewModeChange(mode: MhdViewMode) {
    setViewMode(mode);
    mhdWritePersistedViewMode(MHD_LEAVES_VIEW_KEY, mode);
  }

  const cases = useMhdLeaveCases(filters);
  const casesData = cases.data ?? [];
  const pagination = useMhdPagination(casesData.length, {
    resetKey: `${casesData.length}:${casesData[0]?.id ?? ''}`,
  });
  const people = useMhdPeoplePicker(isPrivileged ? companyId || null : null);
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
            <>
              <Link
                to="/leaves/policy-library"
                className={cn(
                  buttonBaseClasses,
                  buttonVariantClasses.secondary,
                  'h-9 px-3 text-[16.8px]',
                )}
              >
                Policy Library
              </Link>
              {/*
                Form-driven intake (0188, mhd_create_leave_case_from_submission).
                This links plainly to the Forms Library rather than a specific
                form id — no "default leave intake form" designation exists on
                `forms` yet (would need e.g. a forms.intake_kind column), so a
                privileged user picks a leave-tagged form themselves. Once one
                is submitted there, the case is NOT opened automatically yet
                either: nothing currently calls
                mhdLeavesService.createCaseFromSubmission after a real
                submission completes, because MhdFormRenderer's onSubmitted
                callback (src/features/forms/components/MhdFormRenderer.tsx)
                forwards only (submissionId, form), not the submitted values,
                and MhdFormRendererPage has no per-form "this is a Leaves
                intake" signal to branch on yet (mirroring how it already
                branches on onboardingPersonId/onboardingDocumentKey to call
                mhdOnboardingService). See the docstring on
                mhdLeavesService.createCaseFromSubmission (Service.ts) for the
                exact wiring this needs — closing that gap requires editing
                src/features/forms/, out of scope for this change.
              */}
              <Link
                to="/forms/library"
                className={cn(
                  buttonBaseClasses,
                  buttonVariantClasses.secondary,
                  'h-9 px-3 text-[16.8px]',
                )}
              >
                New Leave Case (via Form)
              </Link>
              <Button onClick={() => setIsCreating(true)} className="h-9 px-3 text-[16.8px]">
                Open Leave Case
              </Button>
            </>
          ) : undefined
        }
      />

      <MhdFilterBar>
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
      </MhdFilterBar>

      <div className="flex justify-end">
        <MhdViewToggle value={viewMode} onChange={handleViewModeChange} />
      </div>

      {cases.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading…</MhdCard>
      ) : casesData.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState icon={CalendarOff} title="No leave cases on record." />
        </MhdCard>
      ) : viewMode === 'board' ? (
        <MhdLeaveBoard cases={cases.data ?? []} isLoading={cases.isLoading} isPrivileged={isPrivileged} />
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
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(casesData).map((leaveCase) => (
                <MhdTr key={leaveCase.id} to={`/leaves/${leaveCase.id}`}>
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
                  <MhdTableActions
                    viewTo={`/leaves/${leaveCase.id}`}
                    editTo={isPrivileged ? `/leaves/${leaveCase.id}` : undefined}
                  />
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, casesData.length, 'leave cases')}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
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
