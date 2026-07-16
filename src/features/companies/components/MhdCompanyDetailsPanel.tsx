import type { MhdCompany, MhdUpdateCompanyInput } from '@/features/companies/Types';
import { MhdCompanyForm } from './MhdCompanyForm';

type MhdCompanyDetailsPanelProps = {
  company: MhdCompany | null;
  isSubmitting: boolean;
  onUpdateCompany: (values: MhdUpdateCompanyInput) => void;
};

export function MhdCompanyDetailsPanel({ company, isSubmitting, onUpdateCompany }: MhdCompanyDetailsPanelProps) {
  if (!company) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Company details</h2>
        <p className="mt-2 text-sm text-slate-600">Select a company to view and edit its details.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{company.referenceId}</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{company.companyName}</h2>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Industry</dt>
          <dd className="text-slate-800">{company.industry ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Employee count</dt>
          <dd className="text-slate-800">{company.employeeCount ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Headquarters location</dt>
          <dd className="text-slate-800">{company.headquartersLocation ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Created</dt>
          <dd className="text-slate-800">{new Date(company.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Updated</dt>
          <dd className="text-slate-800">{new Date(company.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Edit company</h3>
        <MhdCompanyForm
          company={company}
          isSubmitting={isSubmitting}
          submitLabel="Update company"
          onSubmit={(values) => onUpdateCompany(values as MhdUpdateCompanyInput)}
        />
      </div>
    </aside>
  );
}
