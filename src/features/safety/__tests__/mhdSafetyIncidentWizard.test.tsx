import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MhdSafetyIncidentWizard from '../components/MhdSafetyIncidentWizard';

type User = ReturnType<typeof userEvent.setup>;

const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  recordReport: vi.fn(),
  establishments: [] as Array<{ id: string; establishmentName: string }>,
  people: [] as Array<{ id: string; firstName: string; lastName: string }>,
  rules: [] as Array<Record<string, unknown>>,
  severeRules: [] as Array<Record<string, unknown>>,
  severe: {} as Record<string, unknown>,
  leave: {} as Record<string, unknown>,
  recommendation: {} as Record<string, unknown>,
}));

vi.mock('../Hook', () => ({
  useMhdOshaEstablishments: () => ({ data: mocks.establishments }),
  useMhdSafetyPeople: () => ({ data: mocks.people }),
  useMhdSafetyRecordabilityRules: () => ({ data: mocks.rules }),
  useMhdSafetyRecordability: () => ({ data: mocks.recommendation }),
  useMhdSafetySevereInjuryRules: () => ({ data: mocks.severeRules }),
  useMhdSafetySevereInjury: () => ({ data: mocks.severe }),
  useMhdSafetyLeaveContext: () => ({ data: mocks.leave }),
  useMhdOpenSafetyIncidentFromIntake: () => ({ mutateAsync: mocks.open, isPending: false }),
  useMhdRecordSevereInjuryReport: () => ({ mutateAsync: mocks.recordReport, isPending: false }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-ridgeline' } }),
}));

vi.mock('@/utils/useMhdModuleComplianceReadiness', () => ({
  useMhdModuleComplianceReadiness: () => ({ data: { isReady: true } }),
}));

vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: ({
    templateKey,
    entityType,
    entityId,
  }: {
    templateKey: string;
    entityType: string;
    entityId: string;
  }) => (
    <div>
      Document step: {templateKey} for {entityType} {entityId}
    </div>
  ),
}));

vi.mock('@/components/ui/MhdEntityAttachmentsPanel', () => ({
  MhdEntityAttachmentsPanel: ({
    entityType,
    entityId,
  }: {
    entityType: string;
    entityId: string;
  }) => (
    <div>
      Attachments for {entityType} {entityId}
    </div>
  ),
}));

const WORK_RELATED_RULE = {
  ruleKey: 'WORK_RELATED',
  kind: 'PRECONDITION',
  factKey: 'work_related',
  answerType: 'BOOLEAN',
  outcomeClassification: null,
  label: 'The injury resulted from an event in the work environment',
  guidance: 'An event or exposure at work caused or contributed to the condition.',
  citation: '29 CFR 1904.5(a)',
};

const DAYS_AWAY_RULE = {
  ruleKey: 'DAYS_AWAY',
  kind: 'CRITERION',
  factKey: 'days_away_count',
  answerType: 'NUMBER',
  outcomeClassification: 'DAYS_AWAY_FROM_WORK',
  label: 'The employee has days away from work',
  guidance: null,
  citation: '29 CFR 1904.7(b)(3)',
};

const AMPUTATION_RULE = {
  ruleKey: 'CA_AMPUTATION',
  jurisdiction: 'CALIFORNIA',
  triggerKind: 'AMPUTATION',
  factKey: 'amputation',
  deadlineHours: 8,
  label: 'An amputation',
  guidance: 'A serious injury under Cal/OSHA.',
  citation: 'Cal. Labor Code 6302(h), 6409.1(b)',
};

const RECORDABLE_RECOMMENDATION = {
  ruleSetVersion: 1,
  registryReviewStatus: 'PENDING_REVIEW',
  recordable: true,
  classification: 'OTHER_RECORDABLE',
  failedPreconditions: [],
  matchedCriteria: [
    {
      ruleKey: 'MEDICAL_TREATMENT',
      label: 'The employee received medical treatment beyond first aid',
      citation: '29 CFR 1904.7(b)(5)',
    },
  ],
  missingFacts: [],
};

