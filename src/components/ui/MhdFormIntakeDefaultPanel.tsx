import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import { mhdFormService } from '@/features/forms/Service';
import { useMhdFormIntakeDefaults } from '@/features/forms/Hook';
import type { MhdFormIntakeKind } from '@/features/forms/Types';

interface Props {
  companyId: string;
  intakeKind: MhdFormIntakeKind;
  label: string;
}

/**
 * Shared admin panel for designating a company's canonical intake form for a
 * cross-module case-creation flow (0219, closes the Multi-Tenant Library
 * Architecture build's documented modal-route gap). Lives in
 * `components/ui` rather than `features/forms/components` because it is
 * consumed directly by the Leaves Policy Library and the Accommodations
 * Option Library pages — a cross-feature `components/` import would violate
 * the feature-boundary ESLint rule (cross-feature imports must go through a
 * feature's Hook/Service/Types/Schemas, never another feature's components).
 */
export function MhdFormIntakeDefaultPanel({ companyId, intakeKind, label }: Props) {
  const defaults = useMhdFormIntakeDefaults(companyId);
  const forms = useQuery({
    queryKey: ['mhd-form-intake-default-forms', companyId],
    queryFn: () => mhdFormService.listFormsForCompany(companyId, 'ACTIVE'),
    enabled: Boolean(companyId),
  });
  const [selectedFormId, setSelectedFormId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const current = defaults.defaults.find((entry) => entry.intakeKind === intakeKind);
  const eligibleForms = (forms.data ?? []).filter(
    (form) => form.intakeKind === intakeKind && form.status === 'ACTIVE',
  );

  async function handleSetDefault() {
    if (!selectedFormId) return;
    setErrorMessage(null);
    try {
      await defaults.setDefault(intakeKind, selectedFormId);
      setSelectedFormId('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to set default intake form.',
      );
    }
  }

  async function handleClearDefault() {
    setErrorMessage(null);
    try {
      await defaults.clearDefault(intakeKind);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to clear default intake form.',
      );
    }
  }

  const loadError =
    errorMessage ??
    defaults.errorMessage ??
    (forms.error instanceof Error ? forms.error.message : null);

  return (
    <MhdCard className="mb-6 space-y-4">
      <div className="flex items-start gap-3">
        <Settings className="mt-1 h-5 w-5 text-accent" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-foreground">{label} Intake Form</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the active form that opens when employees create a {label.toLowerCase()} case.
          </p>
        </div>
      </div>
      {loadError ? <p className="text-sm text-rose-700">{loadError}</p> : null}
      {defaults.isLoading || forms.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading intake forms…</p>
      ) : eligibleForms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No eligible forms are available. Open Forms Studio and tag a form with the “{label} Case
          Intake” destination first.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px]">
            <MhdSearchableSelect
              id={`mhd-${intakeKind}-default-form`}
              options={eligibleForms.map((form) => ({ id: form.id, label: form.name }))}
              value={selectedFormId}
              onChange={setSelectedFormId}
              placeholder="Select a form"
              emptyMessage="No active tagged forms."
            />
          </div>
          <Button
            disabled={!selectedFormId || defaults.isLoading}
            onClick={() => void handleSetDefault()}
          >
            Set Default
          </Button>
          {current ? (
            <>
              <span className="text-sm text-muted-foreground">Current: {current.formName}</span>
              <Button
                variant="secondary"
                disabled={defaults.isLoading}
                onClick={() => void handleClearDefault()}
              >
                Clear Default
              </Button>
            </>
          ) : null}
        </div>
      )}
    </MhdCard>
  );
}
