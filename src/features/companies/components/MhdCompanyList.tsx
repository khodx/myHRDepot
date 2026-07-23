import { Building2 } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import type { MhdCompany } from '@/features/companies/Types';

type MhdCompanyListProps = {
  companies: MhdCompany[];
  selectedCompanyId?: string | null;
  onSelectCompany: (company: MhdCompany) => void;
};

export function MhdCompanyList({ companies, selectedCompanyId, onSelectCompany }: MhdCompanyListProps) {
  if (companies.length === 0) {
    return (
      <MhdCard className="border-dashed">
        <MhdEmptyState
          icon={Building2}
          title="No companies found"
          description="Create the first company to begin using My HR Depot task management."
        />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Reference</MhdTh>
            <MhdTh>Company</MhdTh>
            <MhdTh>Industry</MhdTh>
            <MhdTh>Updated</MhdTh>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <MhdTr
              key={company.id}
              className={selectedCompanyId === company.id ? 'bg-accent-tint hover:bg-accent-tint/60' : undefined}
            >
              <MhdTd className="whitespace-nowrap text-sm font-medium">{company.referenceId}</MhdTd>
              <MhdTd>
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-accent hover:text-accent-hover"
                  onClick={() => onSelectCompany(company)}
                >
                  {company.companyName}
                </button>
              </MhdTd>
              <MhdTd className="text-sm text-muted-foreground">{company.industry ?? '—'}</MhdTd>
              <MhdTd className="whitespace-nowrap text-sm text-muted-foreground">{new Date(company.updatedAt).toLocaleDateString()}</MhdTd>
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
    </MhdCard>
  );
}
