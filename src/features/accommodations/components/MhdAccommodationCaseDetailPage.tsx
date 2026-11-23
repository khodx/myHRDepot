import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { MhdAccommodationCaseRecordTabs } from '@/appshell/components/MhdAccommodationCaseRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdTaskService } from '@/features/tasks/Service';
import {
  mhdAccommodationsCanSeeMedical,
  mhdAccommodationsIsPrivileged,
} from '@/appshell/mhdRouteAccess';
import {
  useMhdAccommodationCase,
  useMhdAccommodationDenialReasonCodes,
  useMhdAccommodationDocumentTemplates,
  useMhdAccommodationDecision,
  useMhdAccommodationEmployeeCertify,
  useMhdAccommodationEquipment,
  useMhdAccommodationImplementation,
  useMhdAccommodationInteraction,
  useMhdAccommodationMedicalRecord,
  useMhdAccommodationMedicalReveal,
  useMhdAccommodationOption,
  useMhdAccommodationOptionCatalog,
  useMhdAccommodationProviderCertification,
  useMhdAccommodationReadiness,
  useMhdAccommodationRequestDetails,
  useMhdAccommodationReview,
  useMhdAccommodationTransition,
} from '../Hook';
import {
  mhdAccommodationDecisionBlockers,
  mhdAccommodationDenialReasonsSchema,
  mhdAccommodationEquipmentSchema,
  mhdAccommodationMedicalSchema,
  mhdAccommodationReasonsRequireContinuation,
} from '../Schemas';
import {
  MHD_ACCOMMODATION_DECIDE_FROM_STATUS,
  MHD_ACCOMMODATION_DENIAL_REASONS,
  MHD_ACCOMMODATION_DOCUMENTATION_STATUSES,
  MHD_ACCOMMODATION_DOCUMENTATION_TYPES,
  MHD_ACCOMMODATION_IMPLEMENT_FROM_STATUS,
  MHD_ACCOMMODATION_OPTION_TYPES,
  MHD_ACCOMMODATION_REQUEST_CHANNELS,
  MHD_ACCOMMODATION_STATUSES,
  mhdFormatAccommodationValue,
  type MhdAccommodationDenialReasonInput,
  type MhdAccommodationDocumentationStatus,
  type MhdAccommodationDocumentationType,
  type MhdAccommodationImplementation,
  type MhdAccommodationMedicalReveal,
  type MhdAccommodationRequestChannel,
  type MhdAccommodationStatus,
} from '../Types';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdAccommodationDenialReasonsField } from './MhdAccommodationDenialReasonsField';
import { MhdAccommodationDraftModal } from './MhdAccommodationDraftModal';
import { draftChoice, draftText } from './mhdAccommodationDraftValues';
import {
  MhdAccommodationEquipmentFields,
  type MhdAccommodationEquipmentErrors,
  type MhdAccommodationEquipmentUserOption,
  type MhdAccommodationEquipmentValue,
} from './MhdAccommodationEquipmentFields';
import { MhdAccommodationNoticesPanel } from './MhdAccommodationNoticesPanel';
import { MhdAccommodationProviderCertPanel } from './MhdAccommodationProviderCertPanel';
import { MhdAccommodationRequestDetailsPanel } from './MhdAccommodationRequestDetailsPanel';
import { MhdAccommodationReviewCompletion } from './MhdAccommodationReviewCompletion';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
type Tab =
  | 'process'
  | 'request'
  | 'options'
  | 'decision'
  | 'implementation'
  | 'medical'
  | 'provider'
  | 'notices';
type DecisionOutcome = 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';
const DECISION_OUTCOMES: readonly DecisionOutcome[] = ['APPROVED', 'PARTIALLY_APPROVED', 'DENIED'];

/** The input form open in a modal, if any. Each kind has its own draft key on this case. */
type CaseFormKind =
  'close' | 'status' | 'interaction' | 'option' | 'decision' | 'implement' | 'medical';
type OpenForm =
  | { kind: CaseFormKind }
  | { kind: 'equipment'; implementation: MhdAccommodationImplementation }
  | { kind: 'review'; reviewId: string; dueDate: string };

const EMPTY_EQUIPMENT: MhdAccommodationEquipmentValue = {
  orderedOn: '',
  orderedBy: '',
  receivedOn: '',
};

const WAITING_FOR_EQUIPMENT_MESSAGE =
  'Waiting For Equipment — the case stays in Implementing until it arrives.';

function draftEquipment(value: unknown): MhdAccommodationEquipmentValue {
  const saved = (value ?? {}) as Record<string, unknown>;
  return {
    orderedOn: draftText(saved.orderedOn),
    orderedBy: draftText(saved.orderedBy),
    receivedOn: draftText(saved.receivedOn),
  };
}

function draftDenialReasons(value: unknown): MhdAccommodationDenialReasonInput[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const saved = (item ?? {}) as Record<string, unknown>;
    if (!MHD_ACCOMMODATION_DENIAL_REASONS.includes(saved.code as never)) return [];
    return [
      {
        code: saved.code as MhdAccommodationDenialReasonInput['code'],
        detail: typeof saved.detail === 'string' ? saved.detail : null,
        alternativeOffered:
          typeof saved.alternativeOffered === 'string' ? saved.alternativeOffered : null,
      },
    ];
  });
}

/**
 * The "Update Equipment" modal on an existing implementation. Receipt of ordered equipment is
 * what lets the case leave IMPLEMENTING, so the dates are validated with the shared schema
 * before the RPC (which re-checks them) is called.
 */
