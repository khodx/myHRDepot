import { useState } from 'react';
import { MhdCommunicationsTabs } from '@/appshell/components/MhdCommunicationsTabs';
import { mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { MhdCorrespondencePanel } from './MhdCorrespondencePanel';

export function MhdCorrespondenceInboxPage() {
  const { profile, roles } = useMhdAuth();
  const canSelectCompany = mhdIsPlatformAdminOrHrPartner(roles);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companyId = canSelectCompany ? selectedCompanyId : (profile?.companyId ?? null);
  const companyOptions = (companiesQuery.data ?? []).map((company) => ({
    id: company.id,
    label: company.companyName,
  }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-6">
      <MhdPageHeader
        title="Correspondence inbox"
        description="Email correspondence sent and received through company mailboxes."
        backTo="/communications"
        backLabel="Communications"
      />

      <MhdCommunicationsTabs active="inbox" />

      {canSelectCompany ? (
        <label className="block max-w-sm text-sm font-medium text-foreground">
          Company
          <select
            value={selectedCompanyId ?? ''}
            onChange={(event) => setSelectedCompanyId(event.target.value || null)}
            className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="">Select company</option>
            {companyOptions.map((company) => (
              <option key={company.id} value={company.id}>
                {company.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {companyId ? (
        <MhdCorrespondencePanel companyId={companyId} />
      ) : (
        <MhdEmptyState
          title="Select a company"
          description="The correspondence inbox is scoped to one company at a time."
        />
      )}
    </div>
  );
}
