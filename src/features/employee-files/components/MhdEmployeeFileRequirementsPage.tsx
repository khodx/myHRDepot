import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdPaginationControls } from '@/components/ui/MhdPagination';
import { mhdPaginationSummary, useMhdPagination } from '@/components/ui/MhdPaginationUtils';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdCompanies } from '@/features/companies/Hook';
import { mhdFormService } from '@/features/forms/Service';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import { useMhdEmployeeFileRequirementGaps, useMhdEmployeeFileRequirements } from '../Hook';
import {
  MHD_EMPLOYEE_FILE_TYPES,
  mhdEmployeeFileLabelForKey,
  mhdEmployeeFileRequirementKindLabel,
  mhdEmployeeFileStateLabel,
  type MhdEmployeeFileRequirement,
  type MhdEmployeeFileRequirementGap,
  type MhdEmployeeFileTypeKey,
} from '../Types';
import { MhdEmployeeFileRequirementModal } from './MhdEmployeeFileRequirementModal';
import { MhdEmployeeFileRequirementStatusBadge } from './MhdEmployeeFileRequirementStatusBadge';

type RequirementsTab = 'gaps' | 'requirements';
type GapStatusFilter = 'ALL' | MhdEmployeeFileRequirementGap['status'];
type CategoryFilter = 'ALL' | MhdEmployeeFileTypeKey;

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

function GapsPanel({ companyId }: { companyId: string }) {
  const gapsQuery = useMhdEmployeeFileRequirementGaps(companyId);
  const [statusFilter, setStatusFilter] = useState<GapStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  const gaps = useMemo(
    () =>
      (gapsQuery.data ?? []).filter(
        (gap) =>
          (statusFilter === 'ALL' || gap.status === statusFilter) &&
          (categoryFilter === 'ALL' || gap.category === categoryFilter),
      ),
    [gapsQuery.data, statusFilter, categoryFilter],
  );
  const pagination = useMhdPagination(gaps.length, {
    resetKey: `${statusFilter}:${categoryFilter}:${gaps.length}`,
  });

  return (
    <div className="space-y-4">
      <MhdFilterBar
        onClear={() => {
          setStatusFilter('ALL');
          setCategoryFilter('ALL');
        }}
      >
        <MhdFilterSelect
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as GapStatusFilter)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OVERDUE">Overdue</option>
          <option value="MISSING">Missing</option>
        </MhdFilterSelect>
        <MhdFilterSelect
          label="Category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
        >
          <option value="ALL">All Categories</option>
          {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
            <option key={fileType.key} value={fileType.key}>
              {fileType.label}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {gapsQuery.isError ? (
        <ErrorNotice
          message={errorMessageOf(gapsQuery.error, 'Unable To Load Requirement Gaps.')}
        />
      ) : null}

      {gapsQuery.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading Requirement Gaps...</MhdCard>
      ) : gapsQuery.isError ? null : gaps.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState
            icon={ClipboardCheck}
            title="No Requirement Gaps"
            description="Every employee in this company meets the requirements matching these filters."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Employee</MhdTh>
                <MhdTh>Requirement</MhdTh>
                <MhdTh>Category</MhdTh>
                <MhdTh>Due Date</MhdTh>
                <MhdTh>Status</MhdTh>
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(gaps).map((gap) => (
                <MhdTr
                  key={`${gap.personId}:${gap.requirementId}`}
                  to={`/employees/${gap.personId}`}
                >
                  <MhdTd>
                    <Link
                      to={`/employees/${gap.personId}`}
                      className="font-semibold text-accent hover:text-accent-hover"
                    >
                      {gap.personName}
                    </Link>
                  </MhdTd>
                  <MhdTd>{gap.label}</MhdTd>
                  <MhdTd>{mhdEmployeeFileLabelForKey(gap.category)}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {mhdFormatDate(gap.dueDate)}
                  </MhdTd>
                  <MhdTd>
                    <MhdEmployeeFileRequirementStatusBadge status={gap.status} />
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, gaps.length, 'Gaps')}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}
    </div>
  );
}

