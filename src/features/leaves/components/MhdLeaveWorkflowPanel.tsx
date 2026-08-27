import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdDocumentService } from '@/features/documents/Service';
import {
  useMhdConfirmLeaveEligibility,
  useMhdLeaveEligibility,
  useMhdLeaveEvent,
  useMhdLeaveNotice,
  useMhdLeaveNoticeDelivery,
  useMhdLeaveReadiness,
  useMhdLeaveReturnToWork,
  useMhdLeaveWorkflow,
  useMhdOverrideLeaveEligibility,
} from '../WorkflowHook';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
type Tab = 'eligibility' | 'notices' | 'schedule' | 'communications' | 'benefits' | 'return';

export function MhdLeaveWorkflowPanel({
  caseId,
  privileged,
}: {
  caseId: string;
  privileged: boolean;
}) {
  const workflow = useMhdLeaveWorkflow(caseId);
  const { authUserId, profile } = useMhdAuth();
  const templates = useQuery({
    queryKey: ['mhd-leaves', 'document-templates', profile?.companyId ?? ''],
    queryFn: () => mhdDocumentService.listTemplates(profile!.companyId),
    enabled: Boolean(profile?.companyId),
  });
  const readiness = useMhdLeaveReadiness();
  const evaluate = useMhdLeaveEligibility(caseId);
  const confirm = useMhdConfirmLeaveEligibility(caseId);
  const override = useMhdOverrideLeaveEligibility(caseId);
  const event = useMhdLeaveEvent(caseId);
  const returnToWork = useMhdLeaveReturnToWork(caseId);
  const recordNotice = useMhdLeaveNotice(caseId);
  const markNoticeDelivery = useMhdLeaveNoticeDelivery(caseId);
  const [tab, setTab] = useState<Tab>('eligibility');
  const [reasonCode, setReasonCode] = useState('OWN_SERIOUS_HEALTH_CONDITION');
  const [relationship, setRelationship] = useState('');
  const [employerCount, setEmployerCount] = useState('50');
  const [worksiteCount, setWorksiteCount] = useState('50');
  const [months, setMonths] = useState('12');
  const [hours, setHours] = useState('1250');
  const [weeklyHours, setWeeklyHours] = useState('40');
  const [designatedPerson, setDesignatedPerson] = useState(false);
  const [coveredEmployerOverride, setCoveredEmployerOverride] = useState(false);
  const [eventSummary, setEventSummary] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [restrictions, setRestrictions] = useState(false);
  const [overriding, setOverriding] = useState<string | null>(null);
  const [overrideOutcome, setOverrideOutcome] = useState<
    'ELIGIBLE' | 'INELIGIBLE' | 'UNDETERMINED'
  >('ELIGIBLE');
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newNoticeOpen, setNewNoticeOpen] = useState(false);
  const [noticeType, setNoticeType] = useState('ELIGIBILITY');
  const [templateId, setTemplateId] = useState('');
  const [noticeDueAt, setNoticeDueAt] = useState('');

  const record = workflow.data;
  if (workflow.isLoading) return <p className="text-sm text-muted-foreground">Loading workflow…</p>;
  if (!record) return null;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The workflow action failed.');
    }
  }

  const tabs = [
    { value: 'eligibility' as const, label: 'Eligibility', count: record.eligibility.length },
    { value: 'notices' as const, label: 'Notices', count: record.notices.length },
    { value: 'schedule' as const, label: 'Schedule', count: record.segments.length },
    { value: 'communications' as const, label: 'Contacts', count: record.events.length },
    { value: 'benefits' as const, label: 'Benefits', count: record.benefits.length },
    { value: 'return' as const, label: 'Return to work' },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Leave workflow</h2>
        <p className="text-xs text-muted-foreground">
          Versioned eligibility, notices, usage, contacts, benefits, and return-to-work facts.
        </p>
      </div>
      <MhdComplianceGateBanner readiness={readiness.data} />
      <MhdTabs tabs={tabs} value={tab} onChange={setTab} />
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      {tab === 'eligibility' ? (
        <div className="space-y-3">
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
                    <Button
                      variant="secondary"
                      disabled={override.isPending}
                      onClick={() => setOverriding(overriding === item.id ? null : item.id)}
                    >
                      Override
                    </Button>
                  </div>
                ) : null}
              </div>
              {/*
               * The evaluated outcome and its findings stay on the record even
               * after an override — they are the evidence the override departed
               * from, not a draft it replaced.
               */}
              <MhdDetailField
                label="Findings"
                value={item.findings.length ? item.findings.map((finding) => String(finding.code ?? 'Review finding')).join(', ') : null}
                className="mt-2"
              />
              <MhdDetailField
                label="Override reason"
                value={item.override_reason ? `Overridden from ${item.evaluated_outcome}: ${item.override_reason}` : null}
                className="mt-2"
              />
              {privileged && overriding === item.id ? (
                <div className="mt-3 space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    An override is a documented human decision. The evaluated outcome, findings, and
                    rule-set version remain on the record.
                  </p>
                  <select
                    className={inputClass}
                    value={overrideOutcome}
                    onChange={(e) =>
                      setOverrideOutcome(
                        e.target.value as 'ELIGIBLE' | 'INELIGIBLE' | 'UNDETERMINED',
                      )
                    }
                    aria-label="Override outcome"
                  >
                    <option value="ELIGIBLE">Eligible</option>
                    <option value="INELIGIBLE">Ineligible</option>
                    <option value="UNDETERMINED">Undetermined</option>
                  </select>
                  <textarea
                    className={`min-h-20 ${inputClass}`}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Why the determination is being overridden"
                    aria-label="Override reason"
                  />
                  <Button
                    disabled={override.isPending || !overrideReason.trim()}
                    onClick={() =>
                      void run(async () => {
                        await override.mutateAsync({
                          determinationId: item.id,
                          effectiveOutcome: overrideOutcome,
                          overrideReason,
                        });
                        setOverrideReason('');
                        setOverriding(null);
                      })
                    }
                  >
                    Record Override
                  </Button>
                </div>
              ) : null}
            </MhdCard>
          ))}
          {privileged ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="Evaluate current facts" />
              <p className="text-xs text-muted-foreground">
                The engine evaluates each legal basis separately. CFRA does not use a 75-mile test;
                that count is used only for FMLA. A human must confirm every result.
              </p>
              <MhdFormFieldStack>
                <select
                  className={inputClass}
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                >
                  {[
                    'OWN_SERIOUS_HEALTH_CONDITION',
                    'FAMILY_SERIOUS_HEALTH_CONDITION',
                    'BONDING',
                    'PREGNANCY_DISABILITY',
                    'QUALIFYING_EXIGENCY',
                    'MILITARY_CAREGIVER',
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                >
                  <option value="">No family relationship</option>
                  {[
                    'CHILD',
                    'PARENT',
                    'SPOUSE',
                    'DOMESTIC_PARTNER',
                    'GRANDPARENT',
                    'GRANDCHILD',
                    'SIBLING',
                    'DESIGNATED_PERSON',
                    'NEXT_OF_KIN',
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
                <label className="text-xs">
                  Scheduled weekly hours
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  Employer employee count
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={employerCount}
                    onChange={(e) => setEmployerCount(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  FMLA worksite count within 75 miles
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={worksiteCount}
                    onChange={(e) => setWorksiteCount(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  Months of service
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  Hours worked in prior 12 months
                  <input
                    className={`mt-1 ${inputClass}`}
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </label>
              </MhdFormFieldStack>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={designatedPerson}
                  onChange={(e) => setDesignatedPerson(e.target.checked)}
                />{' '}
                Designated person selected for this leave year
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={coveredEmployerOverride}
                  onChange={(e) => setCoveredEmployerOverride(e.target.checked)}
                />{' '}
                Covered employer override (record only for a verified public agency/school or other
                covered-employer basis)
              </label>
              <Button
                disabled={evaluate.isPending}
                onClick={() =>
                  void run(() =>
                    evaluate.mutateAsync({
                      caseId,
                      asOfDate: new Date().toISOString().slice(0, 10),
                      employerEmployeeCount: Number(employerCount),
                      monthsOfService: Number(months),
                      hoursWorked12Months: Number(hours),
                      worksiteEmployeeCount75: Number(worksiteCount),
                      scheduledWeeklyHours: Number(weeklyHours),
                      reasonCode,
                      familyRelationship: relationship || null,
                      designatedPersonSelected: designatedPerson,
                      coveredEmployerOverride,
                    }),
                  )
                }
              >
                Evaluate all bases
              </Button>
            </MhdCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'notices' ? (
        <div className="space-y-2">
          {privileged ? (
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setNewNoticeOpen((open) => !open)}>
                New Notice
              </Button>
            </div>
          ) : null}
          {newNoticeOpen ? (
            <MhdCard className="space-y-3">
              <MhdCardHeader title="New leave notice" />
              <select className={inputClass} value={noticeType} onChange={(event) => setNoticeType(event.target.value)}>
                {['ELIGIBILITY', 'RIGHTS_RESPONSIBILITIES', 'DESIGNATION', 'DEFICIENCY', 'CHANGE', 'BALANCE', 'BENEFITS', 'RETURN_TO_WORK', 'DENIAL'].map((value) => (
                  <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
                ))}
              </select>
              <select className={inputClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                <option value="">Select a document template</option>
                {(templates.data ?? []).map((template) => (
                  <option key={template.id} value={template.id}>{template.name} (v{template.version})</option>
                ))}
              </select>
              <label className="text-sm">Due date (optional)<input className={`mt-1 ${inputClass}`} type="date" value={noticeDueAt} onChange={(event) => setNoticeDueAt(event.target.value)} /></label>
              <div className="flex gap-2">
                <Button
                  disabled={recordNotice.isPending || !templateId || !authUserId || !profile?.companyId}
                  onClick={() => void run(async () => {
                    const template = (templates.data ?? []).find((item) => item.id === templateId);
                    if (!template) throw new Error('Select a document template.');
                    const generation = await mhdDocumentService.generateAndPoll({
                      templateId: template.id,
                      companyId: profile!.companyId,
                      entityType: 'LEAVE_CASE',
                      entityId: caseId,
                      mergeData: {},
                    }, { actorUserId: authUserId! });
                    await recordNotice.mutateAsync({
                      caseId,
                      noticeType,
                      templateKey: template.id || template.name,
                      templateVersion: template.version,
                      dueAt: noticeDueAt || null,
                      documentGenerationId: generation.id,
                    });
                    setNewNoticeOpen(false);
                    setTemplateId('');
                    setNoticeDueAt('');
                  })}
                >{recordNotice.isPending ? 'Recording…' : 'Create Notice'}</Button>
                <Button variant="secondary" onClick={() => setNewNoticeOpen(false)}>Cancel</Button>
              </div>
            </MhdCard>
          ) : null}
          {record.notices.length ? (
            record.notices.map((item) => (
              <MhdCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <MhdDetailField label="Notice type" value={item.notice_type.replaceAll('_', ' ')} />
                    <MhdDetailField label="Status" value={item.status} />
                    <MhdDetailField label="Due" value={item.due_at} />
                    <MhdDetailField label="Delivered" value={item.delivered_at} />
                  </div>
                  {privileged && item.status !== 'DELIVERED' ? <Button variant="secondary" disabled={markNoticeDelivery.isPending} onClick={() => void run(() => markNoticeDelivery.mutateAsync({ noticeId: item.id, status: 'DELIVERED' }))}>Mark Delivered</Button> : null}
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
          {record.segments.length ? (
            record.segments.map((item) => (
              <MhdCard key={item.id}>
                <MhdDetailField label="Segment mode" value={item.segment_mode.replaceAll('_', ' ')} />
                <MhdDetailField label="Start" value={new Date(item.start_at).toLocaleString()} />
                <MhdDetailField label="End" value={new Date(item.end_at).toLocaleString()} />
                <MhdDetailField label="Hours" value={item.actual_hours ?? item.planned_hours} />
                <MhdDetailField label="Status" value={item.status} />
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No leave segments recorded.</p>
          )}
        </div>
      ) : null}

      {tab === 'communications' ? (
        <div className="space-y-3">
          {record.events.map((item) => (
            <MhdCard key={item.id}>
              <MhdDetailField label="Contact type" value={item.event_type.replaceAll('_', ' ')} />
              <MhdDetailField label="Summary" value={item.summary} className="mt-2" />
              <MhdDetailField label="Occurred" value={new Date(item.occurred_at).toLocaleString()} className="mt-2" />
              <MhdDetailField label="Channel" value={item.channel} className="mt-2" />
            </MhdCard>
          ))}
          {privileged ? (
            <MhdCard className="space-y-2">
              <textarea
                className={`min-h-20 ${inputClass}`}
                value={eventSummary}
                onChange={(e) => setEventSummary(e.target.value)}
                placeholder="Operational contact summary—no medical details"
              />
              <Button
                disabled={event.isPending || !eventSummary.trim()}
                onClick={() =>
                  void run(async () => {
                    await event.mutateAsync({
                      caseId,
                      eventType: 'CONTACT',
                      channel: 'OTHER',
                      summary: eventSummary,
                      visibility: 'EMPLOYEE',
                    });
                    setEventSummary('');
                  })
                }
              >
                Record contact
              </Button>
            </MhdCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'benefits' ? (
        <div className="space-y-2">
          {record.benefits.length ? (
            record.benefits.map((item) => (
              <MhdCard key={item.id}>
                <MhdDetailField label="Benefit type" value={item.benefit_type.replaceAll('_', ' ')} />
                <MhdDetailField label="Coverage start" value={item.coverage_start} className="mt-2" />
                <MhdDetailField label="Employee amount" value={item.employee_amount} className="mt-2" />
                <MhdDetailField label="Employer amount" value={item.employer_amount} className="mt-2" />
                <MhdDetailField label="Status" value={item.status} className="mt-2" />
              </MhdCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No benefit-maintenance obligation recorded.
            </p>
          )}
        </div>
      ) : null}

      {tab === 'return' ? (
        <div className="space-y-3">
          {record.return_to_work ? (
            <MhdCard>
              <p className="font-medium">Expected {record.return_to_work.expected_return_date}</p>
              <p className="text-sm text-muted-foreground">
                Actual {record.return_to_work.actual_return_date ?? 'not yet'} · restrictions{' '}
                {record.return_to_work.restrictions_present ? 'present' : 'not recorded'}
              </p>
              {record.return_to_work.accommodation_case_id ? (
                <Link
                  className="mt-2 inline-block text-sm text-accent-hover hover:underline"
                  to={`/accommodations/${record.return_to_work.accommodation_case_id}`}
                >
                  Open accommodation process
                </Link>
              ) : null}
            </MhdCard>
          ) : null}
          {privileged ? (
            <MhdCard className="space-y-3">
              <label className="text-sm font-medium">
                Expected return date
                <MhdDateField
                  className={`mt-1 ${inputClass}`}
                  value={expectedReturn}
                  onChange={(nextValue) => setExpectedReturn(nextValue)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={restrictions}
                  onChange={(e) => setRestrictions(e.target.checked)}
                />{' '}
                Work restrictions present; begin accommodation referral
              </label>
              <Button
                disabled={returnToWork.isPending || !expectedReturn}
                onClick={() =>
                  void run(() =>
                    returnToWork.mutateAsync({
                      caseId,
                      expectedReturnDate: expectedReturn,
                      fitnessRequired: false,
                      restrictionsPresent: restrictions,
                      accommodationReferralRequired: restrictions,
                    }),
                  )
                }
              >
                Save return-to-work plan
              </Button>
            </MhdCard>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
