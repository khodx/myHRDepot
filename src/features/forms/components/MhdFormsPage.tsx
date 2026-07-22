import { Link } from 'react-router-dom';
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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">My HR Depot</p>
            <h1 className="text-2xl font-bold text-slate-900">Forms Engine</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage form definitions, open the runtime renderer, and review submissions.
            </p>
          </div>
          {canMutate ? (
            <Link
              to="/forms/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Create Form
            </Link>
          ) : null}
        </div>

        {formState.errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formState.errorMessage}</div>
        ) : null}

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Filter</h2>
            <p className="mt-1 text-sm text-slate-600">The live list comes from `mhd_list_forms` for the authenticated company.</p>
          </div>

          <select
            value={formState.filters.status}
            onChange={(event) =>
              formState.setFilters((current) => ({
                ...current,
                status: event.target.value as MhdFormStatus | 'ALL',
              }))
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {formState.drafts.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">My Draft Submissions</h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {formState.drafts.map((draft) => (
                <div key={draft.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{draft.referenceId}</p>
                  <p className="mt-1 text-xs text-slate-500">Updated {new Date(draft.updatedAt ?? draft.createdAt).toLocaleString()}</p>
                  <Link
                    to={`/forms/${draft.formId}/render?submissionId=${draft.id}`}
                    className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Resume Draft
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <MhdFormList forms={formState.forms} isLoading={formState.isLoading} canMutate={canMutate} />
      </div>
    </main>
  );
}
