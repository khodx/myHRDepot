import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdComplianceGateBanner } from '@/components/ui/MhdComplianceGateBanner';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdWizardOutputStep } from '@/components/ui/MhdWizardOutputStep';
import { MhdWizardShell } from '@/components/ui/MhdWizardShell';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdExitDocumentCeremony,
  useMhdOffboardingObligations,
  useMhdOffboardingOutstandingProperty,
  useMhdOffboardingPeople,
  useMhdOffboardingUsers,
  useMhdOffboardingNoticePlan,
  useMhdOpenOffboardingFromIntake,
} from '../Hook';
import {
  MHD_OFFBOARDING_NOTICE_KEYS,
  MHD_OFFBOARDING_NOTICE_LABELS,
  MHD_SEPARATION_TYPES,
  mhdFormatSeparationType,
  type MhdOffboardingIntakeCustomItem,
  type MhdOffboardingNoticeKey,
  type MhdOffboardingNoticePlanInput,
  type MhdOpenOffboardingIntakeInput,
  type MhdSeparationType,
} from '../Types';
import { useMhdModuleComplianceReadiness } from '@/utils/useMhdModuleComplianceReadiness';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';
import { MHD_US_STATES } from '@/utils/mhdUsStates';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

interface ChecklistDraft extends MhdOffboardingIntakeCustomItem {
  id: string;
}

function blank(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function dateLabel(value: string | null | undefined): string {
  return value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Not set';
}

function personName(people: Array<{ id: string; displayName: string }>, id: string): string {
  return people.find((person) => person.id === id)?.displayName ?? 'Unknown employee';
}

function newChecklistItem(): ChecklistDraft {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    isRequired: false,
    dueDate: '',
    assignedUserId: '',
  };
}

