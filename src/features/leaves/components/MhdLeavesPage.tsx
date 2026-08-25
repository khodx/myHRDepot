import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { cn } from '@/utils/cn';
import {
  mhdPaginationSummary,
  MhdPaginationControls,
  useMhdPagination,
} from '@/components/ui/MhdPagination';
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
import { useMhdCreateLeaveCase, useMhdCreateLeaveCaseSelf, useMhdLeaveCases } from '../Hook';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import type { MhdLeaveCaseFormValues, MhdLeaveCaseSelfFormValues } from '../Schemas';
import {
  MHD_LEAVE_CASE_STATUSES,
  mhdFormatLeaveCaseStatus,
  type MhdLeaveCaseFilters,
} from '../Types';
import { MhdLeaveBoard } from './MhdLeaveBoard';
import { MhdLeaveCaseForm } from './MhdLeaveCaseForm';
import { MhdLeaveCaseSelfForm } from './MhdLeaveCaseSelfForm';
import { MhdLeaveStatusBadge } from './MhdLeaveStatusBadge';
import { useMhdFormIntakeDefault } from '@/features/forms/Hook';
import { MhdDocumentMergeBatchLauncher } from '@/components/ui/MhdDocumentMergeBatchLauncher';

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
  const location = useLocation();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isPrivileged = mhdLeavesIsPrivileged(roles);
  const leaveIntake = useMhdFormIntakeDefault(companyId || null, 'leaveCase');
  const selfPersonId = profile?.personId ?? null;

  const [isCreating, setIsCreating] = useState(false);
  const [isRequestingSelf, setIsRequestingSelf] = useState(false);
  const [filters, setFilters] = useState<MhdLeaveCaseFilters>({
    companyId,
    personId: isPrivileged ? null : selfPersonId,
    status: 'ALL',
  });
  const [viewMode, setViewMode] = useState<MhdViewMode>(() =>
    mhdReadPersistedViewMode(MHD_LEAVES_VIEW_KEY),
  );
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [launcherOpen, setLauncherOpen] = useState(false);

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
  const createCaseSelf = useMhdCreateLeaveCaseSelf();
  const visibleCases = pagination.sliceItems(casesData);
  const visibleCaseIds = visibleCases.map((leaveCase) => leaveCase.id);
  const allVisibleCasesSelected = visibleCaseIds.length > 0 && visibleCaseIds.every((id) => selectedCaseIds.has(id));

  function toggleCase(caseId: string) {
    setSelectedCaseIds((current) => {
      const next = new Set(current);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  }

  function toggleVisibleCases() {
    setSelectedCaseIds((current) => {
      const next = new Set(current);
      visibleCaseIds.forEach((id) => (allVisibleCasesSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

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

  async function handleCreateSelf(values: MhdLeaveCaseSelfFormValues) {
    const result = await createCaseSelf.mutateAsync({
      reasonCategory: values.reasonCategory,
      requestedStart: values.requestedStart ?? null,
      requestedEnd: values.requestedEnd ?? null,
      isIntermittent: values.isIntermittent,
    });
    setIsRequestingSelf(false);
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
          <>
            {selfPersonId ? (
              <Button
                variant={isPrivileged ? 'secondary' : 'primary'}
                onClick={() => setIsRequestingSelf(true)}
                className="h-9 px-3 text-[16.8px]"
              >
                Request Leave
              </Button>
            ) : null}
            {isPrivileged ? (
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
                <Link
                  to="/leaves/new/intake"
                  className={cn(
                    buttonBaseClasses,
                    buttonVariantClasses.primary,
                    'h-9 px-3 text-[16.8px]',
                  )}
                >
                  Start guided intake
                </Link>
                {/*
                Form-driven intake (0188, mhd_create_leave_case_from_submission;
                0219, form_intake_defaults). Deep-links straight to the
                company's designated leave-intake form (configurable from the
                Policy Library above) when one is set, falling back to the
                generic Forms Library index otherwise.
              */}
                <Link
                  to={
                    leaveIntake.default
                      ? `/forms/${leaveIntake.default.formId}/render?intakeAction=leaveCase`
                      : '/forms/library'
                  }
                  state={leaveIntake.default ? { backgroundLocation: location } : undefined}
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
            ) : null}
          </>
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
        <MhdLeaveBoard
          cases={cases.data ?? []}
          isLoading={cases.isLoading}
          isPrivileged={isPrivileged}
        />
      ) : (
        <>
          {selectedCaseIds.size > 0 ? (
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{selectedCaseIds.size} selected</span>
              <div className="flex items-center gap-2">
                <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setSelectedCaseIds(new Set())}>Clear selection</button>
                <Button onClick={() => setLauncherOpen(true)} disabled={!companyId}>Generate Documents</Button>
              </div>
            </div>
          ) : null}
          <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh className="w-10">
                  <input type="checkbox" aria-label="Select all leave cases" checked={allVisibleCasesSelected} onChange={toggleVisibleCases} className="h-4 w-4 rounded" />
                </MhdTh>
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
              {visibleCases.map((leaveCase) => (
                <MhdTr key={leaveCase.id} to={`/leaves/${leaveCase.id}`}>
                  <MhdTd>
                    <input type="checkbox" checked={selectedCaseIds.has(leaveCase.id)} onChange={() => toggleCase(leaveCase.id)} aria-label={`Select ${leaveCase.referenceId}`} className="h-4 w-4 rounded" />
                  </MhdTd>
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
          <MhdTableFooter
            summary={mhdPaginationSummary(pagination, casesData.length, 'leave cases')}
          >
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
          </MhdCard>
          {launcherOpen ? (
            <MhdDocumentMergeBatchLauncher
              companyId={companyId}
              personIds={casesData
                .filter((leaveCase) => selectedCaseIds.has(leaveCase.id))
                .map((leaveCase) => leaveCase.personId)}
              onClose={() => setLauncherOpen(false)}
            />
          ) : null}
        </>
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

      {isRequestingSelf && selfPersonId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Request leave</h2>
            <MhdLeaveCaseSelfForm
              onSubmit={handleCreateSelf}
              onCancel={() => setIsRequestingSelf(false)}
              isSubmitting={createCaseSelf.isPending}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
