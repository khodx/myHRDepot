import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MhdPerformanceCycleWizard from '../Components/MhdPerformanceCycleWizard';

const state = vi.hoisted(() => ({
  launch: vi.fn(),
  candidateInputs: [] as unknown[],
  raterInputs: [] as unknown[],
}));

const candidates = [
  {
    personId: 'manager-1',
    displayName: 'Morgan Manager',
    jobTitle: 'Director',
    managerPersonId: null,
    managerName: null,
    depth: 0,
    reviewerUserId: 'user-morgan',
    reviewerName: 'Morgan Manager',
    hasPublishedJob: true,
    competencyCount: 3,
    conflictingReviewReference: null,
  },
  {
    personId: 'person-1',
    displayName: 'Alex One',
    jobTitle: 'Analyst',
    managerPersonId: 'manager-1',
    managerName: 'Morgan Manager',
    depth: 1,
    reviewerUserId: 'user-morgan',
    reviewerName: 'Morgan Manager',
    hasPublishedJob: true,
    competencyCount: 2,
    conflictingReviewReference: null,
  },
  {
    personId: 'person-2',
    displayName: 'Blair Two',
    jobTitle: 'Analyst',
    managerPersonId: 'manager-1',
    managerName: 'Morgan Manager',
    depth: 1,
    reviewerUserId: 'user-morgan',
    reviewerName: 'Morgan Manager',
    hasPublishedJob: true,
    competencyCount: 1,
    conflictingReviewReference: 'PRCY-12',
  },
  {
    personId: 'person-3',
    displayName: 'Casey Three',
    jobTitle: 'Specialist',
    managerPersonId: 'manager-1',
    managerName: 'Morgan Manager',
    depth: 1,
    reviewerUserId: null,
    reviewerName: null,
    hasPublishedJob: false,
    competencyCount: 0,
    conflictingReviewReference: null,
  },
  {
    personId: 'person-4',
    displayName: 'Drew Four',
    jobTitle: 'Specialist',
    managerPersonId: 'manager-1',
    managerName: 'Morgan Manager',
    depth: 1,
    reviewerUserId: 'user-morgan',
    reviewerName: 'Morgan Manager',
    hasPublishedJob: true,
    competencyCount: 2,
    conflictingReviewReference: null,
  },
  {
    personId: 'person-5',
    displayName: 'Emery Five',
    jobTitle: 'Coordinator',
    managerPersonId: 'manager-1',
    managerName: 'Morgan Manager',
    depth: 1,
    reviewerUserId: 'user-morgan',
    reviewerName: 'Morgan Manager',
    hasPublishedJob: true,
    competencyCount: 4,
    conflictingReviewReference: null,
  },
];

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));
vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: { templateKey: string; entityType: string; entityId: string }) => (
    <p>
      Document step: {props.templateKey} for {props.entityType} {props.entityId}
    </p>
  ),
}));
vi.mock('../Hook', () => ({
  useMhdPerformanceUsers: () => ({
    data: [
      { id: 'user-morgan', displayName: 'Morgan Manager' },
      { id: 'user-reviewer', displayName: 'Riley Reviewer' },
    ],
  }),
}));
vi.mock('../Hook-v2', () => ({
  useMhdReviewTemplates: () => ({
    data: [
      { id: 'template-draft', templateName: 'Draft', status: 'DRAFT' },
      { id: 'template-published', templateName: 'Published Template', status: 'PUBLISHED' },
    ],
  }),
  useMhdFeedbackThreshold: () => ({ data: 3 }),
}));
vi.mock('@/features/jobs/Hook', () => ({
  useMhdCompetencies: () => ({
    data: [
      { id: 'competency-1', competencyName: 'Communication', category: 'Core' },
      { id: 'competency-2', competencyName: 'Planning', category: 'Role' },
    ],
  }),
}));
vi.mock('../Hook-cycles', () => ({
  useMhdPerformanceCycleCandidates: (input: unknown) => {
    state.candidateInputs.push(input);
    return { data: candidates };
  },
  useMhdPerformanceCycleRaterPlan: (input: unknown) => {
    state.raterInputs.push(input);
    return {
      data: input
        ? [
            {
              subjectPersonId: 'person-1',
              raterPersonId: 'person-4',
              raterName: 'Drew Four',
              participantType: 'PEER',
            },
            {
              subjectPersonId: 'person-1',
              raterPersonId: 'person-5',
              raterName: 'Emery Five',
              participantType: 'UPWARD',
            },
          ]
        : undefined,
    };
  },
  useMhdLaunchPerformanceCycle: () => ({ mutateAsync: state.launch, isPending: false }),
}));

const output = { id: 'cycle-1', referenceId: 'PRCY-1', reviewCount: 5, participantCount: 7 };

