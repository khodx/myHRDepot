import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Circle, FileSignature, Loader2, Plus, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { mhdCanMutateConduct } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  mhdConductCaseTransitionSchema,
  mhdConductOutcomeSchema,
  type MhdConductActionFormSchemaInput,
  type MhdConductCaseTransitionSchemaInput,
  type MhdConductOutcomeSchemaInput,
} from '../Schemas';
import {
  useMhdConductActionCeremony,
  useMhdConductActions,
  useMhdConductActionsMutations,
  useMhdConductCase,
  useMhdConductUsers,
} from '../Hook';
import {
  type MhdConductAction,
  type MhdConductActionOutcome,
  type MhdConductCeremonyStepState,
  mhdFormatConductActionStatus,
  mhdFormatConductCategory,
  mhdIsConductCaseCloseable,
} from '../Types';
import { MhdActionOutcomeBadge } from './MhdActionOutcomeBadge';
import { MhdConductActionForm } from './MhdConductActionForm';
import { MhdConductCaseStatusBadge } from './MhdConductCaseStatusBadge';
import { MhdSeverityBadge } from './MhdSeverityBadge';

function MhdCeremonyStepIcon({ step }: { step: MhdConductCeremonyStepState }) {
  if (step.status === 'DONE') return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Done" />;
  if (step.status === 'RUNNING') return <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-label="Running" />;
  if (step.status === 'ERROR') return <XCircle className="h-4 w-4 text-red-600" aria-label="Failed" />;
  return <Circle className="h-4 w-4 text-muted-foreground" aria-label="Pending" />;
}

