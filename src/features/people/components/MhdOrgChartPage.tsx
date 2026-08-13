import { useMemo, useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdOrgChart } from '@/features/people/Hook';
import { MhdPersonCompanySelect } from './MhdPersonCompanySelect';
import { MhdOrgChartTree, mhdBuildOrgChartTree } from './MhdOrgChartTree';

export function MhdOrgChartPage() {
  const { profile, roles } = useMhdAuth();
  const canSelectCompany = mhdIsPlatformAdmin(roles);
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const selectedCompanyId = canSelectCompany
    ? companyFilter === 'ALL'
      ? null
      : companyFilter
    : (profile?.companyId ?? null);
  const orgChartQuery = useMhdOrgChart(selectedCompanyId);
  const nodes = useMemo(() => orgChartQuery.data ?? [], [orgChartQuery.data]);
  const roots = useMemo(() => mhdBuildOrgChartTree(nodes), [nodes]);
  const hasDownline = roots.some((root) => root.children.length > 0) || nodes.length > roots.length;

  return (
    <div className="space-y-6">
      <MhdPageHeader title="Org Chart" description="Browse visible reporting relationships." />

      {canSelectCompany ? (
        <MhdFilterBar>
          <MhdPersonCompanySelect
            companies={companies}
            includeAllOption
            label="Filter by company"
            value={companyFilter}
            onChange={setCompanyFilter}
          />
        </MhdFilterBar>
      ) : null}

      {orgChartQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {orgChartQuery.error instanceof Error
            ? orgChartQuery.error.message
            : 'Unable to load org chart.'}
        </div>
      ) : null}
      {companiesQuery.error && canSelectCompany ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {companiesQuery.error instanceof Error
            ? companiesQuery.error.message
            : 'Unable to load companies.'}
        </div>
      ) : null}

      <MhdCard className="p-6 shadow-sm">
        {orgChartQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading org chart...</p>
        ) : nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No people are visible in this org chart.</p>
        ) : nodes.length === 1 && !hasDownline ? (
          <p className="text-sm text-muted-foreground">You have no reports.</p>
        ) : (
          <MhdOrgChartTree nodes={nodes} />
        )}
      </MhdCard>
    </div>
  );
}
