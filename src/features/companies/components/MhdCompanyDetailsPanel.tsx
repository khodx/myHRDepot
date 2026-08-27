import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import type { MhdCompany, MhdUpdateCompanyInput } from '@/features/companies/Types';
import { MhdCompanyForm } from './MhdCompanyForm';

type MhdCompanyDetailsPanelProps = {
  company: MhdCompany | null;
  isSubmitting: boolean;
  onUpdateCompany: (values: MhdUpdateCompanyInput) => void;
};

export function MhdCompanyDetailsPanel({
  company,
  isSubmitting,
  onUpdateCompany,
}: MhdCompanyDetailsPanelProps) {
  if (!company) {
    return (
      <MhdCard className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Company details</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a company to view and edit its details.
        </p>
      </MhdCard>
    );
  }

  return (
    <MhdCard className="p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {company.referenceId}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{company.companyName}</h2>
      </div>

      <dl className="mt-4 space-y-4 text-sm">
        <MhdDetailField label="Industry" value={company.industry} />
        <MhdDetailField label="Employee count" value={company.employeeCount} />
        <MhdDetailField label="Headquarters location" value={company.headquartersLocation} />
        <MhdDetailField label="Created" value={new Date(company.createdAt).toLocaleString()} />
        <MhdDetailField label="Updated" value={new Date(company.updatedAt).toLocaleString()} />
      </dl>

      <div className="mt-6 border-t border-border pt-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Edit company</h3>
        <MhdCompanyForm
          company={company}
          isSubmitting={isSubmitting}
          submitLabel="Update company"
          onSubmit={(values) => onUpdateCompany(values as MhdUpdateCompanyInput)}
        />
      </div>
    </MhdCard>
  );
}
