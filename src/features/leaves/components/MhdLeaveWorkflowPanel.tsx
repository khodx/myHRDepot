import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import {
  useMhdConfirmLeaveEligibility,
  useMhdLeaveEligibility,
  useMhdLeaveEvent,
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
  const readiness = useMhdLeaveReadiness();
  const evaluate = useMhdLeaveEligibility(caseId);
  const confirm = useMhdConfirmLeaveEligibility(caseId);
  const override = useMhdOverrideLeaveEligibility(caseId);
  const event = useMhdLeaveEvent(caseId);
  const returnToWork = useMhdLeaveReturnToWork(caseId);
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
              {item.findings.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">
                  {item.findings.map((finding, index) => (
                    <li key={index}>{String(finding.code ?? 'Review finding')}</li>
                  ))}
                </ul>
              ) : null}
              {item.override_reason ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Overridden from {item.evaluated_outcome}: {item.override_reason}
                </p>
              ) : null}
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
              <div className="grid gap-3 md:grid-cols-3">
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
              </div>
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
          {record.notices.length ? (
            record.notices.map((item) => (
              <MhdCard key={item.id}>
                <p className="font-medium">{item.notice_type.replaceAll('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">
                  {item.status} · due {item.due_at ?? 'not set'} · delivered{' '}
                  {item.delivered_at ?? 'not yet'}
                </p>
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
                <p className="font-medium">{item.segment_mode.replaceAll('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.start_at).toLocaleString()} →{' '}
                  {new Date(item.end_at).toLocaleString()} ·{' '}
                  {item.actual_hours ?? item.planned_hours} hours · {item.status}
                </p>
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
              <p className="font-medium">{item.event_type.replaceAll('_', ' ')}</p>
              <p className="mt-1 text-sm">{item.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(item.occurred_at).toLocaleString()} · {item.channel}
              </p>
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
                <p className="font-medium">{item.benefit_type.replaceAll('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">
                  {item.coverage_start} · employee {item.employee_amount} / employer{' '}
                  {item.employer_amount} · {item.status}
                </p>
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
                <input
                  className={`mt-1 ${inputClass}`}
                  type="date"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
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