export function MhdOffboardingWizard() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const readiness = useMhdModuleComplianceReadiness('OFFBOARDING');
  const people = useMhdOffboardingPeople(companyId || null);
  const users = useMhdOffboardingUsers(companyId || null);
  const openOffboarding = useMhdOpenOffboardingFromIntake();
  const ceremony = useMhdExitDocumentCeremony();

  const [personId, setPersonId] = useState('');
  const [separationType, setSeparationType] = useState<MhdSeparationType>('RESIGNATION');
  const [separationDate, setSeparationDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [reasonSummary, setReasonSummary] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [noticeGivenDays, setNoticeGivenDays] = useState('');
  const [layoffCount, setLayoffCount] = useState('');
  const [noticeChecked, setNoticeChecked] = useState<Record<string, boolean>>({});
  const [noticeDates, setNoticeDates] = useState<Record<string, string>>({});
  const [deviationReasons, setDeviationReasons] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<ChecklistDraft[]>([]);
  const [reviewedMatters, setReviewedMatters] = useState(false);
  const [openedCase, setOpenedCase] = useState<{ id: string; referenceId: string } | null>(null);
  const [ceremonyError, setCeremonyError] = useState<string | null>(null);

  const person = personId || null;
  const outstandingProperty = useMhdOffboardingOutstandingProperty(person);
  const obligations = useMhdOffboardingObligations(person);
  const noticeInput = useMemo<MhdOffboardingNoticePlanInput | null>(() => {
    if (!personId || !separationDate) return null;
    return {
      companyId,
      personId,
      separationType,
      separationDate,
      ...(lastWorkingDay ? { lastWorkingDay } : {}),
      ...(stateCode ? { stateCode } : {}),
      ...(separationType === 'RESIGNATION' || separationType === 'RETIREMENT'
        ? { noticeGivenDays: noticeGivenDays === '' ? null : Number(noticeGivenDays) }
        : {}),
      ...(separationType === 'LAYOFF'
        ? { layoffCount: layoffCount === '' ? null : Number(layoffCount) }
        : {}),
    };
  }, [
    companyId,
    lastWorkingDay,
    layoffCount,
    noticeGivenDays,
    personId,
    separationDate,
    separationType,
    stateCode,
  ]);
  const noticePlan = useMhdOffboardingNoticePlan(noticeInput);
  const planItems = useMemo(() => noticePlan.data?.items ?? [], [noticePlan.data]);
  const peopleList = people.data ?? [];
  const userList = users.data ?? [];
  const matters = obligations.data
    ? [
        ...obligations.data.leaveCases,
        ...obligations.data.accommodationCases,
        ...obligations.data.conductCases,
      ]
    : [];
  const leaveVisible = obligations.data?.leaveVisible ?? true;
  const accommodationVisible = obligations.data?.accommodationVisible ?? true;

  const groupedNotices = useMemo(() => {
    const grouped = new Map<MhdOffboardingNoticeKey, typeof planItems>();
    for (const key of MHD_OFFBOARDING_NOTICE_KEYS)
      grouped.set(
        key,
        planItems.filter((item) => item.noticeKey === key),
      );
    return grouped;
  }, [planItems]);

  function noticeRecommendation(items: typeof planItems): string | null {
    return (
      items
        .filter((item) => item.applies !== false)
        .map((item) => item.recommendedDue)
        .sort()[0] ?? null
    );
  }

  function noticeIsPendingEvaluation(items: typeof planItems): boolean {
    return items.some((item) => item.applies === null);
  }

  function noticeIsPlannable(items: typeof planItems): boolean {
    return (
      items.length > 0 &&
      !noticeIsPendingEvaluation(items) &&
      items.some((item) => item.applies !== false)
    );
  }

  function noticeSelected(key: MhdOffboardingNoticeKey): boolean {
    return noticeChecked[key] ?? true;
  }

  function noticeDate(key: MhdOffboardingNoticeKey, recommended: string): string {
    return noticeDates[key] ?? recommended;
  }

  function validateNotices(): string | null {
    for (const key of MHD_OFFBOARDING_NOTICE_KEYS) {
      const items = groupedNotices.get(key) ?? [];
      if (!noticeIsPlannable(items) || !noticeSelected(key)) continue;
      const recommended = noticeRecommendation(items);
      const planned = noticeDate(key, recommended ?? '');
      if (recommended && planned > recommended && !deviationReasons[key]?.trim()) {
        return `Record why the ${MHD_OFFBOARDING_NOTICE_LABELS[key]} is planned after its recommended date.`;
      }
    }
    return null;
  }

  function validateChecklist(): string | null {
    return checklist.some((item) => !item.title.trim())
      ? 'Give each checklist item a title.'
      : null;
  }

  function validateMatters(): string | null {
    return matters.length > 0 && !reviewedMatters
      ? 'Confirm you have reviewed the open matters.'
      : null;
  }

  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'person',
      title: 'Person & Separation',
      description: 'Record who is leaving and how.',
      validate: () => {
        if (!personId) return 'Choose an employee.';
        if (!separationDate) return 'Enter the separation date.';
        if (lastWorkingDay && lastWorkingDay < separationDate)
          return 'The last working day cannot be before the separation date.';
        return null;
      },
    },
    {
      id: 'notices',
      title: 'Final Pay & Benefits Notices',
      description: 'Review recommended notice dates.',
      validate: validateNotices,
    },
    {
      id: 'checklist',
      title: 'Property & Access',
      description: 'Add any extra exit checklist items.',
      validate: validateChecklist,
    },
    {
      id: 'status',
      title: 'Leave & Accommodation Status',
      description: 'Review open matters.',
      validate: validateMatters,
    },
    {
      id: 'review',
      title: 'Review & Open',
      description: 'Confirm the offboarding case.',
      validate: validateMatters,
    },
  ];

  const flow = useMhdWizardFlow({
    steps,
    isDirty: Boolean(
      personId ||
      separationDate ||
      lastWorkingDay ||
      reasonSummary.trim() ||
      stateCode ||
      noticeGivenDays ||
      layoffCount ||
      Object.keys(noticeChecked).length ||
      Object.keys(noticeDates).length ||
      Object.keys(deviationReasons).length ||
      checklist.length ||
      reviewedMatters,
    ),
    onSubmit: async () => {
      const notices = MHD_OFFBOARDING_NOTICE_KEYS.flatMap((key) => {
        const items = groupedNotices.get(key) ?? [];
        if (!noticeIsPlannable(items) || !noticeSelected(key)) return [];
        const recommended = noticeRecommendation(items) ?? '';
        const planned = noticeDate(key, recommended);
        const later = Boolean(recommended) && planned > recommended;
        return [
          {
            noticeKey: key,
            plannedDue: planned || null,
            deviationReason: later ? blank(deviationReasons[key] ?? '') : null,
          },
        ];
      });
      const input: MhdOpenOffboardingIntakeInput = {
        companyId,
        personId,
        separationType,
        separationDate,
        ...(lastWorkingDay ? { lastWorkingDay } : {}),
        ...(blank(reasonSummary) ? { reasonSummary: blank(reasonSummary) } : {}),
        ...(stateCode ? { stateCode } : {}),
        ...(separationType === 'RESIGNATION' || separationType === 'RETIREMENT'
          ? { noticeGivenDays: noticeGivenDays === '' ? null : Number(noticeGivenDays) }
          : {}),
        ...(separationType === 'LAYOFF'
          ? { layoffCount: layoffCount === '' ? null : Number(layoffCount) }
          : {}),
        ...(notices.length ? { notices } : {}),
        ...(checklist.length
          ? {
              customItems: checklist.map((item) => ({
                title: item.title.trim(),
                description: blank(item.description ?? ''),
                isRequired: item.isRequired,
                dueDate: item.dueDate || null,
                assignedUserId: item.assignedUserId || null,
              })),
            }
          : {}),
      };
      const result = await openOffboarding.mutateAsync(input);
      setOpenedCase(result);
    },
  });

  function updateChecklist(id: string, patch: Partial<ChecklistDraft>) {
    setChecklist((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function renderNotices() {
    if (noticePlan.isLoading)
      return <p className="text-sm text-muted-foreground">Loading notice recommendations…</p>;
    if (noticePlan.isError)
      return (
        <p role="alert" className="text-sm text-rose-700">
          {noticePlan.error instanceof Error
            ? noticePlan.error.message
            : 'Unable to load notice recommendations.'}
        </p>
      );
    return (
      <MhdFormFieldStack>
        {noticePlan.data?.advisories.map((advisory) => (
          <div
            key={advisory}
            role="status"
            className="rounded-md border border-border bg-muted p-3 text-sm"
          >
            {advisory}
          </div>
        ))}
        {MHD_OFFBOARDING_NOTICE_KEYS.map((key) => {
          const items = groupedNotices.get(key) ?? [];
          if (!items.length) return null;
          const pending = noticeIsPendingEvaluation(items);
          const plannable = noticeIsPlannable(items);
          const recommended = noticeRecommendation(items);
          const allNotApplicable = items.every((item) => item.applies === false);
          return (
            <MhdCard key={key} className="space-y-3">
              <h3 className="font-semibold">{MHD_OFFBOARDING_NOTICE_LABELS[key]}</h3>
              {Array.from(new Set(items.map((item) => item.jurisdiction))).map((jurisdiction) => (
                <div key={jurisdiction} className="space-y-1 text-sm">
                  <p className="font-medium">{jurisdiction}</p>
                  {items
                    .filter((item) => item.jurisdiction === jurisdiction)
                    .map((item) => (
                      <p key={item.ruleId}>
                        {item.summary} Citation: {item.citation}. Recommended:{' '}
                        {dateLabel(item.recommendedDue)}.
                      </p>
                    ))}
                </div>
              ))}
              {allNotApplicable ? (
                <p className="text-sm text-muted-foreground">
                  {items.find((item) => item.notApplicableReason)?.notApplicableReason}
                </p>
              ) : null}
              {pending ? (
                <p className="text-sm text-muted-foreground">
                  Enter the number of employees affected on the first step to evaluate this notice.
                </p>
              ) : null}
              {plannable ? (
                <>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={noticeSelected(key)}
                      onChange={(event) =>
                        setNoticeChecked((current) => ({ ...current, [key]: event.target.checked }))
                      }
                    />
                    Plan this notice
                  </label>
                  <div>
                    <label htmlFor={`notice-date-${key}`} className="block text-sm font-medium">
                      Planned date
                    </label>
                    <MhdDateField
                      id={`notice-date-${key}`}
                      value={noticeDate(key, recommended ?? '')}
                      onChange={(value) =>
                        setNoticeDates((current) => ({ ...current, [key]: value }))
                      }
                    />
                  </div>
                  {recommended && noticeDate(key, recommended) > recommended ? (
                    <label className="block text-sm font-medium">
                      Why is this later than recommended?
                      <textarea
                        className={`mt-1 min-h-20 ${inputClass}`}
                        value={deviationReasons[key] ?? ''}
                        onChange={(event) =>
                          setDeviationReasons((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ) : null}
                </>
              ) : null}
            </MhdCard>
          );
        })}
        <p className="text-sm text-muted-foreground">
          These dates are recommendations drawn from the rules on file. They are not legal advice.
        </p>
      </MhdFormFieldStack>
    );
  }

  function renderStatus() {
    if (obligations.isLoading)
      return <p className="text-sm text-muted-foreground">Loading open matters…</p>;
    if (obligations.isError)
      return (
        <p role="alert" className="text-sm text-rose-700">
          {obligations.error instanceof Error
            ? obligations.error.message
            : 'Unable to load open matters.'}
        </p>
      );
    const renderCases = (label: string, cases: typeof matters) =>
      cases.length ? (
        <div>
          <h3 className="font-medium">{label}</h3>
          {cases.map((item) => (
            <p key={`${label}-${item.referenceId}`} className="text-sm">
              {item.referenceId} — {item.status}
              {item.requestedStart
                ? ` (${dateLabel(item.requestedStart)}${item.requestedEnd ? ` to ${dateLabel(item.requestedEnd)}` : ''})`
                : ''}
            </p>
          ))}
        </div>
      ) : null;
    return (
      <MhdFormFieldStack>
        {!leaveVisible ? (
          <p className="text-sm text-muted-foreground">
            Leave matters are not visible to your role.
          </p>
        ) : (
          renderCases('Leave', obligations.data?.leaveCases ?? [])
        )}
        {!accommodationVisible ? (
          <p className="text-sm text-muted-foreground">
            Accommodation matters are not visible to your role.
          </p>
        ) : (
          renderCases('Accommodations', obligations.data?.accommodationCases ?? [])
        )}
        {renderCases('Corrective-action cases', obligations.data?.conductCases ?? [])}
        {!matters.length ? (
          <p className="text-sm text-muted-foreground">Nothing open for this employee.</p>
        ) : null}
        {matters.length ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={reviewedMatters}
              onChange={(event) => setReviewedMatters(event.target.checked)}
            />
            I have reviewed the open matters above
          </label>
        ) : null}
      </MhdFormFieldStack>
    );
  }

  function renderStep() {
    switch (flow.currentStep?.id) {
      case 'person':
        return (
          <MhdFormFieldStack>
            <label className="block text-sm font-medium">
              Employee
              <select
                className={`mt-1 ${inputClass}`}
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
              >
                <option value="">Choose an employee</option>
                {peopleList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Separation type
              <select
                className={`mt-1 ${inputClass}`}
                value={separationType}
                onChange={(event) => setSeparationType(event.target.value as MhdSeparationType)}
              >
                {MHD_SEPARATION_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatSeparationType(value)}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <label htmlFor="separation-date" className="block text-sm font-medium">
                Separation date
              </label>
              <MhdDateField
                id="separation-date"
                value={separationDate}
                onChange={setSeparationDate}
                required
              />
            </div>
            <div>
              <label htmlFor="last-working-day" className="block text-sm font-medium">
                Last working day
              </label>
              <MhdDateField
                id="last-working-day"
                value={lastWorkingDay}
                onChange={setLastWorkingDay}
                min={separationDate || undefined}
              />
            </div>
            <label className="block text-sm font-medium">
              Reason summary
              <textarea
                className={`mt-1 min-h-24 ${inputClass}`}
                value={reasonSummary}
                onChange={(event) => setReasonSummary(event.target.value)}
              />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                This stays on the case and is not printed on the offboarding summary.
              </span>
            </label>
            <label className="block text-sm font-medium">
              Governing state
              <select
                className={`mt-1 ${inputClass}`}
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
              >
                <option value="">Choose a state</option>
                {MHD_US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </label>
            {separationType === 'RESIGNATION' || separationType === 'RETIREMENT' ? (
              <label className="block text-sm font-medium">
                Notice given (days)
                <input
                  className={`mt-1 ${inputClass}`}
                  type="number"
                  min="0"
                  value={noticeGivenDays}
                  onChange={(event) => setNoticeGivenDays(event.target.value)}
                />
              </label>
            ) : null}
            {separationType === 'LAYOFF' ? (
              <label className="block text-sm font-medium">
                Employees affected
                <input
                  className={`mt-1 ${inputClass}`}
                  type="number"
                  min="0"
                  value={layoffCount}
                  onChange={(event) => setLayoffCount(event.target.value)}
                />
              </label>
            ) : null}
          </MhdFormFieldStack>
        );
      case 'notices':
        return renderNotices();
      case 'checklist':
        return (
          <MhdFormFieldStack>
            {outstandingProperty.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading outstanding property…</p>
            ) : null}
            {!outstandingProperty.isLoading && !(outstandingProperty.data ?? []).length ? (
              <p className="text-sm text-muted-foreground">No property is outstanding.</p>
            ) : null}
            {(outstandingProperty.data ?? []).map((item) => (
              <p key={item.id} className="text-sm">
                {item.itemName} — quantity {item.quantity}
              </p>
            ))}
            <p className="text-sm text-muted-foreground">
              The standard exit checklist (property return, exit acknowledgment, access revocation,
              final pay, exit interview, benefits notice) is created automatically.
            </p>
            {checklist.map((item) => (
              <MhdCard key={item.id} className="space-y-3">
                <label className="block text-sm font-medium">
                  Title
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={item.title}
                    onChange={(event) => updateChecklist(item.id, { title: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Description
                  <textarea
                    className={`mt-1 min-h-20 ${inputClass}`}
                    value={item.description ?? ''}
                    onChange={(event) =>
                      updateChecklist(item.id, { description: event.target.value })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={Boolean(item.isRequired)}
                    onChange={(event) =>
                      updateChecklist(item.id, { isRequired: event.target.checked })
                    }
                  />
                  Required
                </label>
                <div>
                  <label
                    htmlFor={`checklist-date-${item.id}`}
                    className="block text-sm font-medium"
                  >
                    Due date
                  </label>
                  <MhdDateField
                    id={`checklist-date-${item.id}`}
                    value={item.dueDate ?? ''}
                    onChange={(value) => updateChecklist(item.id, { dueDate: value })}
                  />
                </div>
                <label className="block text-sm font-medium">
                  Assignee
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={item.assignedUserId ?? ''}
                    onChange={(event) =>
                      updateChecklist(item.id, { assignedUserId: event.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {userList.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setChecklist((current) => current.filter((entry) => entry.id !== item.id))
                  }
                >
                  Remove
                </Button>
              </MhdCard>
            ))}
            <Button onClick={() => setChecklist((current) => [...current, newChecklistItem()])}>
              Add Checklist Item
            </Button>
          </MhdFormFieldStack>
        );
      case 'status':
        return renderStatus();
      default:
        return (
          <MhdFormFieldStack>
            <p className="text-sm">
              <strong>Employee:</strong> {personName(peopleList, personId)}
            </p>
            <p className="text-sm">
              <strong>Separation:</strong> {mhdFormatSeparationType(separationType)}
            </p>
            <p className="text-sm">
              <strong>Dates:</strong> {dateLabel(separationDate)}; last working day{' '}
              {dateLabel(lastWorkingDay)}
            </p>
            <p className="text-sm">
              <strong>Governing state:</strong> {stateCode || 'Not set'}
            </p>
            <div>
              <h3 className="font-medium">Planned notices</h3>
              {MHD_OFFBOARDING_NOTICE_KEYS.map((key) => {
                const items = groupedNotices.get(key) ?? [];
                return noticeIsPlannable(items) && noticeSelected(key) ? (
                  <p key={key} className="text-sm">
                    {MHD_OFFBOARDING_NOTICE_LABELS[key]}:{' '}
                    {dateLabel(noticeDate(key, noticeRecommendation(items) ?? ''))}
                    {deviationReasons[key]?.trim() ? ` — ${deviationReasons[key].trim()}` : ''}
                  </p>
                ) : null;
              })}
            </div>
            <div>
              <h3 className="font-medium">Custom checklist items</h3>
              {checklist.length ? (
                checklist.map((item) => (
                  <p key={item.id} className="text-sm">
                    {item.title} — {item.isRequired ? 'Required' : 'Optional'}
                  </p>
                ))
              ) : (
                <p className="text-sm">None</p>
              )}
            </div>
            <p className="text-sm">
              <strong>Open matters reviewed:</strong>{' '}
              {matters.length ? (reviewedMatters ? 'Yes' : 'No') : 'No open matters'}
            </p>
          </MhdFormFieldStack>
        );
    }
  }

  const completion = openedCase ? (
    <div className="space-y-4">
      <MhdCard>
        <h2 className="text-lg font-semibold">Offboarding Case Opened</h2>
        <p className="mt-2 text-sm text-muted-foreground">Reference: {openedCase.referenceId}</p>
        <div className="mt-4">
          <Button onClick={() => navigate(`/offboarding/${openedCase.id}`)}>Open Case</Button>
        </div>
      </MhdCard>
      <MhdWizardOutputStep
        companyId={companyId}
        sourceWizard="OFFBOARDING"
        templateKey="OFFBOARDING_SUMMARY"
        entityType="OFFBOARDING_CASE"
        entityId={openedCase.id}
        recordLabel="offboarding summary"
      />
      <MhdCard className="space-y-3">
        <h2 className="text-lg font-semibold">Issue Exit Acknowledgment For Signature</h2>
        <Button
          disabled={ceremony.isLaunching}
          onClick={() => {
            setCeremonyError(null);
            void ceremony
              .launch(openedCase.id, { actorUserId: profile?.userId ?? null })
              .catch((error: unknown) =>
                setCeremonyError(error instanceof Error ? error.message : String(error)),
              );
          }}
        >
          {ceremony.isLaunching ? 'Sending…' : 'Issue Exit Acknowledgment For Signature'}
        </Button>
        {ceremony.steps.length ? (
          <div className="space-y-1 text-sm">
            {ceremony.steps.map((step) => (
              <p key={step.key}>
                {step.label}:{' '}
                {step.status === 'ERROR'
                  ? 'Failed'
                  : step.status === 'DONE'
                    ? 'Done'
                    : step.status === 'RUNNING'
                      ? 'Running'
                      : 'Pending'}
              </p>
            ))}
          </div>
        ) : null}
        {ceremonyError ? (
          <p role="alert" className="text-sm text-rose-700">
            {ceremonyError}
          </p>
        ) : null}
        {ceremony.steps.length > 0 && ceremony.steps.every((step) => step.status === 'DONE') ? (
          <p role="status" className="text-sm">
            The exit acknowledgment was sent for signature.
          </p>
        ) : null}
      </MhdCard>
    </div>
  ) : undefined;

  return (
    <MhdWizardShell
      title="Guided offboarding"
      description="Record the separation, plan the required notices, set up the exit checklist, and see what is still open for the employee."
      backTo="/offboarding"
      backLabel="Offboarding"
      cancelTo="/offboarding"
      gateBanner={<MhdComplianceGateBanner readiness={readiness.data} />}
      flow={flow}
      completion={completion}
    >
      {renderStep()}
    </MhdWizardShell>
  );
}

export default MhdOffboardingWizard;
