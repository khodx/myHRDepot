import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import type { MhdForm } from '../Types';

interface MhdFormListProps {
  forms: MhdForm[];
  isLoading: boolean;
  /** False for read-only roles (Viewer): /forms/:formId opens a read-only view, so the link is labeled "View". */
  canMutate?: boolean;
}

function statusBadgeVariant(status: MhdForm['status']): MhdBadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'ARCHIVED':
      return 'neutral';
    case 'DRAFT':
    default:
      return 'warning';
  }
}

export function MhdFormList({ forms, isLoading, canMutate = true }: MhdFormListProps) {
  if (isLoading) {
    return <MhdCard className="p-6 text-sm text-muted-foreground">Loading forms...</MhdCard>;
  }

  if (forms.length === 0) {
    return (
      <MhdCard className="border-dashed">
        <MhdEmptyState icon={FileText} title="No forms found" description="No forms found for the selected status filter." />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Form</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Version</MhdTh>
            <MhdTh>Updated</MhdTh>
            <MhdTh className="text-right">Actions</MhdTh>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <MhdTr key={form.id}>
              <MhdTd>
                <div>
                  <p className="font-medium text-foreground">{form.name}</p>
                  <p className="text-xs text-muted-foreground">{form.referenceId}</p>
                  {form.description ? <p className="mt-1 text-sm text-muted-foreground">{form.description}</p> : null}
                </div>
              </MhdTd>
              <MhdTd>
                <MhdBadge variant={statusBadgeVariant(form.status)}>{form.status}</MhdBadge>
              </MhdTd>
              <MhdTd className="text-sm text-muted-foreground">{form.version}</MhdTd>
              <MhdTd className="text-sm text-muted-foreground">{new Date(form.updatedAt).toLocaleString()}</MhdTd>
              <MhdTd>
                <div className="flex justify-end gap-3 text-sm font-semibold">
                  <Link to={`/forms/${form.id}`} className="text-accent hover:text-accent-hover">
                    {canMutate ? 'Builder' : 'View'}
                  </Link>
                  <Link to={`/forms/${form.id}/render`} className="text-accent hover:text-accent-hover">
                    Render
                  </Link>
                  <Link to={`/forms/${form.id}/submissions`} className="text-accent hover:text-accent-hover">
                    Submissions
                  </Link>
                </div>
              </MhdTd>
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
    </MhdCard>
  );
}
