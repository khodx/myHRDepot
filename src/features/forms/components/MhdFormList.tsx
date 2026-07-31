import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import type { MhdForm } from '../Types';

interface MhdFormListProps {
  forms: MhdForm[];
  isLoading: boolean;
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

export function MhdFormList({ forms, isLoading }: MhdFormListProps) {
  const location = useLocation();

  if (isLoading) {
    return <MhdCard className="p-6 text-sm text-muted-foreground">Loading forms...</MhdCard>;
  }

  if (forms.length === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
        <MhdEmptyState
          icon={FileText}
          title="No forms found"
          description="No forms found for the selected status filter."
        />
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
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <MhdTr key={form.id} to={`/forms/${form.id}`}>
              <MhdTd>
                <div>
                  <p className="font-medium text-foreground">{form.name}</p>
                  <p className="text-xs text-muted-foreground">{form.referenceId}</p>
                  {form.description ? (
                    <MhdRichTextRenderer html={form.description} className="mt-1 line-clamp-2" />
                  ) : null}
                </div>
              </MhdTd>
              <MhdTd>
                <MhdBadge variant={statusBadgeVariant(form.status)}>{form.status}</MhdBadge>
              </MhdTd>
              <MhdTd className="text-sm text-muted-foreground">{form.version}</MhdTd>
              <MhdTd className="text-sm text-muted-foreground">
                {new Date(form.updatedAt).toLocaleString()}
              </MhdTd>
              <MhdTableActions
                viewTo={`/forms/${form.id}`}
                secondaryActions={
                  <>
                    <Link
                      to={`/forms/${form.id}/render`}
                      state={{ backgroundLocation: location }}
                      className="text-accent hover:text-accent-hover"
                    >
                      Open Form
                    </Link>
                    <Link
                      to={`/forms/${form.id}/submissions`}
                      className="text-accent hover:text-accent-hover"
                    >
                      Submissions
                    </Link>
                  </>
                }
              />
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
      <MhdTableFooter summary={`Showing 1 to ${forms.length} of ${forms.length} forms`} />
    </MhdCard>
  );
}
