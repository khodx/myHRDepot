import { Building2 } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
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
import type { MhdCompany } from '@/features/companies/Types';

type MhdCompanyListProps = {
  companies: MhdCompany[];
  selectedCompanyId?: string | null;
  onSelectCompany: (company: MhdCompany) => void;
};

export function MhdCompanyList({
  companies,
  selectedCompanyId,
  onSelectCompany,
}: MhdCompanyListProps) {
  const pagination = useMhdPagination(companies.length, {
    resetKey: `${companies.length}:${companies[0]?.id ?? ''}`,
  });

  if (companies.length === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
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
            <MhdTh className="w-10">
              <input
                type="checkbox"
                aria-label="Select all companies"
                className="h-4 w-4 rounded"
              />
            </MhdTh>
            <MhdTh>Reference</MhdTh>
            <MhdTh>Company</MhdTh>
            <MhdTh>Industry</MhdTh>
            <MhdTh>Updated</MhdTh>
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {pagination.sliceItems(companies).map((company) => (
            <MhdTr
              key={company.id}
              to={`/companies/${company.id}`}
              className={
                selectedCompanyId === company.id
                  ? 'bg-accent-tint hover:bg-accent-tint/60'
                  : undefined
              }
            >
              <MhdTd>
                <input
                  type="checkbox"
                  checked={selectedCompanyId === company.id}
                  onChange={() => onSelectCompany(company)}
                  aria-label={`Select ${company.companyName}`}
                  className="h-4 w-4 rounded"
                />
              </MhdTd>
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
              <MhdTd className="whitespace-nowrap text-sm text-muted-foreground">
                {new Date(company.updatedAt).toLocaleDateString()}
              </MhdTd>
              <MhdTableActions
                viewTo={`/companies/${company.id}`}
                editTo={`/companies/${company.id}/edit`}
              />
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
      <MhdTableFooter summary={mhdPaginationSummary(pagination, companies.length, 'companies')}>
        <MhdPaginationControls pagination={pagination} />
      </MhdTableFooter>
    </MhdCard>
  );
}