function RequirementsPanel({ companyId }: { companyId: string }) {
  const requirementsQuery = useMhdEmployeeFileRequirements(companyId);
  const formsQuery = useQuery({
    queryKey: ['mhd-employee-file-requirement-forms', companyId],
    queryFn: () => mhdFormService.listFormsForCompany(companyId),
  });
  const [editing, setEditing] = useState<MhdEmployeeFileRequirement | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const requirements = requirementsQuery.data ?? [];
  const formNameById = useMemo(
    () => new Map((formsQuery.data ?? []).map((form) => [form.id, form.name])),
    [formsQuery.data],
  );
  const pagination = useMhdPagination(requirements.length, {
    resetKey: `${companyId}:${requirements.length}`,
  });

  function satisfiedByDetail(requirement: MhdEmployeeFileRequirement): string | null {
    if (requirement.satisfiedByKind === 'FORM_SUBMISSION' && requirement.formId) {
      return formNameById.get(requirement.formId) ?? null;
    }
    if (requirement.satisfiedByKind === 'DOCUMENT_TEMPLATE') return requirement.templateKey;
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(true)}>Add Requirement</Button>
      </div>

      {requirementsQuery.isError ? (
        <ErrorNotice
          message={errorMessageOf(requirementsQuery.error, 'Unable To Load Requirements.')}
        />
      ) : null}

      {requirementsQuery.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading Requirements...</MhdCard>
      ) : requirementsQuery.isError ? null : requirements.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState
            icon={ListChecks}
            title="No Requirements"
            description="No employee file requirements are in force for this company."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Requirement</MhdTh>
                <MhdTh>Category</MhdTh>
                <MhdTh>Satisfied By</MhdTh>
                <MhdTh>Applies To</MhdTh>
                <MhdTh>Due Days After Hire</MhdTh>
                <MhdTh>Active</MhdTh>
                <MhdTh>Source</MhdTh>
                <MhdTh className="text-right">Actions</MhdTh>
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(requirements).map((requirement) => {
                const detail = satisfiedByDetail(requirement);
                return (
                  <MhdTr key={requirement.requirementId}>
                    <MhdTd className="font-semibold">{requirement.label}</MhdTd>
                    <MhdTd>{mhdEmployeeFileLabelForKey(requirement.category)}</MhdTd>
                    <MhdTd>
                      {mhdEmployeeFileRequirementKindLabel(requirement.satisfiedByKind)}
                      {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
                    </MhdTd>
                    <MhdTd>
                      {requirement.appliesToStates.map(mhdEmployeeFileStateLabel).join(', ')}
                    </MhdTd>
                    <MhdTd>{requirement.dueDaysAfterHire ?? '—'}</MhdTd>
                    <MhdTd>
                      <MhdBadge variant={requirement.isActive ? 'success' : 'neutral'}>
                        {requirement.isActive ? 'Active' : 'Inactive'}
                      </MhdBadge>
                    </MhdTd>
                    <MhdTd>
                      <MhdBadge variant={requirement.isOverride ? 'accent' : 'neutral'}>
                        {requirement.isOverride ? 'Company Override' : 'Platform Default'}
                      </MhdBadge>
                    </MhdTd>
                    <MhdTd className="text-right" data-row-click-ignore>
                      <Button
                        variant="secondary"
                        className="h-8 px-3 text-xs"
                        onClick={() => setEditing(requirement)}
                      >
                        Edit
                      </Button>
                    </MhdTd>
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
          <MhdTableFooter
            summary={mhdPaginationSummary(pagination, requirements.length, 'Requirements')}
          >
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}

      {isAdding ? (
        <MhdEmployeeFileRequirementModal companyId={companyId} onClose={() => setIsAdding(false)} />
      ) : null}
      {editing ? (
        <MhdEmployeeFileRequirementModal
          companyId={companyId}
          requirement={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

export function MhdEmployeeFileRequirementsPage() {
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const [chosenCompanyId, setChosenCompanyId] = useState('');
  const [tab, setTab] = useState<RequirementsTab>('gaps');

  // Requirements are per company, so there is no "All Companies" choice; until
  // one is picked the first company is used.
  const companyId = chosenCompanyId || companies[0]?.id || '';

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="File Requirements"
        description="Track which employee file documents are missing or overdue, and manage the rules behind them."
        backTo="/employees"
        backLabel="Employee Files"
      />

      <MhdFilterBar>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Company
          </span>
          <MhdSearchableSelect
            id="mhd-employee-file-requirements-company"
            options={companies.map((company) => ({ id: company.id, label: company.companyName }))}
            value={companyId}
            onChange={setChosenCompanyId}
            placeholder="Select A Company"
            emptyMessage="No companies match your search."
          />
        </label>
      </MhdFilterBar>

      {companiesQuery.isError ? (
        <ErrorNotice message={errorMessageOf(companiesQuery.error, 'Unable To Load Companies.')} />
      ) : null}

      <MhdTabs
        tabs={[
          { value: 'gaps', label: 'Gaps' },
          { value: 'requirements', label: 'Requirements' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {companiesQuery.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading Companies...</MhdCard>
      ) : !companyId ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">
          Select a company to see its file requirements.
        </MhdCard>
      ) : tab === 'gaps' ? (
        <GapsPanel companyId={companyId} />
      ) : (
        <RequirementsPanel companyId={companyId} />
      )}
    </div>
  );
}

export default MhdEmployeeFileRequirementsPage;