const NO_TRIGGERS = { jurisdiction: 'FEDERAL', triggers: [], needsNotifiedTime: false };

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/safety/incidents/new']}>
      <Routes>
        <Route path="/safety/incidents/new" element={<MhdSafetyIncidentWizard />} />
        <Route path="/safety" element={<p>Safety page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function next(user: User) {
  const button = screen.getByRole('button', { name: 'Next' });
  await waitFor(() => expect(button).not.toBeDisabled());
  await user.click(button);
}

async function fillWhere(user: User) {
  await user.selectOptions(screen.getByLabelText('Employee'), 'person-marisol');
  await user.type(screen.getByLabelText('Date of incident'), '09/15/2026');
  await user.type(screen.getByLabelText('Where it happened'), 'Loading dock 3');
}

async function fillWhat(user: User) {
  await user.type(screen.getByLabelText('What happened'), 'A pallet shifted and pinned her hand.');
  await user.type(
    screen.getByLabelText('Description of the injury or illness'),
    'Crushed fingertip that needed sutures.',
  );
}

/** Where -> What -> Treatment -> Days: lands on the Days step. */
async function toDays(user: User) {
  await fillWhere(user);
  await next(user);
  await fillWhat(user);
  await next(user);
  await next(user);
}

/** Lands on the Recordability step. */
async function toRecordability(user: User) {
  await toDays(user);
  await next(user);
}

/** Answers the single work-related question, lands on Reporting. */
async function toReporting(user: User) {
  await toRecordability(user);
  await user.click(screen.getByLabelText('Yes'));
  await next(user);
}

async function toReview(user: User) {
  await toReporting(user);
  await next(user);
}

beforeEach(() => {
  mocks.open.mockReset();
  mocks.recordReport.mockReset();
  mocks.establishments = [
    { id: 'est-sacramento', establishmentName: 'Sacramento Distribution Center' },
  ];
  mocks.people = [{ id: 'person-marisol', firstName: 'Marisol', lastName: 'Okonkwo' }];
  mocks.rules = [WORK_RELATED_RULE, DAYS_AWAY_RULE];
  mocks.severeRules = [];
  mocks.severe = NO_TRIGGERS;
  mocks.leave = { visible: true, cases: [] };
  mocks.recommendation = RECORDABLE_RECOMMENDATION;
  mocks.open.mockResolvedValue({
    id: 'incident-91',
    referenceId: 'A7C-3-4412-9-08',
    caseNumber: 4,
    recordable: true,
    classification: 'OTHER_RECORDABLE',
    severeInjuryReports: [],
  });
  mocks.recordReport.mockResolvedValue(undefined);
});

describe('MhdSafetyIncidentWizard', () => {
  it('walks the intake, submits one exact atomic payload, and offers the completion steps', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toReview(user);
    expect(screen.getByText(/Establishment:/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0]).toEqual({
      companyId: 'company-ridgeline',
      establishmentId: 'est-sacramento',
      incident: {
        personId: 'person-marisol',
        nonEmployeeName: null,
        jobTitle: null,
        dateOfIncident: '2026-09-15',
        timeOfIncident: null,
        locationDescription: 'Loading dock 3',
        whatHappened: 'A pallet shifted and pinned her hand.',
        injuryIllnessDescription: 'Crushed fingertip that needed sutures.',
        illnessType: null,
        daysAwayCount: 0,
        daysRestrictedOrTransferredCount: 0,
        isPrivacyCase: false,
        privacyCaseReason: null,
        bodyPart: null,
        objectSubstance: null,
        activityBefore: null,
        treatmentLevel: null,
        treatedInEmergencyRoom: false,
        hospitalizedInpatient: false,
        physicianName: null,
        treatmentFacility: null,
        deathDate: null,
        employerNotifiedAt: null,
        firstDayAway: null,
        returnToWorkDate: null,
        leaveCaseId: null,
      },
      facts: { work_related: true, days_away_count: 0, days_restricted_or_transferred_count: 0 },
      decision: { recordable: true, classification: 'OTHER_RECORDABLE', overrideReason: null },
      severeDecisions: [],
    });

    expect(await screen.findByText('Incident Recorded')).toBeInTheDocument();
    expect(screen.getByText('300 log case number 4')).toBeInTheDocument();
    expect(screen.getByText('Attachments for SAFETY_INCIDENT incident-91')).toBeInTheDocument();
    expect(
      screen.getByText('Document step: OSHA_301_INCIDENT_REPORT for SAFETY_INCIDENT incident-91'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Safety Module' }));
    expect(await screen.findByText('Safety page')).toBeInTheDocument();
  });

  it('validates the establishment and person, what happened, privacy and day counts', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('Choose the employee, or name the person who was not an employee.'),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Employee'), 'person-marisol');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Enter the date of the incident.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Date of incident'), '12/31/2099');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('The date of the incident cannot be in the future.'),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Date of incident'));
    await user.type(screen.getByLabelText('Date of incident'), '09/15/2026');
    await next(user);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Describe what happened.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('What happened'), 'A fall from a step stool.');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Describe the injury or illness.')).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Description of the injury or illness'),
      'Sprained wrist.',
    );
    await next(user);

    await user.click(screen.getByLabelText('This is a privacy concern case'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('Record why this is a privacy concern case.'),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Reason'), 'MENTAL_ILLNESS');
    await next(user);

    const away = screen.getByLabelText('Days away from work');
    await user.clear(away);
    await user.type(away, '-1');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('Enter whole numbers of days that are 0 or more.'),
    ).toBeInTheDocument();
    await user.clear(away);
    await user.type(away, '181');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Counts stop at 180 days.')).toBeInTheDocument();
    await user.clear(away);
    await user.type(away, '3');
    await user.type(screen.getByLabelText('First day away'), '09/20/2026');
    await user.type(screen.getByLabelText('Return-to-work date'), '09/19/2026');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('The return-to-work date cannot be before the first day away.'),
    ).toBeInTheDocument();
  });

  it('names a person who is not an employee instead of choosing one', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await user.click(screen.getByLabelText('Someone who is not an employee'));
    expect(screen.queryByLabelText('Employee')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Dmitri Volkov');
    await user.type(screen.getByLabelText('Date of incident'), '09/15/2026');
    await next(user);
    await fillWhat(user);
    await next(user);
    await next(user);
    await next(user);
    await user.click(screen.getByLabelText('Yes'));
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0].incident).toMatchObject({
      personId: null,
      nonEmployeeName: 'Dmitri Volkov',
    });
  });

  it('builds the questions from the rules data and never asks a numeric rule', async () => {
    mocks.rules = [
      WORK_RELATED_RULE,
      {
        ruleKey: 'CONTAMINATED_SHARPS',
        kind: 'CRITERION',
        factKey: 'contaminated_sharps_injury',
        answerType: 'BOOLEAN',
        outcomeClassification: 'OTHER_RECORDABLE',
        label: 'A needlestick from a contaminated sharp',
        guidance: null,
        citation: '29 CFR 1904.8',
      },
      DAYS_AWAY_RULE,
    ];
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRecordability(user);
    expect(
      screen.getByText('The injury resulted from an event in the work environment'),
    ).toBeInTheDocument();
    expect(screen.getByText('A needlestick from a contaminated sharp')).toBeInTheDocument();
    expect(screen.getByText('29 CFR 1904.8')).toBeInTheDocument();
    expect(screen.queryByText('The employee has days away from work')).not.toBeInTheDocument();
    expect(screen.getByText('Days away from work: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Answer every recordability question.')).toBeInTheDocument();
    const yes = screen.getAllByLabelText('Yes');
    const no = screen.getAllByLabelText('No');
    await user.click(yes[0]);
    await user.click(no[1]);
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0].facts).toEqual({
      work_related: true,
      contaminated_sharps_injury: false,
      days_away_count: 0,
      days_restricted_or_transferred_count: 0,
    });
  });

  it('states a recordable recommendation with its criteria and the working-draft note', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRecordability(user);
    expect(screen.getByText(/Recommended: Recordable/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'The employee received medical treatment beyond first aid — 29 CFR 1904.7(b)(5)',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/working drafts pending legal review/)).toBeInTheDocument();
  });

  it('states a not-recordable recommendation with the failed precondition, and no draft note once approved', async () => {
    mocks.recommendation = {
      ...RECORDABLE_RECOMMENDATION,
      registryReviewStatus: 'APPROVED',
      recordable: false,
      classification: null,
      failedPreconditions: [
        {
          ruleKey: 'WORK_RELATED',
          label: 'The injury resulted from an event in the work environment',
          citation: '29 CFR 1904.5(a)',
        },
      ],
      matchedCriteria: [],
    };
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRecordability(user);
    expect(screen.getByText('Recommended: Not recordable')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The injury resulted from an event in the work environment — 29 CFR 1904.5(a)',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/working drafts pending legal review/)).not.toBeInTheDocument();
  });

  it('lists the unanswered questions while the recommendation is undetermined', async () => {
    mocks.recommendation = {
      ...RECORDABLE_RECOMMENDATION,
      recordable: null,
      classification: null,
      matchedCriteria: [],
      missingFacts: [{ ruleKey: 'NEW_CASE', factKey: 'new_case', label: 'This is a new case' }],
    };
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRecordability(user);
    expect(
      screen.getByText('Answer the remaining questions to see the recommendation.'),
    ).toBeInTheDocument();
    expect(screen.getByText('This is a new case')).toBeInTheDocument();
  });

  it('requires a reason to differ from the recommendation and sends it', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRecordability(user);
    await user.click(screen.getByLabelText('Yes'));
    await user.click(screen.getByLabelText('Not recordable'));
    expect(
      screen.getByLabelText('Why are you not following the recommendation?'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText(
        'Record why you are not following the recommendation (at least 10 characters).',
      ),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Why are you not following the recommendation?'),
      'short',
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText(
        'Record why you are not following the recommendation (at least 10 characters).',
      ),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Why are you not following the recommendation?'),
      ' - the physician confirmed first aid only',
    );
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0].decision).toEqual({
      recordable: false,
      classification: null,
      overrideReason: 'short - the physician confirmed first aid only',
    });
  });

  it('treats a different classification as an override and a matching one as following', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRecordability(user);
    await user.click(screen.getByLabelText('Yes'));
    await user.selectOptions(
      screen.getByLabelText('Classification'),
      'JOB_TRANSFER_OR_RESTRICTION',
    );
    expect(
      screen.getByLabelText('Why are you not following the recommendation?'),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Classification'), 'OTHER_RECORDABLE');
    expect(
      screen.queryByLabelText('Why are you not following the recommendation?'),
    ).not.toBeInTheDocument();
  });

  it('offers the employee leaves as day suggestions and links the one used', async () => {
    mocks.leave = {
      visible: true,
      cases: [
        {
          id: 'leave-44',
          referenceId: 'B2D-4-1180-6-33',
          status: 'COMPLETED',
          startDate: '2026-09-16',
          endDate: '2026-10-04',
          suggestedCalendarDays: 19,
        },
      ],
    };
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toDays(user);
    await user.click(screen.getByRole('button', { name: 'Use 19 Days' }));
    expect(screen.getByLabelText('Days away from work')).toHaveValue(19);
    expect(screen.getByLabelText('First day away')).toHaveValue('09/16/2026');
    expect(screen.getByLabelText('Return-to-work date')).toHaveValue('10/05/2026');
    await next(user);
    await user.click(screen.getByLabelText('Yes'));
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0].incident).toMatchObject({
      daysAwayCount: 19,
      firstDayAway: '2026-09-16',
      returnToWorkDate: '2026-10-05',
      leaveCaseId: 'leave-44',
    });
    expect(mocks.open.mock.calls[0][0].facts.days_away_count).toBe(19);
  });

  it('tells a role that cannot see leaves to enter the days by hand', async () => {
    mocks.leave = { visible: false, cases: [] };
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toDays(user);
    expect(
      screen.getByText('Leave records are not available to your role. Enter the days by hand.'),
    ).toBeInTheDocument();
  });

  it('asks the severe-injury questions, shows the deadline and requires a decision per trigger', async () => {
    mocks.severeRules = [AMPUTATION_RULE];
    mocks.severe = {
      jurisdiction: 'CALIFORNIA',
      triggers: [
        {
          triggerKind: 'AMPUTATION',
          label: 'An amputation',
          guidance: 'A serious injury under Cal/OSHA.',
          citation: 'Cal. Labor Code 6302(h), 6409.1(b)',
          deadlineHours: 8,
          deadlineAt: '2026-10-02T02:00:00Z',
        },
      ],
      earliestDeadlineAt: '2026-10-02T02:00:00Z',
      needsNotifiedTime: false,
    };
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toReporting(user);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Answer every severe-injury question.')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Yes'));
    const alert = (await screen.findByText(/report to Cal\/OSHA within 8 hours/)).closest(
      '[role="alert"]',
    );
    expect(alert).not.toBeNull();
    expect(alert).toHaveTextContent('report to Cal/OSHA within 8 hours');
    expect(alert).toHaveTextContent('Cal. Labor Code 6302(h), 6409.1(b)');
    expect(alert).toHaveTextContent(/Due by/);
    expect(screen.getByLabelText('A report is required')).toBeChecked();

    await user.click(screen.getByLabelText('A report is not required'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText(
        'Record why a report is not required for: An amputation (at least 10 characters).',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByLabelText('A report is required'));
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0].severeDecisions).toEqual([
      { triggerKind: 'AMPUTATION', decision: 'REPORT_REQUIRED', reason: null },
    ]);
    expect(mocks.open.mock.calls[0][0].facts).toMatchObject({ amputation: true });
    expect(mocks.open.mock.calls[0][0].incident.hospitalizedInpatient).toBe(false);
  });

  it('sends the reason when a report is decided not required', async () => {
    mocks.severeRules = [AMPUTATION_RULE];
    mocks.severe = {
      jurisdiction: 'FEDERAL',
      triggers: [
        {
          triggerKind: 'AMPUTATION',
          label: 'An amputation',
          guidance: null,
          citation: '29 CFR 1904.39(a)(2)',
          deadlineHours: 24,
          deadlineAt: null,
        },
      ],
      earliestDeadlineAt: null,
      needsNotifiedTime: true,
    };
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toReporting(user);
    await user.click(screen.getByLabelText('Yes'));
    expect(
      await screen.findByText(
        'Enter when the company learned of it so the deadline can be calculated.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/report to OSHA within 24 hours/).closest('[role="alert"]'),
    ).not.toBeNull();
    await user.click(screen.getByLabelText('A report is not required'));
    await user.type(
      screen.getByLabelText('Why a report is not required'),
      'The tip was a prosthetic and not a body part.',
    );
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0].severeDecisions).toEqual([
      {
        triggerKind: 'AMPUTATION',
        decision: 'NOT_REQUIRED',
        reason: 'The tip was a prosthetic and not a body part.',
      },
    ]);
  });

  it('sends the time the company learned of the event as an ISO timestamp', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await user.selectOptions(screen.getByLabelText('Employee'), 'person-marisol');
    await user.type(screen.getByLabelText('Date of incident'), '09/15/2026');
    await next(user);
    await fillWhat(user);
    fireEvent.change(screen.getByLabelText(/When the company learned of it/), {
      target: { value: '2026-09-15T14:30' },
    });
    await next(user);
    await next(user);
    await next(user);
    await user.click(screen.getByLabelText('Yes'));
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    expect(mocks.open.mock.calls[0][0].incident.employerNotifiedAt).toBe(
      new Date('2026-09-15T14:30').toISOString(),
    );
  });

  it('shows a server refusal on review and succeeds on retry', async () => {
    mocks.open
      .mockRejectedValueOnce(
        new Error('Record why you are not following the recommendation (at least 10 characters)'),
      )
      .mockResolvedValueOnce({
        id: 'incident-92',
        referenceId: 'C9E-1-2200-4-17',
        caseNumber: null,
        recordable: false,
        classification: null,
        severeInjuryReports: [],
      });
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toReview(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Record why you are not following the recommendation',
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Not recordable — no 300 log entry')).toBeInTheDocument();
  });

  describe('after the incident is recorded', () => {
    beforeEach(() => {
      mocks.open.mockResolvedValue({
        id: 'incident-93',
        referenceId: 'D1F-2-3300-5-26',
        caseNumber: 5,
        recordable: true,
        classification: 'DAYS_AWAY_FROM_WORK',
        severeInjuryReports: [
          {
            id: 'report-7',
            triggerKind: 'INPATIENT_HOSPITALIZATION',
            decision: 'REPORT_REQUIRED',
            deadlineAt: '2026-10-02T02:00:00Z',
          },
        ],
      });
    });

    async function recorded(user: User) {
      renderWizard();
      await toReview(user);
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      await screen.findByText('Incident Recorded');
    }

    it('records the report that was made, with its method and agency reference', async () => {
      const user = userEvent.setup({ delay: null });
      await recorded(user);
      expect(screen.getByText('Inpatient Hospitalization')).toBeInTheDocument();
      const button = screen.getByRole('button', { name: 'Record The Report' });
      expect(button).toBeDisabled();
      fireEvent.change(screen.getByLabelText('When the report was made'), {
        target: { value: '2026-10-01T20:00' },
      });
      await user.selectOptions(screen.getByLabelText('Method'), 'ONLINE');
      await user.type(screen.getByLabelText('Agency reference'), 'CA-2026-04417');
      await user.click(screen.getByRole('button', { name: 'Record The Report' }));
      await waitFor(() => expect(mocks.recordReport).toHaveBeenCalledTimes(1));
      expect(mocks.recordReport).toHaveBeenCalledWith({
        reportId: 'report-7',
        reportedAt: new Date('2026-10-01T20:00').toISOString(),
        method: 'ONLINE',
        agencyReference: 'CA-2026-04417',
      });
      const status = await screen.findByText('The report was recorded.');
      expect(status).toHaveAttribute('role', 'status');
      expect(screen.queryByRole('button', { name: 'Record The Report' })).not.toBeInTheDocument();
    });

    it('shows a refused report and keeps the form', async () => {
      mocks.recordReport.mockRejectedValueOnce(
        new Error('The report time cannot be in the future'),
      );
      const user = userEvent.setup({ delay: null });
      await recorded(user);
      fireEvent.change(screen.getByLabelText('When the report was made'), {
        target: { value: '2026-10-01T20:00' },
      });
      await user.click(screen.getByRole('button', { name: 'Record The Report' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The report time cannot be in the future',
      );
      expect(screen.getByRole('button', { name: 'Record The Report' })).toBeInTheDocument();
    });
  });

  it('points to the Workplace Safety page when there is no establishment', () => {
    mocks.establishments = [];
    renderWizard();
    expect(
      screen.getByText(/Add an establishment on the Workplace Safety page first\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Workplace Safety' })).toHaveAttribute(
      'href',
      '/safety',
    );
  });
});
