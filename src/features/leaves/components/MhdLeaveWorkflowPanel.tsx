import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { mhdCanEditLeaveChecklist } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdDocumentService } from '@/features/documents/Service';
import { mhdFormatDate, mhdFormatDateTime } from '@/utils/mhdDateFormat';
import {
  useMhdConfirmLeaveEligibility,
  useMhdLeaveBenefitObligation,
  useMhdLeaveBenefitObligationStatus,
  useMhdLeaveBenefitTransaction,
  useMhdLeaveBondingEvent,
  useMhdLeaveDesignatedPerson,
  useMhdLeaveDesignatedPersonVoid,
  useMhdRunLeaveEligibility,
  useMhdLeaveEssentialFunctions,
  useMhdLeaveEvent,
  useMhdLeaveKeyEmployee,
  useMhdLeaveNotice,
  useMhdLeaveNoticeDelivery,
  useMhdLeavePaySource,
  useMhdLeavePaySourceStatus,
  useMhdLeaveReadiness,
  useMhdLeaveReturnToWork,
  useMhdLeaveSegment,
  useMhdLeaveSegmentStatus,
  useMhdLeaveWorkersComp,
  useMhdLeaveWorkflow,
  useMhdOverrideLeaveEligibility,
} from '../WorkflowHook';
import type { MhdLeaveDeadlineKind, MhdLeaveNoticeType } from '../WorkflowTypes';
import { MhdLeaveActionModal } from './MhdLeaveActionModal';
import { MhdLeaveBenefitTransactionList } from './MhdLeaveBenefitTransactionList';
import { MhdLeaveCaseControlsPanel } from './MhdLeaveCaseControlsPanel';
import { MhdLeaveChecklistPanel } from './MhdLeaveChecklistPanel';
import { MhdLeaveDesignatedPersonPanel } from './MhdLeaveDesignatedPersonPanel';
import { MhdLeaveEligibilityFactsCard } from './MhdLeaveEligibilityFactsCard';
import { MhdLeavePayCoordinationPanel } from './MhdLeavePayCoordinationPanel';
import {
  MhdLeaveBenefitObligationForm,
  MhdLeaveBenefitTransactionForm,
  MhdLeaveBondingEventForm,
  MhdLeaveContactForm,
  MhdLeaveDeadlineStrip,
  MhdLeaveEligibilityOverrideForm,
  MhdLeaveNoticeForm,
  MhdLeaveReturnToWorkForm,
  MhdLeaveSegmentForm,
} from './MhdLeaveWorkflowForms';
import {
  MhdLeaveBenefitObligationStatusControl,
  MhdLeaveSegmentStatusControl,
} from './MhdLeaveWorkflowStatusControls';
import { mhdEligibilityBlockerMessage } from '../EligibilityBlockers';
import {
  MHD_LEAVE_CONTINUATION_BASIS_LABELS,
  MHD_LEAVE_NOTICE_DEADLINE_KINDS,
  mhdLeaveEnumLabel,
  mhdLeaveFindingMessage,
} from './mhdLeaveLabels';

type Tab =
  | 'eligibility'
  | 'checklist'
  | 'notices'
  | 'schedule'
  | 'communications'
  | 'pay'
  | 'benefits'
  | 'return'
  | 'controls';

/** Every deadline kind an issued notice can close, for the Notices tab's deadline strip. */
const NOTICE_DEADLINE_KINDS: ReadonlySet<MhdLeaveDeadlineKind> = new Set(
  Object.values(MHD_LEAVE_NOTICE_DEADLINE_KINDS).flat(),
);

function findingCode(finding: Record<string, unknown>): string {
  return typeof finding.code === 'string' ? finding.code : 'Review finding';
}

/**
 * The leave workflow tabs. Each tab shows its recorded facts inline; every add, record or edit
 * opens in an MhdLeaveActionModal, which shows the server's refusal and keeps a draft. The
 * error line here is for the one-click actions (confirm, mark delivered, pay status).
 */
