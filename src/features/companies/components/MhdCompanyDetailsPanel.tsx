import { MhdCard } from '@/components/ui/MhdCard';
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

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Industry</dt>
          <dd className="text-slate-800">{company.industry ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Employee count</dt>
          <dd className="text-slate-800">{company.employeeCount ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Headquarters location</dt>
          <dd className="text-slate-800">{company.headquartersLocation ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Created</dt>
          <dd className="text-slate-800">{new Date(company.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Updated</dt>
          <dd className="text-slate-800">{new Date(company.updatedAt).toLocaleString()}</dd>
        </div>
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