/** Rescind dialog — a discipline decision reversed. A reason is required (CHECK-mirrored). */
function MhdRescindCaseForm({
  referenceId,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  referenceId: string;
  onSubmit: (input: MhdConductCaseTransitionSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdConductCaseTransitionSchemaInput>({
    resolver: zodResolver(mhdConductCaseTransitionSchema),
    defaultValues: { newStatus: 'RESCINDED' },
  });

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="mhd-conduct-rescind-reason" className="mb-1 block text-sm font-medium">
          Rescind Reason (required)
        </label>
        <textarea
          id="mhd-conduct-rescind-reason"
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="e.g. Investigation cleared the employee — the corrective action is withdrawn."
          {...register('rescindReason')}
        />
        {errors.rescindReason ? <p className="mt-1 text-xs text-red-600">{errors.rescindReason.message}</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Rescinding {referenceId} is terminal: the case and its actions become immutable. The change is audited.
      </p>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Rescinding…' : 'Rescind Case'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Keep Case Open
        </button>
      </div>
    </form>
  );
}

/**
 * Outcome dialog for an ISSUED action. `outcome` is preset by the button the
 * operator clicked, so the form only collects what that outcome needs:
 *
 *   - ACKNOWLEDGED — records RECEIPT. No reason. The copy is explicit that this
 *     is acknowledgment of *receipt*, never agreement, and the RPC will refuse
 *     it while the signature request is unsigned.
 *   - REFUSED — a reason (required) and an optional witness. Refusal is a
 *     first-class, complete record, not a stuck state.
 *   - WAIVED — a reason (required).
 *
 * This is an inline form, never window.prompt — a required, audited reason must
 * be a real, validated field.
 */
function MhdActionOutcomeForm({
  outcome,
  witnesses,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  outcome: MhdConductActionOutcome;
  witnesses: Array<{ id: string; label: string }>;
  onSubmit: (input: MhdConductOutcomeSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdConductOutcomeSchemaInput>({
    resolver: zodResolver(mhdConductOutcomeSchema),
    defaultValues: { outcome },
  });

  const needsReason = outcome === 'REFUSED' || outcome === 'WAIVED';

  return (
    <form className="mt-3 space-y-3 rounded-md border border-border bg-muted p-4" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" value={outcome} {...register('outcome')} />

      {outcome === 'ACKNOWLEDGED' ? (
        <p className="text-sm text-foreground">
          Record that the employee <strong>acknowledged receipt</strong> of this document. This is receipt, not
          agreement — it does not record that the employee agrees with the corrective action. Only available once the
          signature request has completed.
        </p>
      ) : null}

      {needsReason ? (
        <div>
          <label htmlFor="mhd-conduct-outcome-reason" className="mb-1 block text-sm font-medium">
            {outcome === 'REFUSED' ? 'Reason for Refusal (required)' : 'Reason for Waiver (required)'}
          </label>
          <textarea
            id="mhd-conduct-outcome-reason"
            className="w-full rounded border px-3 py-2"
            rows={3}
            placeholder={
              outcome === 'REFUSED'
                ? 'e.g. Employee read the warning and declined to sign it in the meeting.'
                : 'e.g. Signature waived — employee is on extended leave; delivered by certified mail.'
            }
            {...register('reason')}
          />
          {errors.reason ? <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p> : null}
        </div>
      ) : null}

      {outcome === 'REFUSED' ? (
        <div>
          <label htmlFor="mhd-conduct-outcome-witness" className="mb-1 block text-sm font-medium">
            Witness (optional)
          </label>
          <select id="mhd-conduct-outcome-witness" className="w-full rounded border px-3 py-2" {...register('witnessUserId')}>
            <option value="">No witness recorded</option>
            {witnesses.map((witness) => (
              <option key={witness.id} value={witness.id}>
                {witness.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            A witnessed refusal is a complete record — the discipline stands even though the employee declined to sign.
          </p>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Recording…'
            : outcome === 'ACKNOWLEDGED'
              ? 'Record Acknowledgment of Receipt'
              : outcome === 'REFUSED'
                ? 'Record Refusal'
                : 'Record Waiver'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * A single rung of the action ladder. Draft actions can be edited, deleted, and
 * issued (the ceremony); issued actions expose the three terminal outcomes; the
 * terminal states are read-only with their outcome recorded.
 */
function MhdConductActionRow({
  action,
  canMutate,
  caseIsOpen,
  witnesses,
  isCeremonyTarget,
  ceremonySteps,
  onEdit,
  onDelete,
  onIssue,
  onRecordOutcome,
  isIssuing,
  isRecording,
  isDeleting,
}: {
  action: MhdConductAction;
  canMutate: boolean;
  caseIsOpen: boolean;
  witnesses: Array<{ id: string; label: string }>;
  isCeremonyTarget: boolean;
  ceremonySteps: MhdConductCeremonyStepState[];
  onEdit: () => void;
  onDelete: () => void;
  onIssue: () => void;
  onRecordOutcome: (outcome: MhdConductActionOutcome, input: MhdConductOutcomeSchemaInput) => Promise<void>;
  isIssuing: boolean;
  isRecording: boolean;
  isDeleting: boolean;
}) {
  const [outcomeMode, setOutcomeMode] = useState<MhdConductActionOutcome | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDraft = action.status === 'DRAFT';
  const isIssued = action.status === 'ISSUED';
  const isSigned = action.esignatureStatus === 'COMPLETED';
  // ACKNOWLEDGED is gated on the signature request completing (server re-checks);
  // reflect that here so the button is not offered while the document is unsigned.
  const canAcknowledge = !action.requiresDocument || isSigned;

  async function handleOutcomeSubmit(input: MhdConductOutcomeSchemaInput) {
    if (!outcomeMode) return;
    await onRecordOutcome(outcomeMode, input);
    setOutcomeMode(null);
  }

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">#{action.sortOrder}</span>
            <MhdSeverityBadge severity={action.severity} />
            <MhdActionOutcomeBadge status={action.status} />
            <span className="text-xs text-muted-foreground">{action.referenceId}</span>
          </div>
          {action.actionSummary ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{action.actionSummary}</p>
          ) : null}

          {action.esignatureRequestId ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Signature request:{' '}
              <Link to={`/esignature/${action.esignatureRequestId}`} className="text-accent hover:text-accent-hover">
                {action.esignatureStatus ?? 'Unknown'}
              </Link>
            </p>
          ) : null}

          {action.outcomeReason ? (
            <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
              <span className="font-medium">{mhdFormatConductActionStatus(action.status)} reason:</span>{' '}
              {action.outcomeReason}
            </p>
          ) : null}
        </div>

        {canMutate && caseIsOpen ? (
          <div className="flex flex-wrap gap-2">
            {isDraft ? (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Edit
                </button>
                {isConfirmingDelete ? (
                  <span className="inline-flex items-center gap-2 rounded border border-rose-300 bg-rose-50 px-2 py-1">
                    <span className="text-xs font-medium text-rose-700">Delete draft {action.referenceId}?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmingDelete(false);
                        onDelete();
                      }}
                      disabled={isDeleting}
                      className="rounded bg-rose-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting…' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-card"
                    >
                      Keep
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    disabled={isDeleting}
                    className="rounded border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
                <Button
                  type="button"
                  onClick={onIssue}
                  disabled={isIssuing}
                  className="gap-1.5 px-3 py-1.5 text-xs font-semibold"
                >
                  <FileSignature className="h-3.5 w-3.5" />
                  {isIssuing && isCeremonyTarget ? 'Issuing…' : action.requiresDocument ? 'Issue & Send' : 'Issue'}
                </Button>
              </>
            ) : null}

            {isIssued ? (
              <>
                <button
                  type="button"
                  onClick={() => setOutcomeMode('ACKNOWLEDGED')}
                  disabled={!canAcknowledge}
                  title={
                    canAcknowledge
                      ? undefined
                      : 'Available once the employee has signed. Until then, record a refusal or waiver.'
                  }
                  className="rounded border border-sky-300 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                >
                  Acknowledged (Receipt)
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeMode('REFUSED')}
                  className="rounded border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Refused
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeMode('WAIVED')}
                  className="rounded border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                >
                  Waived
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {isCeremonyTarget && ceremonySteps.length > 0 ? (
        <ol className="mt-3 space-y-1.5 border-t border-border pt-3">
          {ceremonySteps.map((step) => (
            <li key={step.key} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5">
                <MhdCeremonyStepIcon step={step} />
              </span>
              <span className={step.status === 'ERROR' ? 'text-red-700' : 'text-muted-foreground'}>
                {step.label}
                {step.status === 'ERROR' && step.errorMessage ? (
                  <span className="mt-0.5 block text-red-600">{step.errorMessage}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {outcomeMode ? (
        <MhdActionOutcomeForm
          outcome={outcomeMode}
          witnesses={witnesses}
          onSubmit={handleOutcomeSubmit}
          onCancel={() => setOutcomeMode(null)}
          isSubmitting={isRecording}
        />
      ) : null}
    </li>
  );
}

/**
 * /conduct/:caseId — admits the same three privileged roles as the board route.
 * The subject employee is NEVER routed here; they reach their document only
 * through the signing link. The company id arrives via router state from the
 * board (cross-company admins), falling back to the viewer's own company.
 */
export function MhdConductCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateConduct(roles);

  const stateCompanyId = (location.state as { companyId?: string } | null)?.companyId;
  const companyId = stateCompanyId && stateCompanyId !== 'ALL' ? stateCompanyId : profile?.companyId ?? null;

  const [isAddingAction, setIsAddingAction] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [isRescinding, setIsRescinding] = useState(false);
  const [ceremonyActionId, setCeremonyActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const caseQuery = useMhdConductCase(companyId, caseId ?? null);
  const conductCase = caseQuery.data ?? null;
  const actionsQuery = useMhdConductActions(caseId ?? null);
  const actions = useMemo(() => actionsQuery.data ?? [], [actionsQuery.data]);
  const mutations = useMhdConductActionsMutations();
  const ceremony = useMhdConductActionCeremony();
  const usersQuery = useMhdConductUsers(companyId, Boolean(companyId));
  const witnesses = (usersQuery.data ?? []).map((user) => ({ id: user.id, label: user.displayName }));

  const editingAction = useMemo(
    () => actions.find((action) => action.id === editingActionId) ?? null,
    [actions, editingActionId],
  );

  const isOpen = conductCase?.status === 'OPEN';
  const closeable = conductCase ? mhdIsConductCaseCloseable(conductCase) : false;
  const nonTerminalCount = conductCase ? conductCase.actionCount - conductCase.terminalCount : 0;

  async function handleAddAction(input: MhdConductActionFormSchemaInput) {
    if (!conductCase) return;
    setActionError(null);
    try {
      await mutations.createAction.mutateAsync({
        caseId: conductCase.id,
        severity: input.severity,
        actionSummary: input.actionSummary,
        requiresDocument: input.requiresDocument,
      });
      setIsAddingAction(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to add the action.');
    }
  }

  async function handleEditAction(input: MhdConductActionFormSchemaInput) {
    if (!editingActionId) return;
    setActionError(null);
    try {
      await mutations.updateAction.mutateAsync({
        actionId: editingActionId,
        input: { severity: input.severity, actionSummary: input.actionSummary },
      });
      setEditingActionId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update the action.');
    }
  }

  async function handleDeleteAction(action: MhdConductAction) {
    setActionError(null);
    try {
      await mutations.deleteAction.mutateAsync(action.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete the action.');
    }
  }

  async function handleIssueAction(action: MhdConductAction) {
    if (!conductCase || !companyId) return;
    setActionError(null);
    setCeremonyActionId(action.id);
    try {
      // The ceremony resolves the template by severity, renders and hashes the
      // document, creates the signature request with the subject as external
      // signer, then issues the action. The document is routed for the
      // employee's acknowledgment of receipt — never their agreement.
      await ceremony.issue({
        actionId: action.id,
        caseId: conductCase.id,
        companyId,
        personId: conductCase.personId,
        severity: action.severity,
        requiresDocument: action.requiresDocument,
        actionSummary: action.actionSummary,
        caseReferenceId: conductCase.referenceId,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'The corrective-action ceremony did not complete. Review the step progress on the action — no signature request was sent unless that step shows done.',
      );
    }
  }

  async function handleRecordOutcome(
    action: MhdConductAction,
    outcome: MhdConductActionOutcome,
    input: MhdConductOutcomeSchemaInput,
  ) {
    setActionError(null);
    try {
      await mutations.recordOutcome.mutateAsync({
        actionId: action.id,
        input: { outcome, reason: input.reason, witnessUserId: input.witnessUserId },
      });
    } catch (error) {
      // The server re-checks the acknowledged-requires-signed gate; surface its refusal verbatim.
      setActionError(error instanceof Error ? error.message : 'Unable to record the outcome.');
      throw error;
    }
  }

  async function handleClose() {
    if (!conductCase) return;
    setActionError(null);
    try {
      await mutations.transitionCase.mutateAsync({ caseId: conductCase.id, input: { newStatus: 'CLOSED' } });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to close the case.');
    }
  }

  async function handleRescind(input: MhdConductCaseTransitionSchemaInput) {
    if (!conductCase) return;
    setActionError(null);
    try {
      await mutations.transitionCase.mutateAsync({
        caseId: conductCase.id,
        input: { newStatus: 'RESCINDED', rescindReason: input.rescindReason },
      });
      setIsRescinding(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to rescind the case.');
    }
  }

  if (caseQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading conduct case…</div>;
  }

  if (caseQuery.error || !conductCase) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {caseQuery.error instanceof Error ? caseQuery.error.message : 'Case not found or you do not have access to it.'}
        </p>
        <button type="button" onClick={() => navigate('/conduct')} className="text-sm text-accent hover:text-accent-hover">
          Back to Conduct
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdBreadcrumb items={[{ label: 'Conduct', to: '/conduct' }, { label: conductCase.referenceId }]} />

      {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}
      {actionsQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionsQuery.error instanceof Error ? actionsQuery.error.message : 'Unable to load the action ladder.'}
        </div>
      ) : null}

      <MhdPageHeader
        title={conductCase.personDisplayName ?? 'Conduct Case'}
        chips={
          <>
            <MhdBadge variant="accent">{mhdFormatConductCategory(conductCase.category)}</MhdBadge>
            <MhdConductCaseStatusBadge status={conductCase.status} />
          </>
        }
        actions={
          canMutate && isOpen ? (
            <>
              <span title={closeable ? undefined : `Cannot close: ${nonTerminalCount} action(s) not yet terminal.`}>
                <button
                  type="button"
                  onClick={() => void handleClose()}
                  disabled={!closeable || mutations.transitionCase.isPending}
                  aria-disabled={!closeable}
                  className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {mutations.transitionCase.isPending ? 'Working…' : 'Close Case'}
                </button>
              </span>
              <button
                type="button"
                onClick={() => setIsRescinding((current) => !current)}
                className="rounded-md border border-rose-300 bg-card px-4 py-2 text-sm font-semibold text-rose-700"
              >
                {isRescinding ? 'Close Rescind' : 'Rescind Case'}
              </button>
            </>
          ) : undefined
        }
        description={
          <>
            <span>{conductCase.referenceId}</span>
            <span className="mx-2">·</span>
            <span>
              Person{' '}
              <Link to={`/people/${conductCase.personId}`} className="text-accent hover:text-accent-hover">
                {conductCase.personDisplayName ?? 'View person'}
              </Link>
            </span>
            <span className="mx-2">·</span>
            <span>
              {conductCase.terminalCount} / {conductCase.actionCount} actions terminal
            </span>
          </>
        }
      />

      {isOpen && !closeable ? (
        <p className="text-xs text-muted-foreground">
          Close is unavailable while {nonTerminalCount} action{nonTerminalCount === 1 ? ' is' : 's are'} not yet
          terminal. Acknowledge, refuse, or waive each issued action first.
        </p>
      ) : null}

      {conductCase.status === 'RESCINDED' ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="text-xs font-semibold uppercase tracking-wide">Rescinded</p>
          <p className="mt-2">This case was withdrawn. Its actions are immutable.</p>
        </div>
      ) : null}

      {isRescinding && canMutate && isOpen ? (
        <MhdCard className="border-rose-200">
          <MhdCardHeader title="Rescind Case" />
          <MhdRescindCaseForm
            referenceId={conductCase.referenceId}
            onSubmit={handleRescind}
            onCancel={() => setIsRescinding(false)}
            isSubmitting={mutations.transitionCase.isPending}
          />
        </MhdCard>
      ) : null}

      <MhdCard>
        <MhdCardHeader
          title="Action Ladder"
          action={
            canMutate && isOpen ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsAddingAction((current) => !current);
                  setEditingActionId(null);
                }}
                className="gap-1.5 px-3 py-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAddingAction ? 'Close' : 'Add Action'}
              </Button>
            ) : undefined
          }
        />

        <p className="mt-1 text-sm text-muted-foreground">
          Each rung is a corrective action. Issuing an action that generates a document renders it and routes it to
          the employee for <strong>acknowledgment of receipt</strong> — signing records that the employee received
          the document, never that they agree with it. An employee may instead refuse (witnessed) or the signature
          may be waived; both are complete outcomes.
        </p>

        {isAddingAction && canMutate && isOpen ? (
          <div className="mt-4 rounded-lg border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">New Action</h3>
            <MhdConductActionForm
              mode="create"
              onSubmit={handleAddAction}
              onCancel={() => setIsAddingAction(false)}
              isSubmitting={mutations.createAction.isPending}
            />
          </div>
        ) : null}

        {actionsQuery.isLoading ? (
          <div className="mt-4 flex h-24 items-center justify-center text-sm text-muted-foreground">Loading actions…</div>
        ) : actions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No actions yet. Add the first rung of the ladder.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {actions.map((action) =>
              editingActionId === action.id && editingAction ? (
                <li key={action.id} className="rounded-lg border border-accent/30 bg-accent-tint p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Edit Draft Action</h3>
                  <MhdConductActionForm
                    mode="edit"
                    initial={editingAction}
                    onSubmit={handleEditAction}
                    onCancel={() => setEditingActionId(null)}
                    isSubmitting={mutations.updateAction.isPending}
                  />
                </li>
              ) : (
                <MhdConductActionRow
                  key={action.id}
                  action={action}
                  canMutate={canMutate}
                  caseIsOpen={isOpen}
                  witnesses={witnesses}
                  isCeremonyTarget={ceremonyActionId === action.id}
                  ceremonySteps={ceremonyActionId === action.id ? ceremony.steps : []}
                  onEdit={() => {
                    setEditingActionId(action.id);
                    setIsAddingAction(false);
                  }}
                  onDelete={() => void handleDeleteAction(action)}
                  onIssue={() => void handleIssueAction(action)}
                  onRecordOutcome={(outcome, input) => handleRecordOutcome(action, outcome, input)}
                  isIssuing={ceremony.isIssuing}
                  isRecording={mutations.recordOutcome.isPending}
                  isDeleting={mutations.deleteAction.isPending}
                />
              ),
            )}
          </ul>
        )}
      </MhdCard>
    </div>
  );
}
