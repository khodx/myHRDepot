import { Link } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateForms } from '@/appshell/mhdRouteAccess';
import { useMhdFormsIndex } from '../Hook';
import type { MhdFormStatus } from '../Types';
import { MhdFormList } from './MhdFormList';

const STATUS_OPTIONS: Array<{ value: MhdFormStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function MhdFormsPage() {
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateForms(roles);
  const formState = useMhdFormsIndex(profile?.companyId ?? null);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Forms Engine"
        description="Manage form definitions, open the runtime renderer, and review submissions."
        actions={
          canMutate ? (
            <Link
              to="/forms/new"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover"
            >
              Create Form
            </Link>
          ) : null
        }
      />

      {formState.errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formState.errorMessage}
        </div>
      ) : null}

      <MhdCard className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Filter
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The live list comes from `mhd_list_forms` for the authenticated company.
          </p>
        </div>

        <select
          value={formState.filters.status}
          onChange={(event) =>
            formState.setFilters((current) => ({
              ...current,
              status: event.target.value as MhdFormStatus | 'ALL',
            }))
          }
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </MhdCard>

      {formState.drafts.length > 0 ? (
        <MhdCard>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            My Draft Submissions
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {formState.drafts.map((draft) => (
              <div key={draft.id} className="rounded-md border border-border bg-muted p-3">
                <p className="text-sm font-semibold text-foreground">{draft.referenceId}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {new Date(draft.updatedAt ?? draft.createdAt).toLocaleString()}
                </p>
                <Link
                  to={`/forms/${draft.formId}/render?submissionId=${draft.id}`}
                  className="mt-3 inline-block text-sm font-semibold text-accent hover:text-accent-hover"
                >
                  Resume Draft
                </Link>
              </div>
            ))}
          </div>
        </MhdCard>
      ) : null}

      <MhdFormList forms={formState.forms} isLoading={formState.isLoading} canMutate={canMutate} />
    </div>
  );
}
