import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Users } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
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
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeople } from '@/features/people/Hook';
import { MHD_EMPLOYEE_FILE_TYPES } from '../Types';

export function MhdEmployeeFilesPage() {
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const peopleState = useMhdPeople({ companyId: 'ALL', searchTerm: '' });
  const [selectedCompanyId, setSelectedCompanyId] = useState<'ALL' | string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPeople = useMemo(
    () =>
      peopleState.people.filter((person) => {
        const companyMatches =
          selectedCompanyId === 'ALL' || person.companyId === selectedCompanyId;
        const query = searchTerm.trim().toLowerCase();
        const searchMatches =
          query.length === 0 ||
          person.displayName.toLowerCase().includes(query) ||
          person.referenceId.toLowerCase().includes(query) ||
          (person.primaryEmail ?? '').toLowerCase().includes(query);
        return companyMatches && searchMatches;
      }),
    [peopleState.people, searchTerm, selectedCompanyId],
  );
  const pagination = useMhdPagination(filteredPeople.length, {
    resetKey: `${filteredPeople.length}:${filteredPeople[0]?.id ?? ''}`,
  });

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Employee Files"
        description="Manage employee file cabinets by person and file type."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MhdCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Employees</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{filteredPeople.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Matching Current Filters</p>
        </MhdCard>
        <MhdCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">File Types</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {MHD_EMPLOYEE_FILE_TYPES.length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Configured Employee File Cabinets</p>
        </MhdCard>
        <MhdCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Architecture</p>
          <p className="mt-2 text-3xl font-bold text-foreground">Forms</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted Records + Person/User Links
          </p>
        </MhdCard>
      </div>

      <MhdCard className="p-5">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-1 h-5 w-5 text-accent" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-foreground">Employee File Types</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              File cabinets are populated by submitted forms assigned to each employee file
              destination.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
                <span
                  key={fileType.key}
                  className="rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
                >
                  {fileType.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </MhdCard>

      <MhdFilterBar>
        <MhdFilterSelect
          label="Company"
          id="mhd-employee-files-company"
          value={selectedCompanyId}
          onChange={(event) => setSelectedCompanyId(event.target.value)}
        >
          <option value="ALL">All Companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.companyName}
            </option>
          ))}
        </MhdFilterSelect>
        <MhdFilterInput
          label="Search"
          placeholder="Search employees"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="lg:col-span-2"
        />
      </MhdFilterBar>

      {peopleState.errorMessage || companiesQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {peopleState.errorMessage ??
            (companiesQuery.error instanceof Error
              ? companiesQuery.error.message
              : 'Unable to load employee files.')}
        </p>
      ) : null}

      {peopleState.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading Employees...</MhdCard>
      ) : filteredPeople.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState
            icon={Users}
            title="No Employees Found"
            description="Adjust the company or search filters."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Employee</MhdTh>
                <MhdTh>Company</MhdTh>
                <MhdTh>Email</MhdTh>
                <MhdTh>Updated</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(filteredPeople).map((person) => (
                <MhdTr key={person.id} to={`/employees/${person.id}`}>
                  <MhdTd>
                    <Link
                      to={`/employees/${person.id}`}
                      className="font-semibold text-accent hover:text-accent-hover"
                    >
                      {person.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{person.referenceId}</p>
                  </MhdTd>
                  <MhdTd>{person.companyName ?? 'Company Unavailable'}</MhdTd>
                  <MhdTd>{person.primaryEmail ?? '—'}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {new Date(person.updatedAt).toLocaleDateString()}
                  </MhdTd>
                  <MhdTableActions viewTo={`/employees/${person.id}`} />
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, filteredPeople.length, 'Employees')}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}
    </div>
  );
}