export function MhdLeaveWorkflowPanel({
  caseId,
  privileged,
}: {
  caseId: string;
  privileged: boolean;
}) {
  const workflow = useMhdLeaveWorkflow(caseId);
  const { authUserId, profile, roles } = useMhdAuth();
  const templates = useQuery({
    queryKey: ['mhd-leaves', 'document-templates', profile?.companyId ?? ''],
    queryFn: () =>
      mhdDocumentService.listTemplates(profile!.companyId, undefined, false, 'LEAVE_CASE'),
    enabled: Boolean(profile?.companyId),
  });
  const readiness = useMhdLeaveReadiness();
  const runEligibility = useMhdRunLeaveEligibility(caseId);
  const confirm = useMhdConfirmLeaveEligibility(caseId);
  const override = useMhdOverrideLeaveEligibility(caseId);
  const event = useMhdLeaveEvent(caseId);
  const returnToWork = useMhdLeaveReturnToWork(caseId);
  const recordNotice = useMhdLeaveNotice(caseId);
  const markNoticeDelivery = useMhdLeaveNoticeDelivery(caseId);
  const recordSegment = useMhdLeaveSegment(caseId);
  const updateSegmentStatus = useMhdLeaveSegmentStatus(caseId);
  const recordObligation = useMhdLeaveBenefitObligation(caseId);
  const updateObligationStatus = useMhdLeaveBenefitObligationStatus(caseId);
  const recordTransaction = useMhdLeaveBenefitTransaction(caseId);
  const bondingEvent = useMhdLeaveBondingEvent(caseId);
  const designatedPerson = useMhdLeaveDesignatedPerson(caseId);
  const voidDesignatedPerson = useMhdLeaveDesignatedPersonVoid(caseId);
  const paySource = useMhdLeavePaySource(caseId);
  const paySourceStatus = useMhdLeavePaySourceStatus(caseId);
  const workersComp = useMhdLeaveWorkersComp(caseId);
  const keyEmployee = useMhdLeaveKeyEmployee(caseId);
  const essentialFunctions = useMhdLeaveEssentialFunctions(caseId);
  const [tab, setTab] = useState<Tab>('eligibility');
  const [error, setError] = useState<string | null>(null);

  const record = workflow.data;
  if (workflow.isLoading) return <p className="text-sm text-muted-foreground">Loading workflow…</p>;
  if (!record) return null;

  // Resolves the action's value, or null after showing the refusal.
  async function attempt<T>(action: () => Promise<T>): Promise<{ value: T } | null> {
    setError(null);
    try {
      return { value: await action() };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The workflow action failed.');
      return null;
    }
  }
  async function run(action: () => Promise<unknown>): Promise<boolean> {
    return (await attempt(action)) !== null;
  }

  const companyId = record.case.company_id;
  const modalScope = { caseId, companyId };
  const relationship = record.case.family_relationship ?? '';
  const isBonding = record.case.reason_code === 'BONDING';
  const showDesignatedPersons =
    relationship === 'DESIGNATED_PERSON' || record.designated_persons.length > 0;
  // Templates without a stable key cannot be named by a notice (the database refuses a uuid).
  const keyedTemplates = (templates.data ?? []).filter((template) => template.templateKey);
  const noticeDeadlines = record.deadlines.filter((deadline) =>
    NOTICE_DEADLINE_KINDS.has(deadline.deadline_kind),
  );

  async function createNotice(input: { noticeType: MhdLeaveNoticeType; templateKey: string }) {
    const template = keyedTemplates.find((item) => item.templateKey === input.templateKey);
    if (!template?.templateKey) throw new Error('Select a document template.');
    const generation = await mhdDocumentService.generateAndPoll(
      {
        templateId: template.id,
        companyId: profile!.companyId,
        entityType: 'LEAVE_CASE',
        entityId: caseId,
        mergeData: {},
      },
      { actorUserId: authUserId! },
    );
    await recordNotice.mutateAsync({
      caseId,
      noticeType: input.noticeType,
      templateKey: template.templateKey,
      templateVersion: template.version,
      documentGenerationId: generation.id,
    });
  }

  const tabs = [
    { value: 'eligibility' as const, label: 'Eligibility', count: record.eligibility.length },
    { value: 'checklist' as const, label: 'Checklist', count: record.checklist.length },
    { value: 'notices' as const, label: 'Notices', count: record.notices.length },
    { value: 'schedule' as const, label: 'Schedule', count: record.segments.length },
    { value: 'communications' as const, label: 'Contacts', count: record.events.length },
    { value: 'pay' as const, label: 'Pay', count: record.pay_sources.length },
    { value: 'benefits' as const, label: 'Benefits', count: record.benefits.length },
    { value: 'return' as const, label: 'Return To Work' },
    { value: 'controls' as const, label: 'Controls' },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Leave Workflow</h2>
        <p className="text-xs text-muted-foreground">
          Versioned eligibility, legal deadlines, notices, usage, pay, benefits, and return-to-work
          facts.
        </p>
      </div>
      <MhdComplianceGateBanner readiness={readiness.data} />
      <MhdTabs tabs={tabs} value={tab} onChange={setTab} />
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      {tab === 'eligibility' ? (
        <div className="space-y-3">
          {privileged ? (
            <div className="flex justify-end">
              <Button
                disabled={runEligibility.isPending}
                onClick={() => void run(() => runEligibility.mutateAsync())}
              >
                {runEligibility.isPending ? 'Running Evaluation…' : 'Run Evaluation'}
              </Button>
            </div>
          ) : (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Awaiting HR verification
            </p>
          )}
          {runEligibility.data?.blockers?.length ? (
            <MhdCard className="space-y-2">
              <MhdCardHeader title="Evaluation Blockers" />
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {runEligibility.data.blockers.map((blocker: string) => (
                  <li key={blocker}>{mhdEligibilityBlockerMessage(blocker)}</li>
                ))}
              </ul>
            </MhdCard>
          ) : null}
          <MhdLeaveEligibilityFactsCard
            caseId={caseId}
            familyRelationship={record.case.family_relationship}
            reasonCode={record.case.reason_code}
            isIntermittent={record.case.is_intermittent}
          />
          {record.eligibility.map((item) => (
            <MhdCard key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.type_key}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.effective_outcome} ·{' '}
                    {item.entitlement_hours == null
                      ? 'No entitlement calculated'
                      : `${item.entitlement_hours} hours`}
                  </p>
                </div>
                {privileged && !item.confirmed_at ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={confirm.isPending}
                      onClick={() => void run(() => confirm.mutateAsync(item.snapshot_id))}
                    >
                      Confirm Determination
                    </Button>
                    <MhdLeaveActionModal
                      {...modalScope}
                      action={`eligibility-override:${item.id}`}
                      title={`Override ${item.type_key} Determination`}
                      size="md"
                      launchLabel="Override"
                    >
                      <MhdLeaveEligibilityOverrideForm
                        determinationId={item.id}
                        isPending={override.isPending}
                        onSubmit={(input) => override.mutateAsync(input)}
                      />
                    </MhdLeaveActionModal>
                  </div>
                ) : null}
              </div>
              {/*
               * The evaluated outcome and its findings stay on the record even
               * after an override — they are the evidence the override departed
               * from, not a draft it replaced.
               */}
              <dl>
                <MhdDetailField
                  label="Findings"
                  value={
                    item.findings.length ? (
                      <ul className="list-disc space-y-1 pl-5">
                        {item.findings.map((finding, index) => (
                          <li key={`${findingCode(finding)}-${index}`}>
                            {mhdLeaveFindingMessage(findingCode(finding))}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No findings'
                    )
                  }
                  className="mt-2"
                />
                <MhdDetailField
                  label="Override reason"
                  value={
                    item.override_reason
                      ? `Overridden from ${item.evaluated_outcome}: ${item.override_reason}`
                      : null
                  }
                  className="mt-2"
                />
              </dl>
            </MhdCard>
          ))}

          {isBonding ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="Bonding Event" />
              <p className="text-xs text-muted-foreground">
                Bonding leave runs from the birth, adoption or foster placement and must be taken
                within 12 months of it.
              </p>
              <dl className="grid gap-2 sm:grid-cols-2">
                <MhdDetailField
                  label="Recorded event date"
                  value={record.case.bonding_event_date}
                />
                <MhdDetailField
                  label="Recorded event type"
                  value={
                    record.case.bonding_event_type
                      ? mhdLeaveEnumLabel(record.case.bonding_event_type)
                      : null
                  }
                />
              </dl>
              {privileged ? (
                <MhdLeaveActionModal
                  {...modalScope}
                  action="bonding-event"
                  title="Bonding Event"
                  size="md"
                  launchLabel="Edit Bonding Event"
                >
                  <MhdLeaveBondingEventForm
                    caseId={caseId}
                    current={record.case}
                    isPending={bondingEvent.isPending}
                    onSubmit={(input) => bondingEvent.mutateAsync(input)}
                  />
                </MhdLeaveActionModal>
              ) : null}
            </MhdCard>
          ) : null}

          {showDesignatedPersons ? (
            <MhdLeaveDesignatedPersonPanel
              caseId={caseId}
              companyId={companyId}
              persons={record.designated_persons}
              familyRelationship={relationship}
              limitDesignatedPerson={record.policy.limit_designated_person}
              privileged={privileged}
              isPending={designatedPerson.isPending || voidDesignatedPerson.isPending}
              onRecord={(input) => designatedPerson.mutateAsync(input)}
              onVoid={(input) => voidDesignatedPerson.mutateAsync(input)}
            />
          ) : null}
        </div>
      ) : null}

      {tab === 'checklist' ? (
        <div className="space-y-3">
          <MhdCard className="space-y-3">
            <MhdCardHeader title="Legal Deadlines" />
            <MhdLeaveDeadlineStrip
              deadlines={record.deadlines}
              empty="No legal deadlines have been opened on this case."
            />
          </MhdCard>
          <MhdLeaveChecklistPanel
            items={record.checklist}
            edit={mhdCanEditLeaveChecklist(roles) ? modalScope : undefined}
          />
        </div>
      ) : null}

      {tab === 'notices' ? (
        <div className="space-y-2">
          <MhdCard className="space-y-3">
            <MhdCardHeader title="Notice Deadlines" />
            <MhdLeaveDeadlineStrip
              deadlines={noticeDeadlines}
              empty="No notice deadline is open on this case."
            />
          </MhdCard>
          {privileged ? (
            <div className="flex justify-end">
              <MhdLeaveActionModal
                {...modalScope}
                action="notice"
                title="New Leave Notice"
                launchLabel="New Notice"
              >
                <MhdLeaveNoticeForm
                  templates={keyedTemplates}
                  deadlines={record.deadlines}
                  isPending={recordNotice.isPending}
                  canSubmit={Boolean(authUserId && profile?.companyId)}
                  onSubmit={createNotice}
                />
              </MhdLeaveActionModal>
            </div>
          ) : null}
          {record.notices.length ? (
            record.notices.map((item) => (
              <MhdCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <MhdDetailField
                      label="Notice type"
                      value={mhdLeaveEnumLabel(item.notice_type)}
                    />
                    <MhdDetailField label="Status" value={mhdLeaveEnumLabel(item.status)} />
                    <MhdDetailField label="Due" value={mhdFormatDate(item.due_at, 'No deadline')} />
                    <MhdDetailField
                      label="Delivered"
                      value={mhdFormatDateTime(item.delivered_at, 'Not delivered')}
                    />
                  </dl>
                  {privileged && item.status !== 'DELIVERED' ? (
                    <Button
                      variant="secondary"
                      disabled={markNoticeDelivery.isPending}
                      onClick={() =>
                        void run(() =>
                          markNoticeDelivery.mutateAsync({
                            noticeId: item.id,
                            status: 'DELIVERED',
                          }),
                        )
                      }
                    >
                      Mark Delivered
                    </Button>
                  ) : null}
                </div>
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No notices recorded.</p>
          )}
        </div>
      ) : null}

      {tab === 'schedule' ? (
        <div className="space-y-2">
          {privileged ? (
            <div className="flex justify-end">
              <MhdLeaveActionModal
                {...modalScope}
                action="segment"
                title="Record Leave Segment"
                launchLabel="Add Segment"
              >
                <MhdLeaveSegmentForm
                  caseId={caseId}
                  isPending={recordSegment.isPending}
                  onSubmit={(input) => recordSegment.mutateAsync(input)}
                />
              </MhdLeaveActionModal>
            </div>
          ) : null}
          {record.segments.length ? (
            record.segments.map((item) => (
              <MhdCard key={item.id}>
                <MhdDetailField
                  label="Segment mode"
                  value={item.segment_mode.replaceAll('_', ' ')}
                />
                <MhdDetailField label="Start" value={new Date(item.start_at).toLocaleString()} />
                <MhdDetailField label="End" value={new Date(item.end_at).toLocaleString()} />
                <MhdDetailField label="Hours" value={item.actual_hours ?? item.planned_hours} />
                <MhdDetailField label="Status" value={item.status} />
                {privileged ? (
                  <MhdLeaveSegmentStatusControl
                    {...modalScope}
                    segment={item}
                    isPending={updateSegmentStatus.isPending}
                    onSubmit={(input) => updateSegmentStatus.mutateAsync(input)}
                  />
                ) : null}
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No leave segments recorded.</p>
          )}
        </div>
      ) : null}

      {tab === 'communications' ? (
        <div className="space-y-3">
          {privileged ? (
            <div className="flex justify-end">
              <MhdLeaveActionModal
                {...modalScope}
                action="contact"
                title="Record Contact"
                size="md"
                launchLabel="Add Contact"
              >
                <MhdLeaveContactForm
                  isPending={event.isPending}
                  onSubmit={(summary) =>
                    event.mutateAsync({
                      caseId,
                      eventType: 'CONTACT',
                      channel: 'OTHER',
                      summary,
                      visibility: 'EMPLOYEE',
                    })
                  }
                />
              </MhdLeaveActionModal>
            </div>
          ) : null}
          {record.events.map((item) => (
            <MhdCard key={item.id}>
              <MhdDetailField label="Contact type" value={item.event_type.replaceAll('_', ' ')} />
              <MhdDetailField label="Summary" value={item.summary} className="mt-2" />
              <MhdDetailField
                label="Occurred"
                value={new Date(item.occurred_at).toLocaleString()}
                className="mt-2"
              />
              <MhdDetailField label="Channel" value={item.channel} className="mt-2" />
            </MhdCard>
          ))}
        </div>
      ) : null}

      {tab === 'pay' ? (
        <MhdLeavePayCoordinationPanel
          caseId={caseId}
          companyId={companyId}
          paySources={record.pay_sources}
          privileged={privileged}
          isPending={paySource.isPending || paySourceStatus.isPending}
          onRecord={async (input) => (await paySource.mutateAsync(input)).warnings}
          onUpdateStatus={async (input) =>
            (await attempt(() => paySourceStatus.mutateAsync(input)))?.value ?? null
          }
        />
      ) : null}

      {tab === 'benefits' ? (
        <div className="space-y-2">
          {privileged ? (
            <div className="flex flex-wrap justify-end gap-2">
              <MhdLeaveActionModal
                {...modalScope}
                action="benefit-obligation"
                title="Record Benefit Obligation"
                launchLabel="Add Obligation"
              >
                <MhdLeaveBenefitObligationForm
                  caseId={caseId}
                  isPending={recordObligation.isPending}
                  onSubmit={(input) => recordObligation.mutateAsync(input)}
                />
              </MhdLeaveActionModal>
              {record.benefits.length ? (
                <MhdLeaveActionModal
                  {...modalScope}
                  action="benefit-transaction"
                  title="Record Benefit Transaction"
                  launchLabel="Add Transaction"
                >
                  <MhdLeaveBenefitTransactionForm
                    obligations={record.benefits}
                    isPending={recordTransaction.isPending}
                    onSubmit={(input) => recordTransaction.mutateAsync(input)}
                  />
                </MhdLeaveActionModal>
              ) : null}
            </div>
          ) : null}
          <MhdCard className="space-y-3">
            <MhdCardHeader title="Health Coverage Continuation" />
            {record.health_continuation.length ? (
              record.health_continuation.map((item) => (
                <div
                  key={`${item.continuation_basis}-${item.coverage_start}`}
                  className="space-y-2 rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    {item.exceeds_cap ? (
                      <MhdBadge variant="warning">Coverage Runs Past The Cap</MhdBadge>
                    ) : null}
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-4">
                    <MhdDetailField label="Coverage start" value={item.coverage_start} />
                    <MhdDetailField label="Cap end" value={item.cap_end} />
                    <MhdDetailField label="Coverage end" value={item.coverage_end} />
                    <MhdDetailField label="Days remaining" value={item.days_remaining} />
                  </dl>
                  {item.exceeds_cap ? (
                    <p role="alert" className="text-sm text-amber-800">
                      The recorded coverage end is later than the {item.label} continuation cap of{' '}
                      {item.cap_end}.
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No group health continuation is being tracked.
              </p>
            )}
          </MhdCard>
          {record.benefits.length ? (
            record.benefits.map((item) => (
              <MhdCard key={item.id}>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <MhdDetailField
                    label="Benefit type"
                    value={mhdLeaveEnumLabel(item.benefit_type)}
                  />
                  <MhdDetailField label="Description" value={item.benefit_label} />
                  <MhdDetailField label="Coverage start" value={item.coverage_start} />
                  <MhdDetailField label="Coverage end" value={item.coverage_end} />
                  <MhdDetailField label="Employee amount" value={item.employee_amount} />
                  <MhdDetailField label="Employer amount" value={item.employer_amount} />
                  <MhdDetailField label="Frequency" value={mhdLeaveEnumLabel(item.frequency)} />
                  <MhdDetailField label="Due date" value={item.due_date} />
                  <MhdDetailField label="Grace period (days)" value={item.grace_period_days} />
                  <MhdDetailField
                    label="Continuation basis"
                    value={
                      item.continuation_basis
                        ? MHD_LEAVE_CONTINUATION_BASIS_LABELS[item.continuation_basis]
                        : null
                    }
                  />
                  <MhdDetailField
                    label="Seniority credit through"
                    value={item.seniority_credit_through}
                  />
                  <MhdDetailField label="Status" value={item.status} />
                  <MhdDetailField label="Status reason" value={item.status_reason} />
                </dl>
                {privileged ? (
                  <MhdLeaveBenefitObligationStatusControl
                    {...modalScope}
                    obligation={item}
                    isPending={updateObligationStatus.isPending}
                    onSubmit={(input) => updateObligationStatus.mutateAsync(input)}
                  />
                ) : null}
                <MhdLeaveBenefitTransactionList transactions={item.transactions} />
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No benefit-maintenance obligation recorded.
            </p>
          )}
        </div>
      ) : null}

      {tab === 'controls' ? (
        <MhdLeaveCaseControlsPanel
          caseData={record.case}
          privileged={privileged}
          isPending={workersComp.isPending || keyEmployee.isPending || essentialFunctions.isPending}
          onWorkersComp={(input) => workersComp.mutateAsync(input)}
          onKeyEmployee={(input) => keyEmployee.mutateAsync(input)}
          onEssentialFunctions={(providedOn) => essentialFunctions.mutateAsync(providedOn)}
        />
      ) : null}

      {tab === 'return' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {record.policy.rtw_certification_uniform_policy
              ? 'Return-to-work certifications are required under a uniformly applied company policy.'
              : 'No uniformly applied return-to-work certification policy is recorded for this company.'}
          </p>
          {privileged ? (
            <div className="flex justify-end">
              <MhdLeaveActionModal
                {...modalScope}
                action="return-to-work"
                title="Return-To-Work Plan"
                launchLabel={
                  record.return_to_work ? 'Edit Return-To-Work Plan' : 'Add Return-To-Work Plan'
                }
              >
                <MhdLeaveReturnToWorkForm
                  caseId={caseId}
                  current={record.return_to_work}
                  uniformCertificationPolicy={record.policy.rtw_certification_uniform_policy}
                  isPending={returnToWork.isPending}
                  onSubmit={(input) => returnToWork.mutateAsync(input)}
                />
              </MhdLeaveActionModal>
            </div>
          ) : null}
          {record.return_to_work ? (
            <MhdCard className="space-y-2">
              <dl className="grid gap-2 sm:grid-cols-2">
                <MhdDetailField
                  label="Expected return"
                  value={record.return_to_work.expected_return_date}
                />
                <MhdDetailField
                  label="Actual return"
                  value={record.return_to_work.actual_return_date ?? 'Not yet returned'}
                />
                <MhdDetailField
                  label="Reinstatement outcome"
                  value={
                    record.return_to_work.reinstatement_outcome
                      ? mhdLeaveEnumLabel(record.return_to_work.reinstatement_outcome)
                      : null
                  }
                />
                <MhdDetailField
                  label="Exception reason"
                  value={
                    privileged
                      ? record.return_to_work.reinstatement_exception_reason
                      : 'Not available'
                  }
                />
                <MhdDetailField
                  label="Fitness-for-duty certification"
                  value={record.return_to_work.fitness_required ? 'Required' : 'Not required'}
                />
                <MhdDetailField
                  label="Certification requested on"
                  value={record.return_to_work.rtw_certification_requested_on}
                />
                <MhdDetailField
                  label="Certification received on"
                  value={record.return_to_work.rtw_certification_received_on}
                />
                <MhdDetailField
                  label="Restrictions"
                  value={record.return_to_work.restrictions_present ? 'Present' : 'Not recorded'}
                />
              </dl>
              {record.return_to_work.accommodation_case_id ? (
                <Link
                  className="inline-block text-sm text-accent-hover hover:underline"
                  to={`/accommodations/${record.return_to_work.accommodation_case_id}`}
                >
                  Open Accommodation Process
                </Link>
              ) : null}
            </MhdCard>
          ) : (
            <p className="text-sm text-muted-foreground">No return-to-work plan recorded.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