function MhdAccommodationEquipmentUpdateModal({
  caseId,
  companyId,
  implementation,
  userOptions,
  onClose,
}: {
  caseId: string;
  companyId: string | null;
  implementation: MhdAccommodationImplementation;
  userOptions: MhdAccommodationEquipmentUserOption[];
  onClose: () => void;
}) {
  const recordEquipment = useMhdAccommodationEquipment(caseId);
  const [value, setValue] = useState<MhdAccommodationEquipmentValue>({
    orderedOn: implementation.equipment_ordered_on ?? '',
    orderedBy: implementation.equipment_ordered_by ?? '',
    receivedOn: implementation.equipment_received_on ?? '',
  });
  const [errors, setErrors] = useState<MhdAccommodationEquipmentErrors>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const parsed = mhdAccommodationEquipmentSchema.safeParse({
      implementationId: implementation.id,
      orderedOn: value.orderedOn || null,
      orderedBy: value.orderedBy || null,
      receivedOn: value.receivedOn || null,
    });
    if (!parsed.success) {
      const nextErrors: MhdAccommodationEquipmentErrors = {};
      const generalMessages: string[] = [];
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'orderedOn' || field === 'orderedBy' || field === 'receivedOn') {
          nextErrors[field] = nextErrors[field] ?? issue.message;
        } else {
          generalMessages.push(issue.message);
        }
      }
      setErrors(nextErrors);
      setError(generalMessages.length ? generalMessages.join(' ') : null);
      return false;
    }
    setErrors({});
    return recordEquipment.mutateAsync({
      implementationId: implementation.id,
      orderedOn: parsed.data.orderedOn ?? null,
      orderedBy: parsed.data.orderedBy ?? null,
      receivedOn: parsed.data.receivedOn ?? null,
    });
  }

  return (
    <MhdAccommodationDraftModal
      title="Update Equipment"
      size="md"
      draftKey={`${caseId}:equipment:${implementation.id}`}
      companyId={companyId}
      getDraftValues={() => ({ equipment: value })}
      onRestore={(payload) => setValue(draftEquipment(payload.equipment))}
      submitLabel="Save Equipment Dates"
      pendingLabel="Saving…"
      isSubmitting={recordEquipment.isPending}
      onSubmit={handleSave}
      onClose={onClose}
    >
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      <MhdAccommodationEquipmentFields
        idPrefix={`mhd-implementation-${implementation.id}`}
        value={value}
        onChange={setValue}
        disabled={recordEquipment.isPending}
        userOptions={userOptions}
        errors={errors}
      />
    </MhdAccommodationDraftModal>
  );
}

/**
 * accommodation_options.option_type is CHECK-constrained server-side
 * (accommodation_option_type_allowed, 0053) to a fixed enum, while the
 * option-catalog's own option_type (0186) is free text — a catalog entry's
 * title (e.g. "Adjustable-height desk") will not generally be one of the
 * allowed enum values. Picking a catalog entry therefore maps its broader
 * `category` to the nearest allowed case option_type (below) rather than
 * copying the catalog's free-text title into a constrained field, and folds
 * the catalog title into the prefilled description instead — both fields
 * remain fully editable afterward, never a locked template.
 */
const MHD_ACCOMMODATION_CATALOG_CATEGORY_TO_CASE_OPTION_TYPE: Record<string, string> = {
  SCHEDULE: 'SCHEDULE_CHANGE',
  EQUIPMENT: 'EQUIPMENT',
  FACILITIES: 'WORKSITE_CHANGE',
  JOB_RESTRUCTURING: 'JOB_RESTRUCTURING',
  REASSIGNMENT: 'REASSIGNMENT',
  LEAVE_RELATED: 'LEAVE',
  TECHNOLOGY: 'EQUIPMENT',
  POLICY_EXCEPTION: 'POLICY_MODIFICATION',
  OTHER: 'OTHER',
};

// Mirrors mhd_accommodation_transition's own transition graph (0053_reasonable
//_accommodations_module.sql): CLOSED is not a legal next state from EVALUATION
// or IMPLEMENTING, and a case already CLOSED can only reopen to
// INTERACTIVE_PROCESS. The Close Case action must not be offered outside this
// set — the RPC is the enforcement, this only avoids showing a button that
// would just raise 22023.
const MHD_ACCOMMODATION_CLOSABLE_STATUSES: readonly MhdAccommodationStatus[] = [
  'INTAKE',
  'INTERACTIVE_PROCESS',
  'DOCUMENTATION_PENDING',
  'DECIDED',
  'ACTIVE',
  'REVIEW_DUE',
];

/**
 * One accommodation case. The page shows the recorded process read-only; every input form
 * (close, status change, interaction, option, decision, implementation, equipment, review,
 * restricted medical status, request details, provider certification, notices) opens in a
 * modal with save and resume. A draft keeps every field of its form, medical fields included.
 */
