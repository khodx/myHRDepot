import { Link } from 'react-router-dom';
import type { MhdForm } from '../Types';

interface MhdFormListProps {
  forms: MhdForm[];
  isLoading: boolean;
}

function statusBadgeClass(status: MhdForm['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700';
    case 'ARCHIVED':
      return 'bg-slate-200 text-slate-700';
    case 'DRAFT':
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

export function MhdFormList({ forms, isLoading }: MhdFormListProps) {
  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading forms...</div>;
  }

  if (forms.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No forms found for the selected status filter.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Form</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Version</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.id} className="border-t border-slate-100">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-slate-900">{form.name}</p>
                  <p className="text-xs text-slate-500">{form.referenceId}</p>
                  {form.description ? <p className="mt-1 text-sm text-slate-600">{form.description}</p> : null}
                </div>
              </td>
              <td className="px-4 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(form.status)}`}>
                  {form.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">{form.version}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{new Date(form.updatedAt).toLocaleString()}</td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-3 text-sm font-semibold">
                  <Link to={`/forms/${form.id}`} className="text-blue-700 hover:underline">
                    Builder
                  </Link>
                  <Link to={`/forms/${form.id}/render`} className="text-blue-700 hover:underline">
                    Render
                  </Link>
                  <Link to={`/forms/${form.id}/submissions`} className="text-blue-700 hover:underline">
                    Submissions
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
