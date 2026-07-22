import type { MhdCompany } from '@/features/companies/Types';

type MhdCompanyListProps = {
  companies: MhdCompany[];
  selectedCompanyId?: string | null;
  onSelectCompany: (company: MhdCompany) => void;
};

export function MhdCompanyList({ companies, selectedCompanyId, onSelectCompany }: MhdCompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-card p-8 text-center text-sm text-slate-600">
        No companies found. Create the first company to begin using My HR Depot task management.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-card shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Reference</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Company</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Industry</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {companies.map((company) => (
            <tr
              key={company.id}
              className={selectedCompanyId === company.id ? 'bg-blue-50' : 'hover:bg-slate-50'}
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">{company.referenceId}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-blue-700 hover:text-blue-900"
                  onClick={() => onSelectCompany(company)}
                >
                  {company.companyName}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{company.industry ?? '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{new Date(company.updatedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