export function MhdAccommodationCaseDetailPage() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { profile, roles } = useMhdAuth();
  const privileged = mhdAccommodationsIsPrivileged(roles);
  const canSeeMedical = mhdAccommodationsCanSeeMedical(roles);
  const detail = useMhdAccommodationCase(caseId);
  const optionCatalog = useMhdAccommodationOptionCatalog(profile?.companyId ?? null);
  const documentTemplates = useMhdAccommodationDocumentTemplates(profile?.companyId);
  const readiness = useMhdAccommodationReadiness();
  const transition = useMhdAccommodationTransition(caseId);
  const addInteraction = useMhdAccommodationInteraction(caseId);
  const addOption = useMhdAccommodationOption(caseId);
  const decide = useMhdAccommodationDecision(caseId);
  const implement = useMhdAccommodationImplementation(caseId);
  const completeReview = useMhdAccommodationReview(caseId);
  const recordMedical = useMhdAccommodationMedicalRecord(caseId);
  const revealMedical = useMhdAccommodationMedicalReveal();
  const saveRequestDetails = useMhdAccommodationRequestDetails(caseId);
  const certifyEmployee = useMhdAccommodationEmployeeCertify(caseId);
  const saveProviderCertification = useMhdAccommodationProviderCertification(caseId);
  const denialReasonCodes = useMhdAccommodationDenialReasonCodes();
  const caseCompanyId = detail.data?.case.company_id ?? null;
  // Ordered By references users(id), so the picker lists the company's platform users through the
  // shared Tasks assignable-users contract (the same source every module's user picker reads).
  const equipmentUsers = useQuery({
    queryKey: ['mhd-accommodations', 'equipment-users', caseCompanyId ?? ''],
    queryFn: () => mhdTaskService.listAssignableUsers(caseCompanyId!),
    enabled: privileged && Boolean(caseCompanyId),
  });
  const [tab, setTab] = useState<Tab>('process');
  const [openForm, setOpenForm] = useState<OpenForm | null>(null);
  const [status, setStatus] = useState<MhdAccommodationStatus>('INTERACTIVE_PROCESS');
  const [transitionReason, setTransitionReason] = useState('');
  const [interactionChannel, setInteractionChannel] =
    useState<MhdAccommodationRequestChannel>('VERBAL');
  const [summary, setSummary] = useState('');
  const [nextStep, setNextStep] = useState('');
  // Matches p_employee_visible's DEFAULT true in mhd_accommodation_add_interaction.
  const [employeeVisible, setEmployeeVisible] = useState(true);
  const [optionType, setOptionType] = useState<string>('JOB_RESTRUCTURING');
  const [optionEssentialFunctionIds, setOptionEssentialFunctionIds] = useState<string[]>([]);
  const [optionRemovesEssentialFunction, setOptionRemovesEssentialFunction] = useState(false);
  const [optionDescription, setOptionDescription] = useState('');
  const [catalogPickId, setCatalogPickId] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [effectiveness, setEffectiveness] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [outcome, setOutcome] = useState<DecisionOutcome>('APPROVED');
  const [decisionSummary, setDecisionSummary] = useState('');
  const [denialReasons, setDenialReasons] = useState<MhdAccommodationDenialReasonInput[]>([]);
  const [processContinues, setProcessContinues] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [managerInstruction, setManagerInstruction] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewDueDate, setReviewDueDate] = useState('');
  const [implementEquipment, setImplementEquipment] =
    useState<MhdAccommodationEquipmentValue>(EMPTY_EQUIPMENT);
  const [documentationType, setDocumentationType] =
    useState<MhdAccommodationDocumentationType>('SIMPLE_CERTIFICATION');
  const [documentationStatus, setDocumentationStatus] =
    useState<MhdAccommodationDocumentationStatus>('NOT_NEEDED');
  const [needIsObvious, setNeedIsObvious] = useState(false);
  const [documentationRequested, setDocumentationRequested] = useState(false);
  const [documentationRequestedAt, setDocumentationRequestedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [documentationDueDate, setDocumentationDueDate] = useState('');
  const [functionalLimitation, setFunctionalLimitation] = useState('');
  const [accommodationNeed, setAccommodationNeed] = useState('');
  const [revealed, setRevealed] = useState<Record<string, MhdAccommodationMedicalReveal>>({});
  const [error, setError] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState('');

  const filteredCatalogOptions = (optionCatalog.data ?? []).filter((item) => {
    const search = catalogSearch.trim().toLowerCase();
    if (!search) return true;
    return [
      item.optionType,
      item.descriptionTemplate,
      mhdFormatAccommodationValue(item.category),
      ...(item.functionalLimitationTags ?? []).flatMap((tag) => [
        tag,
        mhdFormatAccommodationValue(tag),
      ]),
    ].some((value) => value.toLowerCase().includes(search));
  });

  const record = detail.data;
  if (detail.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!record) return <p className="text-sm text-muted-foreground">Case not found.</p>;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  }

  function open(kind: CaseFormKind) {
    setError(null);
    setOpenForm({ kind });
  }

  const closeForm = () => setOpenForm(null);

  const canCloseCase =
    privileged && MHD_ACCOMMODATION_CLOSABLE_STATUSES.includes(record.case.status);

  const activeDecision = record.decisions.find((item) => !item.superseded_at);
  // The option to implement is a DECIDED fact, not a UI fact. `selectedOptionId`
  // is only the draft state of the decision form and is empty after any reload,
  // so the active decision's selected_option_id is the source of truth and the
  // local draft is merely the fallback while a decision is still being composed.
  const implementableOptionId = activeDecision?.selected_option_id ?? selectedOptionId;
  const implementableOption = record.options.find((item) => item.id === implementableOptionId);
  const selectedDraftOption = record.options.find((item) => item.id === selectedOptionId);

  // Mirrors every 23514 mhd_accommodation_decide raises, so the operator reads
  // the reason rather than a database error. The RPC remains the enforcement.
  const decisionBlockers = mhdAccommodationDecisionBlockers({
    outcome,
    selectedOptionId: outcome === 'DENIED' ? null : selectedOptionId,
    individualizedAnalysis: outcome === 'DENIED' ? analysis : null,
    interactionCount: record.interactions.length,
    optionCount: record.options.length,
    selectedOptionRemovesEssentialFunction: Boolean(
      outcome !== 'DENIED' && selectedDraftOption?.removes_essential_function,
    ),
  });

  const medicalDraft = mhdAccommodationMedicalSchema.safeParse({
    documentationType,
    status: documentationStatus,
    needIsObvious,
    documentationRequested,
    requestedAt: documentationRequested ? documentationRequestedAt : null,
    dueDate: documentationRequested ? documentationDueDate || null : null,
    functionalLimitation: functionalLimitation || null,
    accommodationNeed: accommodationNeed || null,
  });
  const medicalBlockers = medicalDraft.success
    ? []
    : [...new Set(medicalDraft.error.issues.map((issue) => issue.message))];

  // A decision is recorded only from EVALUATION and an implementation only from DECIDED
  // (mhd_accommodation_transition graph); the controls are offered only there.
  const canDecide = record.case.status === MHD_ACCOMMODATION_DECIDE_FROM_STATUS;
  const canImplement = record.case.status === MHD_ACCOMMODATION_IMPLEMENT_FROM_STATUS;
  const currentStatusLabel = mhdFormatAccommodationValue(record.case.status);
  const decisionNeedsReasons = outcome !== 'APPROVED';
  const denialReasonsValid =
    !decisionNeedsReasons || mhdAccommodationDenialReasonsSchema.safeParse(denialReasons).success;
  // Undue hardship never ends the interactive process, so it forces and locks continuation.
  const continuationRequired =
    decisionNeedsReasons && mhdAccommodationReasonsRequireContinuation(denialReasons);
  const interactiveProcessContinues =
    decisionNeedsReasons && (continuationRequired || processContinues);
  const isOwnCase = Boolean(profile?.personId) && profile?.personId === record.case.person_id;
  const equipmentUserOptions: MhdAccommodationEquipmentUserOption[] = (
    equipmentUsers.data ?? []
  ).map((user) => ({ id: user.id, displayName: user.displayName || user.email }));
  const equipmentUserNames = new Map(
    equipmentUserOptions.map((user) => [user.id, user.displayName]),
  );
  const implementWaitingForEquipment = Boolean(
    implementEquipment.orderedOn && !implementEquipment.receivedOn,
  );
  const canImplementNow = privileged && canImplement && Boolean(implementableOption);
  const reference = record.case.reference_id;

  const tabs = [
    { value: 'process' as const, label: 'Interactive Process', count: record.interactions.length },
    { value: 'request' as const, label: 'Request Details' },
    { value: 'notices' as const, label: 'Notices' },
    { value: 'options' as const, label: 'Options', count: record.options.length },
    { value: 'decision' as const, label: 'Decision', count: record.decisions.length },
    {
      value: 'implementation' as const,
      label: 'Implementation & Review',
      count: record.implementations.length,
    },
    {
      value: 'medical' as const,
      label: 'Documentation Status',
      count: record.medical_status.length,
    },
    ...(canSeeMedical ? [{ value: 'provider' as const, label: 'Provider Certification' }] : []),
  ];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/accommodations"
        backLabel="all accommodations"
        title={reference}
        description={`${mhdFormatAccommodationValue(record.case.request_source)} · ${new Date(
          record.case.requested_at,
        ).toLocaleDateString()} · ${mhdFormatAccommodationValue(record.case.status)}`}
      />

      <MhdAccommodationCaseRecordTabs
        caseId={record.case.id}
        active="detail"
        onDelete={canCloseCase ? () => open('close') : undefined}
        deleteLabel="Close Case"
        skipConfirm
      />

      <MhdComplianceGateBanner readiness={readiness.data} />

      {openForm?.kind === 'close' && canCloseCase ? (
        <MhdAccommodationDraftModal
          title="Close Case"
          description="Closing is the audited cancel/withdraw path for this module — the case record and its interactive-process history are retained, not deleted. A reason is required."
          size="md"
          draftKey={`${caseId}:close`}
          companyId={caseCompanyId}
          draftTitle={`${reference} close`}
          getDraftValues={() => ({ closeReason })}
          onRestore={(payload) => setCloseReason(draftText(payload.closeReason))}
          submitLabel="Confirm Close Case"
          pendingLabel="Closing…"
          submitVariant="destructive"
          submitDisabled={!closeReason.trim()}
          isSubmitting={transition.isPending}
          onSubmit={async () => {
            await transition.mutateAsync({ status: 'CLOSED', reason: closeReason });
            setCloseReason('');
          }}
          onClose={closeForm}
        >
          <label className="block text-sm font-medium">
            Reason <span className="font-normal text-muted-foreground">(required)</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={closeReason}
              onChange={(event) => setCloseReason(event.target.value)}
              placeholder="Why is this case closing?"
            />
          </label>
        </MhdAccommodationDraftModal>
      ) : null}

      <MhdCard>
        <MhdCardHeader title="Request and job context" />
        <MhdDetailField label="Request summary" value={record.case.request_summary} />
        {record.case.leave_case_id ? (
          <p className="mt-2 text-sm">
            Linked leave:{' '}
            <Link
              className="text-accent-hover hover:underline"
              to={`/leaves/${record.case.leave_case_id}`}
            >
              open case
            </Link>
          </p>
        ) : null}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stamped essential functions
          </p>
          {record.case.essential_functions.length ? (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {record.case.essential_functions.map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-amber-700">
              No published job-description snapshot was available when this process opened.
            </p>
          )}
        </div>
      </MhdCard>

      {privileged ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader
            title="Workflow status"
            action={
              <Button variant="secondary" onClick={() => open('status')}>
                Change Status
              </Button>
            }
          />
          <MhdDetailField label="Current status" value={currentStatusLabel} />
        </MhdCard>
      ) : null}

      {openForm?.kind === 'status' && privileged ? (
        <MhdAccommodationDraftModal
          title="Change Workflow Status"
          description={`This case is in ${currentStatusLabel}.`}
          size="md"
          draftKey={`${caseId}:status`}
          companyId={caseCompanyId}
          draftTitle={`${reference} status`}
          getDraftValues={() => ({ status, transitionReason })}
          onRestore={(payload) => {
            setStatus(draftChoice(payload.status, MHD_ACCOMMODATION_STATUSES, status));
            setTransitionReason(draftText(payload.transitionReason));
          }}
          submitLabel="Update Status"
          isSubmitting={transition.isPending}
          onSubmit={async () => {
            await transition.mutateAsync({ status, reason: transitionReason || undefined });
            setTransitionReason('');
          }}
          onClose={closeForm}
        >
          <label className="block text-sm font-medium">
            Move to
            <select
              className={`mt-1 ${inputClass}`}
              value={status}
              onChange={(event) => setStatus(event.target.value as MhdAccommodationStatus)}
            >
              {MHD_ACCOMMODATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatAccommodationValue(value)}
                </option>
              ))}
            </select>
          </label>
          {(status === 'CLOSED' || record.case.status === 'CLOSED') && (
            <label className="block text-sm font-medium">
              Closing or reopening reason
              <input
                className={`mt-1 ${inputClass}`}
                value={transitionReason}
                onChange={(event) => setTransitionReason(event.target.value)}
              />
            </label>
          )}
        </MhdAccommodationDraftModal>
      ) : null}

      <MhdTabs tabs={tabs} value={tab} onChange={setTab} />
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      {tab === 'notices' ? <MhdAccommodationNoticesPanel caseId={caseId} /> : null}

      {tab === 'request' ? (
        <MhdAccommodationRequestDetailsPanel
          key={record.request_details?.id ?? 'unrecorded'}
          caseId={caseId}
          companyId={caseCompanyId}
          details={record.request_details}
          caseStatus={record.case.status}
          isOwnCase={isOwnCase}
          canAdminister={privileged}
          isPending={saveRequestDetails.isPending || certifyEmployee.isPending}
          onSave={(input) => saveRequestDetails.mutateAsync(input)}
          onCertify={(method) => certifyEmployee.mutateAsync({ caseId, method })}
        />
      ) : null}

      {/* Absent from the DOM, not hidden, for every role outside the medical partition. */}
      {tab === 'provider' && canSeeMedical ? (
        <MhdAccommodationProviderCertPanel
          key={record.provider_certification?.id ?? 'unrecorded'}
          caseId={caseId}
          companyId={caseCompanyId}
          certification={record.provider_certification}
          isPending={saveProviderCertification.isPending}
          onSave={(input) => saveProviderCertification.mutateAsync(input)}
        />
      ) : null}

      {tab === 'process' ? (
        <div className="space-y-4">
          {privileged ? (
            <div className="flex justify-end">
              <Button onClick={() => open('interaction')}>Record Interaction</Button>
            </div>
          ) : null}
          {record.interactions.map((item) => (
            <MhdCard key={item.id}>
              <MhdDetailField label="Channel" value={mhdFormatAccommodationValue(item.channel)} />
              <MhdDetailField
                label="Occurred"
                value={new Date(item.occurred_at).toLocaleString()}
                className="mt-2"
              />
              <MhdDetailField label="Summary" value={item.summary} className="mt-2" />
              <MhdDetailField
                label="Visibility"
                value={item.employee_visible ? 'Visible to the employee' : 'Staff only'}
                className="mt-2"
              />
              <MhdDetailField
                label="Next step"
                value={
                  item.next_step
                    ? `${item.next_step}${item.next_step_due ? ` · ${item.next_step_due}` : ''}`
                    : null
                }
                className="mt-2"
              />
            </MhdCard>
          ))}
        </div>
      ) : null}

      {openForm?.kind === 'interaction' && privileged ? (
        <MhdAccommodationDraftModal
          title="Record Interaction"
          description="Record functional needs, alternatives, and next steps. Do not record a diagnosis, cause, genetic information, or medical history here."
          draftKey={`${caseId}:interaction`}
          companyId={caseCompanyId}
          draftTitle={`${reference} interaction`}
          getDraftValues={() => ({ interactionChannel, summary, nextStep, employeeVisible })}
          onRestore={(payload) => {
            setInteractionChannel(
              draftChoice(
                payload.interactionChannel,
                MHD_ACCOMMODATION_REQUEST_CHANNELS,
                interactionChannel,
              ),
            );
            setSummary(draftText(payload.summary));
            setNextStep(draftText(payload.nextStep));
            setEmployeeVisible(payload.employeeVisible !== false);
          }}
          submitLabel="Add Interaction"
          submitDisabled={!summary.trim()}
          isSubmitting={addInteraction.isPending}
          onSubmit={async () => {
            await addInteraction.mutateAsync({
              caseId,
              occurredAt: new Date().toISOString(),
              channel: interactionChannel,
              summary,
              nextStep,
              employeeVisible,
            });
            setSummary('');
            setNextStep('');
            setEmployeeVisible(true);
          }}
          onClose={closeForm}
        >
          <label className="block text-sm font-medium">
            Channel
            <select
              className={`mt-1 ${inputClass}`}
              value={interactionChannel}
              onChange={(event) =>
                setInteractionChannel(event.target.value as MhdAccommodationRequestChannel)
              }
            >
              {MHD_ACCOMMODATION_REQUEST_CHANNELS.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatAccommodationValue(value)}
                </option>
              ))}
            </select>
          </label>
          <textarea
            className={`min-h-24 ${inputClass}`}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="What was discussed and understood?"
          />
          <input
            className={inputClass}
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
            placeholder="Next step"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={employeeVisible}
              onChange={(event) => setEmployeeVisible(event.target.checked)}
            />
            Visible To The Employee
          </label>
        </MhdAccommodationDraftModal>
      ) : null}

      {tab === 'options' ? (
        <div className="space-y-4">
          {privileged ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader
                title="Evaluate options"
                action={
                  <Link
                    to="/accommodations/option-library"
                    className="text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    Manage Option Library
                  </Link>
                }
              />
              <Button onClick={() => open('option')}>Evaluate An Option</Button>
              <p className="text-xs text-muted-foreground">
                JAN (a free, U.S. Department of Labor-funded service) maintains a much larger,
                continually updated accommodation-ideas database.
                <br />
                <a
                  href="https://askjan.org/soar.cfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  Search the Job Accommodation Network (JAN) for more ideas
                </a>
              </p>
              {documentTemplates.data?.length ? (
                <div>
                  <MhdCardHeader title="Document templates" />
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {documentTemplates.data.map((entry) => (
                      <li key={entry.id}>
                        <Link
                          className="text-accent hover:underline"
                          to={`/forms/${entry.id}/render`}
                        >
                          {entry.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </MhdCard>
          ) : null}
          {record.options.map((item) => (
            <MhdCard key={item.id}>
              <MhdDetailField
                label="Option type"
                value={mhdFormatAccommodationValue(item.option_type)}
              />
              <MhdDetailField label="Description" value={item.description} className="mt-2" />
              <MhdDetailField
                label="Expected effectiveness"
                value={item.expected_effectiveness}
                className="mt-2"
              />
              <MhdDetailField
                label="Disposition"
                value={mhdFormatAccommodationValue(item.disposition)}
                className="mt-2"
              />
            </MhdCard>
          ))}
        </div>
      ) : null}

      {openForm?.kind === 'option' && privileged ? (
        <MhdAccommodationDraftModal
          title="Evaluate An Option"
          draftKey={`${caseId}:option`}
          companyId={caseCompanyId}
          draftTitle={`${reference} option`}
          getDraftValues={() => ({
            catalogPickId,
            optionType,
            optionDescription,
            effectiveness,
            optionEssentialFunctionIds,
            optionRemovesEssentialFunction,
          })}
          onRestore={(payload) => {
            setCatalogPickId(draftText(payload.catalogPickId));
            setOptionType(draftChoice(payload.optionType, MHD_ACCOMMODATION_OPTION_TYPES, 'OTHER'));
            setOptionDescription(draftText(payload.optionDescription));
            setEffectiveness(draftText(payload.effectiveness));
            const stamped = new Set(record.case.essential_functions.map((fn) => fn.id));
            setOptionEssentialFunctionIds(
              Array.isArray(payload.optionEssentialFunctionIds)
                ? payload.optionEssentialFunctionIds.filter(
                    (id): id is string => typeof id === 'string' && stamped.has(id),
                  )
                : [],
            );
            setOptionRemovesEssentialFunction(payload.optionRemovesEssentialFunction === true);
          }}
          submitLabel="Add Option"
          submitDisabled={!optionDescription.trim() || !effectiveness.trim()}
          isSubmitting={addOption.isPending}
          onSubmit={async () => {
            await addOption.mutateAsync({
              caseId,
              optionType,
              description: optionDescription,
              expectedEffectiveness: effectiveness,
              essentialFunctionIds: optionEssentialFunctionIds,
              removesEssentialFunction: optionRemovesEssentialFunction,
              employeePreference: false,
            });
            setOptionDescription('');
            setEffectiveness('');
            setOptionEssentialFunctionIds([]);
            setOptionRemovesEssentialFunction(false);
          }}
          onClose={closeForm}
        >
          {(optionCatalog.data ?? []).length > 0 ? (
            <>
              <label
                className="block text-sm font-medium"
                htmlFor="mhd-accommodation-catalog-search"
              >
                Search accommodation ideas
                <input
                  id="mhd-accommodation-catalog-search"
                  className={`mt-1 ${inputClass}`}
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Search by limitation or keyword (e.g. lifting, concentration, hearing)…"
                />
              </label>
              <label className="block text-sm font-medium">
                Start from catalog{' '}
                <span className="font-normal text-muted-foreground">
                  (optional — pre-fills the fields below, which remain fully editable; this is a
                  starting point, never a locked template)
                </span>
                <select
                  className={`mt-1 ${inputClass}`}
                  value={catalogPickId}
                  onChange={(event) => {
                    const pickedId = event.target.value;
                    setCatalogPickId(pickedId);
                    const picked = (optionCatalog.data ?? []).find((item) => item.id === pickedId);
                    if (picked) {
                      setOptionType(
                        MHD_ACCOMMODATION_CATALOG_CATEGORY_TO_CASE_OPTION_TYPE[picked.category] ??
                          'OTHER',
                      );
                      setOptionDescription(`${picked.optionType}: ${picked.descriptionTemplate}`);
                    }
                  }}
                >
                  <option value="">Start from free text (default)…</option>
                  {filteredCatalogOptions.length ? (
                    filteredCatalogOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {mhdFormatAccommodationValue(item.category)} — {item.optionType}
                        {item.isLibrary ? ' (Global)' : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>
                      No matching accommodation ideas — try a different term.
                    </option>
                  )}
                </select>
              </label>
            </>
          ) : null}
          <select
            className={inputClass}
            aria-label="Option Type"
            value={optionType}
            onChange={(event) => {
              setCatalogPickId('');
              setOptionType(event.target.value);
            }}
          >
            {MHD_ACCOMMODATION_OPTION_TYPES.map((value) => (
              <option key={value} value={value}>
                {mhdFormatAccommodationValue(value)}
              </option>
            ))}
          </select>
          <textarea
            className={`min-h-20 ${inputClass}`}
            value={optionDescription}
            onChange={(event) => setOptionDescription(event.target.value)}
            placeholder="Option description"
          />
          <input
            className={inputClass}
            value={effectiveness}
            onChange={(event) => setEffectiveness(event.target.value)}
            placeholder="Expected effectiveness"
          />
          {record.case.essential_functions.length ? (
            <fieldset className="space-y-1 text-sm">
              <legend className="font-medium">Essential functions this option touches</legend>
              {record.case.essential_functions.map((fn) => (
                <label key={fn.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={optionEssentialFunctionIds.includes(fn.id)}
                    onChange={(event) =>
                      setOptionEssentialFunctionIds((current) =>
                        event.target.checked
                          ? [...current, fn.id]
                          : current.filter((id) => id !== fn.id),
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <span>{fn.text}</span>
                </label>
              ))}
            </fieldset>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={optionRemovesEssentialFunction}
              onChange={(event) => setOptionRemovesEssentialFunction(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>
              This option would remove an essential function of the job. It can be evaluated and
              documented, but it cannot be selected as the accommodation.
            </span>
          </label>
        </MhdAccommodationDraftModal>
      ) : null}

      {tab === 'decision' ? (
        <div className="space-y-4">
          {privileged && canDecide ? (
            <div className="flex justify-end">
              <Button onClick={() => open('decision')}>Decide Request</Button>
            </div>
          ) : null}
          {activeDecision ? (
            <MhdCard>
              <MhdDetailField
                label="Outcome"
                value={mhdFormatAccommodationValue(activeDecision.outcome)}
              />
              <MhdDetailField
                label="Decision summary"
                value={activeDecision.decision_summary}
                className="mt-2"
              />
              {activeDecision.outcome !== 'APPROVED' ? (
                <MhdDetailField
                  label="Interactive Process Continues"
                  value={activeDecision.interactive_process_continues ? 'Yes' : 'No'}
                  className="mt-2"
                />
              ) : null}
              {activeDecision.denial_reasons.length ? (
                <div className="mt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Denial Reasons
                  </p>
                  <ul className="mt-1 space-y-2 text-sm">
                    {[...activeDecision.denial_reasons]
                      .sort((left, right) => left.position - right.position)
                      .map((reason) => (
                        <li
                          key={reason.reason_code}
                          className="rounded-md border border-border p-2"
                        >
                          <p className="font-medium">{reason.label}</p>
                          {reason.detail ? <p>{reason.detail}</p> : null}
                          {reason.alternative_offered ? (
                            <p className="text-muted-foreground">
                              Alternative offered: {reason.alternative_offered}
                            </p>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </MhdCard>
          ) : null}
          {privileged && !canDecide ? (
            <p className="text-sm text-muted-foreground">
              A decision is recorded while the case is in Evaluation. This case is in{' '}
              {currentStatusLabel}; move it to Evaluation under Workflow Status once the interactive
              process and the option evaluation are complete.
            </p>
          ) : null}
        </div>
      ) : null}

      {openForm?.kind === 'decision' && privileged && canDecide ? (
        <MhdAccommodationDraftModal
          title="Record Decision"
          size="xl"
          draftKey={`${caseId}:decision`}
          companyId={caseCompanyId}
          draftTitle={`${reference} decision`}
          getDraftValues={() => ({
            outcome,
            selectedOptionId,
            analysis,
            denialReasons,
            processContinues,
            decisionSummary,
          })}
          onRestore={(payload) => {
            setOutcome(draftChoice(payload.outcome, DECISION_OUTCOMES, 'APPROVED'));
            const optionId = draftText(payload.selectedOptionId);
            setSelectedOptionId(
              record.options.some((item) => item.id === optionId) ? optionId : '',
            );
            setAnalysis(draftText(payload.analysis));
            setDenialReasons(draftDenialReasons(payload.denialReasons));
            setProcessContinues(payload.processContinues === true);
            setDecisionSummary(draftText(payload.decisionSummary));
          }}
          submitLabel="Record Decision"
          submitDisabled={
            !decisionSummary.trim() || decisionBlockers.length > 0 || !denialReasonsValid
          }
          isSubmitting={decide.isPending}
          onSubmit={() =>
            decide.mutateAsync({
              caseId,
              outcome,
              decisionSummary,
              selectedOptionId: outcome === 'DENIED' ? null : selectedOptionId,
              denialReasons: decisionNeedsReasons ? denialReasons : null,
              individualizedAnalysis: outcome === 'DENIED' ? analysis : null,
              alternativesConsidered: outcome === 'DENIED',
              interactiveProcessContinues,
            })
          }
          onClose={closeForm}
        >
          {decisionBlockers.length ? (
            <ul className="list-disc space-y-1 rounded-md bg-amber-50 p-3 pl-8 text-sm text-amber-800">
              {decisionBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : null}
          <select
            className={inputClass}
            aria-label="Decision Outcome"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as DecisionOutcome)}
          >
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_APPROVED">Partially approved</option>
            <option value="DENIED">Denied</option>
          </select>
          {outcome !== 'DENIED' ? (
            <select
              className={inputClass}
              aria-label="Approved Option"
              value={selectedOptionId}
              onChange={(event) => setSelectedOptionId(event.target.value)}
            >
              <option value="">Select approved option…</option>
              {/*
               * An option that removes an essential function is listed but
               * never selectable — mhd_accommodation_decide rejects it with
               * 23514, and removing an essential function is not a
               * reasonable accommodation.
               */}
              {record.options.map((item) => (
                <option key={item.id} value={item.id} disabled={item.removes_essential_function}>
                  {mhdFormatAccommodationValue(item.option_type)} — {item.description}
                  {item.removes_essential_function ? ' (removes an essential function)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              className={`min-h-24 ${inputClass}`}
              value={analysis}
              onChange={(event) => setAnalysis(event.target.value)}
              placeholder="Individualized analysis and alternatives considered"
            />
          )}
          {decisionNeedsReasons ? (
            <>
              <MhdAccommodationDenialReasonsField
                value={denialReasons}
                onChange={setDenialReasons}
                vocabulary={denialReasonCodes.data ?? []}
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border"
                  checked={interactiveProcessContinues}
                  disabled={continuationRequired}
                  onChange={(event) => setProcessContinues(event.target.checked)}
                />
                <span>
                  Interactive Process Continues
                  {continuationRequired ? (
                    <span className="block text-xs text-muted-foreground">
                      Undue hardship does not end the interactive process; it continues.
                    </span>
                  ) : null}
                </span>
              </label>
            </>
          ) : null}
          <textarea
            className={`min-h-20 ${inputClass}`}
            value={decisionSummary}
            onChange={(event) => setDecisionSummary(event.target.value)}
            placeholder="Decision summary"
          />
        </MhdAccommodationDraftModal>
      ) : null}

      {tab === 'implementation' ? (
        <div className="space-y-4">
          {canImplementNow ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader
                title="Ready to implement"
                action={<Button onClick={() => open('implement')}>Implement Accommodation</Button>}
              />
              <MhdDetailField label="Selected option" value={implementableOption?.description} />
            </MhdCard>
          ) : null}
          {record.implementations.map((item) => (
            <MhdCard key={item.id}>
              <MhdDetailField label="Manager instruction" value={item.manager_instruction} />
              <MhdDetailField label="Start date" value={item.start_date} className="mt-2" />
              <MhdDetailField label="End date" value={item.end_date} className="mt-2" />
              <MhdDetailField
                label="Status"
                value={mhdFormatAccommodationValue(item.status)}
                className="mt-2"
              />
              <MhdDetailField
                label="Equipment Ordered On"
                value={item.equipment_ordered_on}
                className="mt-2"
              />
              <MhdDetailField
                label="Equipment Ordered By"
                value={
                  item.equipment_ordered_by
                    ? (equipmentUserNames.get(item.equipment_ordered_by) ?? 'Recorded')
                    : null
                }
                className="mt-2"
              />
              <MhdDetailField
                label="Equipment Received On"
                value={item.equipment_received_on}
                className="mt-2"
              />
              {item.equipment_ordered_on && !item.equipment_received_on ? (
                <p className="mt-2 text-sm text-amber-700">{WAITING_FOR_EQUIPMENT_MESSAGE}</p>
              ) : null}
              {privileged ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => {
                    setError(null);
                    setOpenForm({ kind: 'equipment', implementation: item });
                  }}
                >
                  Update Equipment
                </Button>
              ) : null}
            </MhdCard>
          ))}
          {privileged && !canImplement ? (
            <p className="text-sm text-muted-foreground">
              An accommodation is implemented once the case is Decided. This case is in{' '}
              {currentStatusLabel}.
            </p>
          ) : null}
          {record.reviews.map((review) => (
            <MhdCard key={review.id}>
              <MhdDetailField label="Effectiveness review due" value={review.due_date} />
              <MhdDetailField
                label="Review summary"
                value={review.completed_at ? review.summary : null}
                className="mt-2"
              />
              {!review.completed_at && privileged ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => {
                    setError(null);
                    setOpenForm({ kind: 'review', reviewId: review.id, dueDate: review.due_date });
                  }}
                >
                  Complete Effectiveness Review
                </Button>
              ) : null}
            </MhdCard>
          ))}
        </div>
      ) : null}

      {openForm?.kind === 'implement' && canImplementNow && implementableOption ? (
        <MhdAccommodationDraftModal
          title="Implement Selected Option"
          draftKey={`${caseId}:implement`}
          companyId={caseCompanyId}
          draftTitle={`${reference} implementation`}
          getDraftValues={() => ({
            managerInstruction,
            startDate,
            reviewDueDate,
            equipment: implementEquipment,
          })}
          onRestore={(payload) => {
            setManagerInstruction(draftText(payload.managerInstruction));
            setStartDate(draftText(payload.startDate, startDate));
            setReviewDueDate(draftText(payload.reviewDueDate));
            setImplementEquipment(draftEquipment(payload.equipment));
          }}
          submitLabel="Activate Accommodation"
          submitDisabled={!managerInstruction.trim()}
          isSubmitting={implement.isPending}
          onSubmit={async () => {
            await implement.mutateAsync({
              caseId,
              optionId: implementableOption.id,
              startDate,
              managerInstruction,
              reviewDueDate: reviewDueDate || null,
              equipmentOrderedOn: implementEquipment.orderedOn || null,
              equipmentOrderedBy: implementEquipment.orderedBy || null,
              equipmentReceivedOn: implementEquipment.receivedOn || null,
            });
            setImplementEquipment(EMPTY_EQUIPMENT);
          }}
          onClose={closeForm}
        >
          <MhdDetailField label="Selected option" value={implementableOption.description} />
          <textarea
            className={`min-h-20 ${inputClass}`}
            value={managerInstruction}
            onChange={(event) => setManagerInstruction(event.target.value)}
            placeholder="Manager-safe implementation instruction—no medical facts"
          />
          <MhdFormFieldStack>
            <label className="text-sm font-medium">
              Start date
              <MhdDateField
                className={`mt-1 ${inputClass}`}
                value={startDate}
                onChange={(nextValue) => setStartDate(nextValue)}
              />
            </label>
            <label className="text-sm font-medium">
              Review due date
              <MhdDateField
                className={`mt-1 ${inputClass}`}
                value={reviewDueDate}
                onChange={(nextValue) => setReviewDueDate(nextValue)}
              />
            </label>
          </MhdFormFieldStack>
          <MhdAccommodationEquipmentFields
            idPrefix="mhd-implement"
            value={implementEquipment}
            onChange={setImplementEquipment}
            disabled={implement.isPending}
            userOptions={equipmentUserOptions}
          />
          {implementWaitingForEquipment ? (
            <p className="text-sm text-amber-700">{WAITING_FOR_EQUIPMENT_MESSAGE}</p>
          ) : null}
        </MhdAccommodationDraftModal>
      ) : null}

      {openForm?.kind === 'equipment' && privileged ? (
        <MhdAccommodationEquipmentUpdateModal
          caseId={caseId}
          companyId={caseCompanyId}
          implementation={openForm.implementation}
          userOptions={equipmentUserOptions}
          onClose={closeForm}
        />
      ) : null}

      {openForm?.kind === 'review' && privileged ? (
        <MhdAccommodationReviewCompletion
          caseId={caseId}
          companyId={caseCompanyId}
          reviewId={openForm.reviewId}
          dueDate={openForm.dueDate}
          isPending={completeReview.isPending}
          onComplete={(input) =>
            completeReview.mutateAsync({ reviewId: openForm.reviewId, ...input })
          }
          onClose={closeForm}
        />
      ) : null}

      {tab === 'medical' ? (
        <MhdCard>
          <MhdCardHeader
            title="Documentation status"
            action={
              canSeeMedical ? (
                <Button onClick={() => open('medical')}>Record Restricted Medical Status</Button>
              ) : undefined
            }
          />
          <p className="text-sm text-muted-foreground">
            This page never displays a diagnosis, causation statement, or medical record. Medical
            administrators may manage encrypted functional limitations and accommodation need in the
            restricted record.
          </p>
          {!canSeeMedical ? (
            <p className="mt-3 text-sm text-amber-700">
              Restricted medical content is unavailable to your role.
            </p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {record.medical_status.map((item) => (
              <li key={item.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {mhdFormatAccommodationValue(item.documentation_type)} ·{' '}
                    {mhdFormatAccommodationValue(item.status)}
                    {item.need_is_obvious
                      ? ' · Need recorded as obvious; documentation not requested'
                      : ''}
                  </span>
                  {canSeeMedical ? (
                    <Button
                      variant="secondary"
                      disabled={revealMedical.isPending}
                      onClick={() =>
                        void run(async () => {
                          const revealed = await revealMedical.mutateAsync(item.id);
                          setRevealed((current) => ({ ...current, [item.id]: revealed }));
                        })
                      }
                    >
                      Reveal Restricted Record
                    </Button>
                  ) : null}
                </div>
                {revealed[item.id] ? (
                  <dl className="mt-3 space-y-2 rounded-md bg-muted p-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Functional limitation
                      </dt>
                      <dd>{revealed[item.id]?.functional_limitation ?? 'Not recorded'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Accommodation need
                      </dt>
                      <dd>{revealed[item.id]?.accommodation_need ?? 'Not recorded'}</dd>
                    </div>
                  </dl>
                ) : null}
              </li>
            ))}
          </ul>
        </MhdCard>
      ) : null}

      {openForm?.kind === 'medical' && canSeeMedical ? (
        <MhdAccommodationDraftModal
          title="Record Restricted Medical Status"
          description="Enter only the functional limitation and the accommodation need. Both are encrypted at rest and every reveal is audited. A diagnosis, cause, complete medical record, or genetic information must never be entered here."
          draftKey={`${caseId}:medical-status`}
          companyId={caseCompanyId}
          draftTitle={`${reference} documentation status`}
          getDraftValues={() => ({
            documentationType,
            documentationStatus,
            needIsObvious,
            documentationRequested,
            documentationRequestedAt,
            documentationDueDate,
            functionalLimitation,
            accommodationNeed,
          })}
          onRestore={(payload) => {
            setDocumentationType(
              draftChoice(
                payload.documentationType,
                MHD_ACCOMMODATION_DOCUMENTATION_TYPES,
                documentationType,
              ),
            );
            setDocumentationStatus(
              draftChoice(
                payload.documentationStatus,
                MHD_ACCOMMODATION_DOCUMENTATION_STATUSES,
                documentationStatus,
              ),
            );
            const obvious = payload.needIsObvious === true;
            setNeedIsObvious(obvious);
            // The two are mutually exclusive by law and by CHECK constraint.
            setDocumentationRequested(!obvious && payload.documentationRequested === true);
            setDocumentationRequestedAt(
              draftText(payload.documentationRequestedAt, documentationRequestedAt),
            );
            setDocumentationDueDate(draftText(payload.documentationDueDate));
            setFunctionalLimitation(draftText(payload.functionalLimitation));
            setAccommodationNeed(draftText(payload.accommodationNeed));
          }}
          submitLabel="Record Restricted Status"
          submitDisabled={medicalBlockers.length > 0}
          isSubmitting={recordMedical.isPending}
          onSubmit={async () => {
            await recordMedical.mutateAsync({
              caseId,
              documentationType,
              status: documentationStatus,
              needIsObvious,
              documentationRequested,
              requestedAt: documentationRequested ? documentationRequestedAt : null,
              dueDate: documentationRequested ? documentationDueDate || null : null,
              functionalLimitation: functionalLimitation || null,
              accommodationNeed: accommodationNeed || null,
            });
            setFunctionalLimitation('');
            setAccommodationNeed('');
          }}
          onClose={closeForm}
        >
          {medicalBlockers.length ? (
            <ul className="list-disc space-y-1 rounded-md bg-amber-50 p-3 pl-8 text-sm text-amber-800">
              {medicalBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Documentation type
              <select
                className={`mt-1 ${inputClass}`}
                value={documentationType}
                onChange={(event) =>
                  setDocumentationType(event.target.value as MhdAccommodationDocumentationType)
                }
              >
                {MHD_ACCOMMODATION_DOCUMENTATION_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Status
              <select
                className={`mt-1 ${inputClass}`}
                value={documentationStatus}
                onChange={(event) =>
                  setDocumentationStatus(event.target.value as MhdAccommodationDocumentationStatus)
                }
              >
                {MHD_ACCOMMODATION_DOCUMENTATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={needIsObvious}
              onChange={(event) => {
                setNeedIsObvious(event.target.checked);
                // The two are mutually exclusive by law and by CHECK
                // constraint; marking the need obvious withdraws any request.
                if (event.target.checked) setDocumentationRequested(false);
              }}
            />
            Disability and need for accommodation are obvious
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={documentationRequested}
              disabled={needIsObvious}
              onChange={(event) => setDocumentationRequested(event.target.checked)}
            />
            Documentation requested
            {needIsObvious ? (
              <span className="text-xs text-muted-foreground">
                Unavailable — documentation cannot be requested for an obvious need.
              </span>
            ) : null}
          </label>
          {documentationRequested ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium">
                Requested on
                <MhdDateField
                  className={`mt-1 ${inputClass}`}
                  value={documentationRequestedAt}
                  onChange={(nextValue) => setDocumentationRequestedAt(nextValue)}
                />
              </label>
              <label className="text-sm font-medium">
                Due
                <MhdDateField
                  className={`mt-1 ${inputClass}`}
                  value={documentationDueDate}
                  onChange={(nextValue) => setDocumentationDueDate(nextValue)}
                />
              </label>
            </div>
          ) : null}
          <textarea
            className={`min-h-20 ${inputClass}`}
            value={functionalLimitation}
            onChange={(event) => setFunctionalLimitation(event.target.value)}
            placeholder="Functional limitation — what the employee currently cannot do"
            aria-label="Functional limitation"
          />
          <textarea
            className={`min-h-20 ${inputClass}`}
            value={accommodationNeed}
            onChange={(event) => setAccommodationNeed(event.target.value)}
            placeholder="Accommodation need — the workplace change that would help"
            aria-label="Accommodation need"
          />
        </MhdAccommodationDraftModal>
      ) : null}

      {canCloseCase ? (
        <div className="flex justify-end border-t border-border pt-4">
          <MhdDetailActions deleteLabel="Close Case" onDelete={() => open('close')} skipConfirm />
        </div>
      ) : null}
    </div>
  );
}
