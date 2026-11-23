/**
 * MhdCompanyWorksitesPage
 *
 * Route: /companies/:companyId/worksites
 * The Worksites tab of a company record: worksite locations (with the map coordinates the FMLA
 * 75-mile test uses) and the people assigned to each.
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdBreadcrumb } from './MhdBreadcrumb';
import { mhdCompanyService } from '@/features/companies/Service';
import { MhdCompanyRecordTabs } from '@/features/companies/components/MhdCompanyRecordTabs';
import { MhdCompanyWorksitesPanel } from '@/features/companies/components/MhdCompanyWorksitesPanel';

export function MhdCompanyWorksitesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const {
    data: company,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['mhd-company', companyId],
    queryFn: () => mhdCompanyService.getCompanyById(companyId!),
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading company…</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p role="alert" className="text-sm text-red-600">
          {(error as Error)?.message ?? 'Company not found'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[62.4rem] space-y-4 p-6">
      <MhdBreadcrumb
        items={[
          { label: 'Companies', to: '/companies' },
          { label: company.companyName, to: `/companies/${company.id}` },
          { label: 'Worksites' },
        ]}
      />
      <MhdCompanyRecordTabs companyId={company.id} active="worksites" />
      <MhdCompanyWorksitesPanel companyId={company.id} />
    </div>
  );
}
