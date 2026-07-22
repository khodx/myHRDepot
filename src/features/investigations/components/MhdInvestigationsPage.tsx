import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mhdCanOpenInvestigation } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateInvestigationCase,
  useMhdInvestigationCases,
  useMhdInvestigationPeople,
} from '../Hook';
import type { MhdInvestigationCaseFormValues } from '../Schemas';
import {
  MHD_INVESTIGATION_STATUSES,
  mhdFormatInvestigationStatus,
  type MhdInvestigationCaseFilters,
} from '../Types';
import { MhdCaseTypeBadge } from './MhdCaseTypeBadge';
import { MhdDispositionBadge } from './MhdDispositionBadge';
import { MhdInvestigationCaseForm } from './MhdInvestigationCaseForm';
import { MhdInvestigationStatusBadge } from './MhdInvestigationStatusBadge';

/**
 * `/investigations` — the case board, showing ONLY cases the viewer holds a grant
 * on. The list RPC is grant-filtered server-side; there is no role that widens
 * it. The sidebar entry that routes here is itself gated on this list returning
 * ≥1 row (a fresh admin does not see "Investigations" until granted a case), so
 * reaching this page with an empty list is a normal, expected state.
 *
 * Route-entry page: reads `useMhdAuth()` and `useNavigate()` itself, per the app
 * convention. `canOpenCase` (the privileged set that may OPEN a case) gates ONLY
 * the "New investigation" affordance — it does NOT gate visibility. What a user
 * can SEE is decided entirely by grants; a privileged admin with no grants still
 * sees an empty board.
 *
 * Existence non-disclosure: an empty list means "no investigations you have
 * access to" — it must NEVER imply that cases exist which the viewer cannot see.
 * A case a user has no grant for does not appear here, in any count, or anywhere.
 */
export function MhdInvestigationsPage() {
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const canOpenCase = mhdCanOpenInvestigation(roles);

  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState<MhdInvestigationCaseFilters>({
    companyId: companyId || null,
    status: 'ALL',
  });

  const cases = useMhdInvestigationCases(filters);
  // People are only needed to populate the investigator picker on the create
  // form, which only the privileged set can open.
  const people = useMhdInvestigationPeople(canOpenCase && companyId ? companyId : null);
  const createCase = useMhdCreateInvestigationCase();

  const investigatorOptions = useMemo(
    () =>
      (people.data ?? []).map((person: { id: string; firstName?: string; lastName?: string }) => ({
        id: person.id,
        displayName: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  function openCase(caseId: string) {
    navigate(`/investigations/${caseId}`);
  }

  async function handleCreate(values: MhdInvestigationCaseFormValues) {
    const result = await createCase.mutateAsync({
      companyId: values.companyId,
      caseType: values.caseType,
      allegation: values.allegation,
      assignedInvestigator: values.assignedInvestigator ?? null,
      severity: values.severity ?? null,
      confidentiality: values.confidentiality,
    });
    setIsCreating(false);
    openCase(result.id);
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Investigations</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cases you have been granted access to. Access is per case, by grant — never by role.
          </p>
        </div>
        {canOpenCase && companyId ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50"
          >
            New investigation
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value as MhdInvestigationCaseFilters['status'],
            }))
          }
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {MHD_INVESTIGATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatInvestigationStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {cases.isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (cases.data ?? []).length === 0 ? (
        // Honest, non-disclosing empty state. It says only that the viewer has
        // access to nothing — never that hidden cases exist beyond their grants.
        <p className="text-sm text-neutral-500">No investigations you have access to.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Reference</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Severity</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Disposition</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(cases.data ?? []).map((investigation) => (
                <tr key={investigation.id} className="border-b border-neutral-100 text-neutral-800">
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs">
                    {investigation.referenceId}
                  </td>
                  <td className="py-2 pr-4">
                    <MhdCaseTypeBadge caseType={investigation.caseType} />
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                    {investigation.severity ?? '—'}
                  </td>
                  <td className="py-2 pr-4">
                    <MhdInvestigationStatusBadge status={investigation.status} />
                  </td>
                  <td className="py-2 pr-4">
                    <MhdDispositionBadge disposition={investigation.disposition} />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openCase(investigation.id)}
                      className="text-sm text-neutral-500 underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreating && canOpenCase && companyId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Open an investigation</h2>
            <MhdInvestigationCaseForm
              companyId={companyId}
              investigators={investigatorOptions}
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              isSubmitting={createCase.isPending}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