type User = ReturnType<typeof userEvent.setup>;

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/performance/cycles/new']}>
      <Routes>
        <Route path="/performance/cycles/new" element={<MhdPerformanceCycleWizard />} />
        <Route path="/performance/cycles" element={<p>Cycles page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function next(user: User) {
  const button = screen.getByRole('button', { name: 'Next' });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
}

async function fillCycle(user: User) {
  await user.type(screen.getByLabelText('Cycle name'), 'Annual 2026');
  await user.type(screen.getByLabelText('Review period start'), '01/01/2026');
  await user.type(screen.getByLabelText('Review period end'), '12/31/2026');
  await user.type(screen.getByLabelText('Reviews due'), '01/15/2027');
}

/** Cycle -> Template -> People. */
async function toPeople(user: User) {
  await fillCycle(user);
  await next(user);
  await next(user);
}

/** People step with every reviewer chosen; lands on Raters. */
async function toRaters(user: User) {
  await toPeople(user);
  await user.selectOptions(screen.getByLabelText('Reviewer for Casey Three'), 'user-reviewer');
  await next(user);
}

beforeEach(() => {
  state.launch.mockReset().mockResolvedValue(output);
  state.candidateInputs = [];
  state.raterInputs = [];
});

describe('MhdPerformanceCycleWizard', () => {
  it('walks the 360-off flow, launches once with the exact input, and offers the completion steps', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRaters(user);
    expect(screen.getByText('360 feedback is off for this cycle.')).toBeInTheDocument();
    await next(user);
    expect(screen.getByText(/People:/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Cycle Launched')).toBeInTheDocument();
    expect(state.launch).toHaveBeenCalledTimes(1);
    expect(state.launch.mock.calls[0][0]).toEqual({
      companyId: 'company-1',
      cycleName: 'Annual 2026',
      reviewType: 'ANNUAL',
      reviewPeriodStart: '2026-01-01',
      reviewPeriodEnd: '2026-12-31',
      selfAssessmentDue: null,
      feedbackDue: null,
      reviewDue: '2027-01-15',
      templateId: null,
      includesSelfAssessment: true,
      isMultiRater: false,
      announcementNote: null,
      participants: [
        { personId: 'manager-1', reviewerUserId: 'user-morgan', raters: [] },
        { personId: 'person-1', reviewerUserId: 'user-morgan', raters: [] },
        { personId: 'person-3', reviewerUserId: 'user-reviewer', raters: [] },
        { personId: 'person-4', reviewerUserId: 'user-morgan', raters: [] },
        { personId: 'person-5', reviewerUserId: 'user-morgan', raters: [] },
      ],
      competencyIds: [],
    });
    expect(screen.getByText('5 reviews created and 7 invitations sent.')).toBeInTheDocument();
    expect(
      screen.getByText('Document step: REVIEW_CYCLE_ANNOUNCEMENT for PERFORMANCE_CYCLE cycle-1'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Cycles' }));
    expect(await screen.findByText('Cycles page')).toBeInTheDocument();
  });

  it('defaults the type to Annual and offers all four review types', () => {
    renderWizard();
    expect(screen.getByLabelText('Review type')).toHaveValue('ANNUAL');
    for (const label of ['Introductory', 'Annual', 'Quarterly', 'Probationary']) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
  });

  it('shows each cycle validation in turn', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Name the cycle.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Cycle name'), 'Probation Check');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Enter the review period.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Review period start'), '12/31/2026');
    await user.type(screen.getByLabelText('Review period end'), '01/01/2026');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('The review period must end on or after it starts.'),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Review period start'));
    await user.type(screen.getByLabelText('Review period start'), '01/01/2026');
    await user.clear(screen.getByLabelText('Review period end'));
    await user.type(screen.getByLabelText('Review period end'), '12/31/2026');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Enter the date the reviews are due.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Reviews due'), '06/01/2026');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('The reviews must be due on or after the end of the review period.'),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Reviews due'));
    await user.type(screen.getByLabelText('Reviews due'), '01/15/2027');
    await user.type(screen.getByLabelText(/^Self-assessment due/), '02/01/2027');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('The self-assessment cannot be due after the reviews.'),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^Self-assessment due/));
    await user.type(screen.getByLabelText(/^Feedback due/), '02/01/2027');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('Feedback cannot be due after the reviews.'),
    ).toBeInTheDocument();
  });

  it('sends the optional dates, the self-assessment choice and the announcement note', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await fillCycle(user);
    await user.type(screen.getByLabelText(/^Self-assessment due/), '12/01/2026');
    await user.type(screen.getByLabelText(/^Feedback due/), '12/15/2026');
    await user.click(screen.getByLabelText('Each person completes a self-assessment'));
    await user.type(screen.getByLabelText(/Announcement note/), 'Thank you for a strong year.');
    await next(user);
    await next(user);
    await user.selectOptions(screen.getByLabelText('Reviewer for Casey Three'), 'user-reviewer');
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.launch).toHaveBeenCalledTimes(1));
    expect(state.launch.mock.calls[0][0]).toMatchObject({
      selfAssessmentDue: '2026-12-01',
      feedbackDue: '2026-12-15',
      includesSelfAssessment: false,
      announcementNote: 'Thank you for a strong year.',
    });
  });

  it('offers only published templates and sends the template and the ticked competencies', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await fillCycle(user);
    await next(user);
    expect(screen.getByRole('option', { name: 'Published Template' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Draft' })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Template'), 'template-published');
    await user.click(screen.getByLabelText(/Planning/));
    await next(user);
    await user.selectOptions(screen.getByLabelText('Reviewer for Casey Three'), 'user-reviewer');
    await next(user);
    await next(user);
    expect(screen.getByText(/Published Template/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.launch).toHaveBeenCalledTimes(1));
    expect(state.launch.mock.calls[0][0]).toMatchObject({
      templateId: 'template-published',
      competencyIds: ['competency-2'],
    });
  });

  it('ticks everyone except the conflicting review, and supports Clear, Select All and one exclusion', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toPeople(user);
    expect(screen.getByText('5 people chosen')).toBeInTheDocument();
    expect(screen.getByText('Already covered by PRCY-12')).toBeInTheDocument();
    expect(screen.getByLabelText('Choose Blair Two')).toBeDisabled();
    expect(screen.getByLabelText('Choose Blair Two')).not.toBeChecked();
    expect(screen.getByText('No published job description')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('0 people chosen')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Choose at least one person to review.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select All' }));
    expect(screen.getByText('5 people chosen')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Choose Alex One'));
    expect(screen.getByText('4 people chosen')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Reviewer for Casey Three'), 'user-reviewer');
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.launch).toHaveBeenCalledTimes(1));
    const ids = state.launch.mock.calls[0][0].participants.map(
      (participant: { personId: string }) => participant.personId,
    );
    expect(ids).toEqual(['manager-1', 'person-3', 'person-4', 'person-5']);
  });

  it('requires a reviewer for a person the hierarchy cannot supply and sends an override', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toPeople(user);
    expect(screen.getByLabelText('Reviewer for Alex One')).toHaveValue('user-morgan');
    expect(screen.getByLabelText('Reviewer for Casey Three')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Choose a reviewer for Casey Three.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Reviewer for Casey Three'), 'user-reviewer');
    await user.selectOptions(screen.getByLabelText('Reviewer for Alex One'), 'user-reviewer');
    await next(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.launch).toHaveBeenCalledTimes(1));
    const participants = state.launch.mock.calls[0][0].participants as Array<{
      personId: string;
      reviewerUserId: string;
    }>;
    expect(participants.find((item) => item.personId === 'person-1')?.reviewerUserId).toBe(
      'user-reviewer',
    );
  });

  it('passes the manager scope and the review window to the candidate query and clears exclusions', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toPeople(user);
    expect(state.candidateInputs.at(-1)).toMatchObject({
      companyId: 'company-1',
      rootPersonId: null,
      reviewType: 'ANNUAL',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });
    await user.click(screen.getByLabelText('Choose Alex One'));
    expect(screen.getByText('4 people chosen')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Who'), 'manager');
    expect(screen.getByText('5 people chosen')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Manager'), 'manager-1');
    await user.click(screen.getByLabelText('Include everyone below them'));
    await waitFor(() =>
      expect(state.candidateInputs.at(-1)).toMatchObject({
        rootPersonId: 'manager-1',
        includeIndirect: false,
      }),
    );
  });

  it('suggests raters for a 360 cycle, passes the maximums, warns below the threshold and removes one', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await fillCycle(user);
    await user.click(screen.getByLabelText('Collect 360 feedback from peers and direct reports'));
    await next(user);
    await next(user);
    await user.selectOptions(screen.getByLabelText('Reviewer for Casey Three'), 'user-reviewer');
    await next(user);
    expect(screen.queryByText('360 feedback is off for this cycle.')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Ask peers (people with the same manager)'));
    await user.click(screen.getByLabelText('Ask direct reports to give upward feedback'));
    const maximums = screen.getAllByLabelText('Most per person');
    await user.clear(maximums[0]);
    await user.type(maximums[0], '7');
    await waitFor(() =>
      expect(state.raterInputs.at(-1)).toMatchObject({
        companyId: 'company-1',
        includePeers: true,
        maxPeers: 7,
        includeUpward: true,
        maxUpward: 5,
      }),
    );
    expect(screen.getByText('Alex One')).toBeInTheDocument();
    expect(screen.getByText(/Drew Four/)).toBeInTheDocument();
    expect(screen.getByText('2 raters suggested')).toBeInTheDocument();
    expect(screen.getByText(/Alex One: fewer than 3 raters of one kind/)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(screen.getByText('1 raters suggested')).toBeInTheDocument();
    await next(user);
    expect(screen.getByText(/360 feedback:/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.launch).toHaveBeenCalledTimes(1));
    const launched = state.launch.mock.calls[0][0];
    expect(launched.isMultiRater).toBe(true);
    const alex = launched.participants.find(
      (participant: { personId: string }) => participant.personId === 'person-1',
    );
    expect(alex.raters).toEqual([{ personId: 'person-5', participantType: 'UPWARD' }]);
  });

  it('shows a server refusal on launch and succeeds on retry', async () => {
    state.launch.mockRejectedValueOnce(new Error('Launch refused.')).mockResolvedValueOnce(output);
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await toRaters(user);
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Launch refused.');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Cycle Launched')).toBeInTheDocument();
    expect(state.launch).toHaveBeenCalledTimes(2);
  });
});
