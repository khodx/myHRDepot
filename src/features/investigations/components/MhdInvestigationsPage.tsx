import { ShieldQuestion } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
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
    <div className="space-y-6">
      <MhdPageHeader
        title="Investigations"
        description="Cases you have been granted access to. Access is per case, by grant — never by role."
        actions={
          canOpenCase && companyId ? (
            <Button type="button" onClick={() => setIsCreating(true)}>
              New investigation
            </Button>
          ) : undefined
        }
      />

      <MhdFilterBar>
        <MhdFilterSelect
          label="Status"
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value as MhdInvestigationCaseFilters['status'],
            }))
          }
        >
          <option value="ALL">All statuses</option>
          {MHD_INVESTIGATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatInvestigationStatus(status)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {cases.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (cases.data ?? []).length === 0 ? (
        // Honest, non-disclosing empty state. It says only that the viewer has
        // access to nothing — never that hidden cases exist beyond their grants.
        <MhdCard className="border-dashed">
          <MhdEmptyState icon={ShieldQuestion} title="No investigations you have access to." />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Type</MhdTh>
                <MhdTh>Severity</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Disposition</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {(cases.data ?? []).map((investigation) => (
                <MhdTr key={investigation.id}>
                  <MhdTd className="whitespace-nowrap font-mono text-xs">
                    {investigation.referenceId}
                  </MhdTd>
                  <MhdTd>
                    <MhdCaseTypeBadge caseType={investigation.caseType} />
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {investigation.severity ?? '—'}
                  </MhdTd>
                  <MhdTd>
                    <MhdInvestigationStatusBadge status={investigation.status} />
                  </MhdTd>
                  <MhdTd>
                    <MhdDispositionBadge disposition={investigation.disposition} />
                  </MhdTd>
                  <MhdTableActions
                    viewTo={`/investigations/${investigation.id}`}
                    editTo={`/investigations/${investigation.id}`}
                  />
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter
            summary={`Showing 1 to ${(cases.data ?? []).length} of ${(cases.data ?? []).length} investigations`}
          />
        </MhdCard>
      )}

      {isCreating && canOpenCase && companyId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">Open an investigation</h2>
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
