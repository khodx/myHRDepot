import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  createCase: vi.fn(),
  createAction: vi.fn(),
  updateAction: vi.fn(),
  issue: vi.fn(),
  recommendation: null as Record<string, unknown> | null,
  recommendationError: null as Error | null,
  recommendationLoading: false,
  context: null as Record<string, string> | null,
  cases: [] as Array<{ id: string; referenceId: string; category: string }>,
  ceremonySteps: [] as Array<{ key: string; label: string; status: string }>,
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { companyId: 'company-1', userId: 'user-1' },
    roles: ['HR Admin'],
  }),
}));

vi.mock('@/utils/useMhdModuleComplianceReadiness', () => ({
  useMhdModuleComplianceReadiness: () => ({ data: null }),
}));

vi.mock('../Hook', () => ({
  useMhdConductPeople: () => ({
    data: [
      { id: 'person-1', firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor' },
      { id: 'person-2', firstName: 'Jonah', lastName: 'Sato', displayName: 'Jonah Sato' },
    ],
  }),
  useMhdConductCases: () => ({ data: state.cases }),
  useMhdConductPersonContext: () => ({ data: state.context }),
  useMhdConductPersonHistory: () => ({
    data: [
      {
        source: 'CONDUCT_ACTION',
        referenceId: 'CACT-1007',
        occurredAt: '2026-03-02T10:00:00Z',
        category: 'CONDUCT',
        severity: 'VERBAL_WARNING',
        status: 'ACKNOWLEDGED',
        summary: 'Late to three scheduled shifts.',
      },
    ],
    isLoading: false,
    isError: false,
  }),
  useMhdConductSeverityRecommendation: () => ({
    data:
      state.recommendationError || state.recommendationLoading ? undefined : state.recommendation,
    isLoading: state.recommendationLoading,
    isError: Boolean(state.recommendationError),
    error: state.recommendationError,
  }),
  useMhdConductActionsMutations: () => ({
    createCase: { mutateAsync: state.createCase },
    createAction: { mutateAsync: state.createAction },
    updateAction: { mutateAsync: state.updateAction },
  }),
  useMhdConductActionCeremony: () => ({ steps: state.ceremonySteps, issue: state.issue }),
}));

const { MhdConductIntakeWizard } = await import('../components/MhdConductIntakeWizard');

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/conduct/new']}>
      <Routes>
        <Route path="/conduct/new" element={<MhdConductIntakeWizard />} />
        <Route path="/conduct/:caseId" element={<p>Case opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function chooseEmployee() {
  fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'person-1' } });
}

function advance() {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

async function advanceAndSettle() {
  const next = screen.getByRole('button', { name: 'Next' });
  await waitFor(() => expect(next).toBeEnabled());
  fireEvent.click(next);
}

function fillIncident(narrative = 'The scheduling rule was not followed.') {
  fireEvent.change(screen.getByLabelText('Incident narrative'), { target: { value: narrative } });
}

function fillExpectations(summary = 'Written warning and retraining.') {
  fireEvent.change(screen.getByLabelText('Summary of the action'), { target: { value: summary } });
  fireEvent.change(screen.getByLabelText('Expectations'), {
    target: { value: 'Follow the published scheduling procedure.' },
  });
}

/** Employee -> Incident -> Severity (recommended rung kept) -> Expectations -> Review. */
function walkToReview() {
  chooseEmployee();
  advance();
  fillIncident();
  advance();
  advance();
  fillExpectations();
  advance();
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));
}

beforeEach(() => {
  state.createCase.mockReset().mockResolvedValue({ id: 'case-new', reference_id: 'COND-1042' });
  state.createAction.mockReset().mockResolvedValue({ id: 'action-new', reference_id: 'CACT-1042' });
  state.updateAction.mockReset().mockResolvedValue(undefined);
  state.issue.mockReset().mockResolvedValue({
    actionId: 'action-new',
    documentGenerationId: 'generation-1',
    esignatureRequestId: 'signature-1',
    documentHash: 'hash',
    invitationErrors: [],
  });
  state.recommendation = {
    recommendedSeverity: 'WRITTEN_WARNING',
    ladder: ['VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING'],
    lookbackMonths: 12,
    ruleId: 'rule-conduct-1',
    ruleScope: 'PLATFORM',
    exhausted: false,
    priorActions: [
      {
        referenceId: 'CACT-1007',
        severity: 'VERBAL_WARNING',
        status: 'ACKNOWLEDGED',
        issuedAt: '2026-03-02T10:00:00Z',
      },
    ],
    note: 'A recommendation from earlier issued actions in this category. A person confirms or overrides it.',
  };
  state.recommendationError = null;
  state.recommendationLoading = false;
  state.context = {
    companyName: 'Northstar Health',
    positionTitle: 'Scheduling Coordinator',
    department: 'Patient Access',
    supervisorName: 'Elena Marquez',
    facilityLocation: 'Oak Building',
    dateOfHire: '2022-03-14',
  };
  state.cases = [];
  state.ceremonySteps = [];
});

describe('MhdConductIntakeWizard', () => {
  it('walks every step, writes once, issues, and opens the case', async () => {
    renderWizard();
    walkToReview();
    submit();

    expect(await screen.findByText('Corrective Action Issued')).toBeInTheDocument();
    expect(state.createCase).toHaveBeenCalledTimes(1);
    expect(state.createAction).toHaveBeenCalledTimes(1);
    expect(state.issue).toHaveBeenCalledTimes(1);
    expect(state.createCase.mock.invocationCallOrder[0]).toBeLessThan(
      state.createAction.mock.invocationCallOrder[0],
    );
    expect(state.createAction.mock.invocationCallOrder[0]).toBeLessThan(
      state.issue.mock.invocationCallOrder[0],
    );

    const created = state.createAction.mock.calls[0][0];
    expect(created).toMatchObject({
      caseId: 'case-new',
      severity: 'WRITTEN_WARNING',
      requiresDocument: true,
    });
    expect(created.documentPayload).toMatchObject({
      companyName: 'Northstar Health',
      positionTitle: 'Scheduling Coordinator',
      supervisorName: 'Elena Marquez',
      incidentNarrative: 'The scheduling rule was not followed.',
      expectations: 'Follow the published scheduling procedure.',
      severityRecommendation: {
        recommended: 'WRITTEN_WARNING',
        chosen: 'WRITTEN_WARNING',
        overrideReason: null,
        ruleId: 'rule-conduct-1',
      },
    });
    expect(state.issue.mock.calls[0][0]).toMatchObject({
      actionId: 'action-new',
      caseId: 'case-new',
      caseReferenceId: 'COND-1042',
      personId: 'person-1',
      severity: 'WRITTEN_WARNING',
      actorUserId: 'user-1',
    });
    expect(screen.getByText(/signature request was sent/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Case' }));
    expect(await screen.findByText('Case opened')).toBeInTheDocument();
  });

  it('blocks each step until its required answers are given', () => {
    renderWizard();
    advance();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an employee.');

    chooseEmployee();
    advance();
    advance();
    expect(screen.getByRole('alert')).toHaveTextContent('Describe what happened.');

    fillIncident();
    advance();
    advance();
    advance();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Summarize the action in a sentence or two.',
    );

    fireEvent.change(screen.getByLabelText('Summary of the action'), {
      target: { value: 'Written warning.' },
    });
    advance();
    expect(screen.getByRole('alert')).toHaveTextContent('State what is expected going forward.');
  });

  it('prefills the notice context from the server and sends what was overtyped', async () => {
    renderWizard();
    chooseEmployee();
    expect(screen.getByLabelText('Position title')).toHaveValue('Scheduling Coordinator');
    expect(screen.getByLabelText('Supervisor')).toHaveValue('Elena Marquez');
    fireEvent.change(screen.getByLabelText('Company name'), {
      target: { value: 'Northstar Health West' },
    });
    advance();
    fillIncident();
    advance();
    advance();
    fillExpectations();
    advance();
    submit();
    await screen.findByText('Corrective Action Issued');
    expect(state.createAction.mock.calls[0][0].documentPayload.companyName).toBe(
      'Northstar Health West',
    );
    expect(state.createAction.mock.calls[0][0].documentPayload.positionTitle).toBe(
      'Scheduling Coordinator',
    );
  });

  it('adds the action to an existing open case instead of opening a new one', async () => {
    state.cases = [{ id: 'case-existing', referenceId: 'COND-2048', category: 'CONDUCT' }];
    renderWizard();
    chooseEmployee();
    fireEvent.change(screen.getByLabelText('Add to an open case'), {
      target: { value: 'case-existing' },
    });
    advance();
    fillIncident();
    advance();
    advance();
    fillExpectations();
    advance();
    submit();
    await screen.findByText('Corrective Action Issued');
    expect(state.createCase).not.toHaveBeenCalled();
    expect(state.createAction.mock.calls[0][0].caseId).toBe('case-existing');
  });

  it('shows the recommendation, the ladder and the prior history it counted', () => {
    renderWizard();
    chooseEmployee();
    advance();
    expect(screen.getByText('Prior history')).toBeInTheDocument();
    expect(screen.getAllByText(/CACT-1007/).length).toBeGreaterThan(0);
    expect(
      (screen.getByLabelText('Prior corrective action summary') as HTMLTextAreaElement).value,
    ).toContain('CACT-1007');
    fillIncident();
    advance();
    expect(screen.getByText(/Recommended rung:/)).toHaveTextContent('Written Warning');
    expect(screen.getByText(/Ladder:/)).toHaveTextContent(
      'Verbal Warning → Written Warning → Final Written Warning',
    );
    expect(screen.getByText(/within 12 months/)).toBeInTheDocument();
    expect(screen.getByLabelText('Severity')).toHaveValue('WRITTEN_WARNING');
  });

  it('requires a reason to depart from the recommendation, and records it with the choice', async () => {
    renderWizard();
    chooseEmployee();
    advance();
    fillIncident();
    advance();
    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'FINAL_WARNING' } });
    advance();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Explain why this differs from the recommendation.',
    );

    fireEvent.change(screen.getByLabelText('Why this differs from the recommendation'), {
      target: { value: 'A safety rule was broken after a documented coaching.' },
    });
    advance();
    fillExpectations('Final written warning.');
    advance();
    submit();
    await screen.findByText('Corrective Action Issued');
    expect(state.createAction.mock.calls[0][0].documentPayload.severityRecommendation).toEqual({
      recommended: 'WRITTEN_WARNING',
      chosen: 'FINAL_WARNING',
      overrideReason: 'A safety rule was broken after a documented coaching.',
      ruleId: 'rule-conduct-1',
    });
  });

  it('lets a person choose a rung when the recommendation is unavailable, and records no recommendation', async () => {
    state.recommendationError = new Error('Recommendation unavailable.');
    renderWizard();
    chooseEmployee();
    advance();
    fillIncident();
    advance();
    expect(screen.getByText(/Recommendation unavailable/)).toBeInTheDocument();
    advance();
    expect(
      screen
        .getAllByRole('alert')
        .map((node) => node.textContent)
        .join(' '),
    ).toContain('Choose a severity.');

    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'VERBAL_WARNING' } });
    advance();
    fillExpectations('Verbal warning.');
    advance();
    submit();
    await screen.findByText('Corrective Action Issued');
    expect(state.createAction.mock.calls[0][0].documentPayload).not.toHaveProperty(
      'severityRecommendation',
    );
    expect(state.createAction.mock.calls[0][0].severity).toBe('VERBAL_WARNING');
  });

  it('will not let a rung be assumed while the recommendation is still loading', () => {
    state.recommendationLoading = true;
    renderWizard();
    chooseEmployee();
    advance();
    fillIncident();
    advance();
    advance();
    expect(screen.getByRole('alert')).toHaveTextContent('Wait for the recommendation to load.');
  });

  it('says plainly when the ladder is exhausted instead of recommending a further step', () => {
    state.recommendation = {
      ...(state.recommendation as Record<string, unknown>),
      recommendedSeverity: 'FINAL_WARNING',
      exhausted: true,
      note: 'The final rung has already been reached inside the lookback window. Review the matter with HR and counsel.',
    };
    renderWizard();
    chooseEmployee();
    advance();
    fillIncident();
    advance();
    expect(screen.getByRole('status')).toHaveTextContent(/final rung has already been reached/i);
  });

  it('saves a draft without issuing, then opens the case', async () => {
    renderWizard();
    walkToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Save As Draft' }));
    expect(await screen.findByText('Case opened')).toBeInTheDocument();
    expect(state.createCase).toHaveBeenCalledTimes(1);
    expect(state.createAction).toHaveBeenCalledTimes(1);
    expect(state.issue).not.toHaveBeenCalled();
  });

  it('shows why an issue failed and, on retry, never opens a second case or action', async () => {
    state.issue
      .mockRejectedValueOnce(
        new Error('Corrective action step 3: the document is still rendering.'),
      )
      .mockResolvedValue({
        actionId: 'action-new',
        documentGenerationId: 'g',
        esignatureRequestId: 'sig',
        documentHash: 'h',
        invitationErrors: [],
      });
    renderWizard();
    walkToReview();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('the document is still rendering');
    expect(screen.queryByText('Corrective Action Issued')).not.toBeInTheDocument();

    submit();
    expect(await screen.findByText('Corrective Action Issued')).toBeInTheDocument();
    expect(state.createCase).toHaveBeenCalledTimes(1);
    expect(state.createAction).toHaveBeenCalledTimes(1);
    expect(state.issue).toHaveBeenCalledTimes(2);
  });

  it('carries an edited answer onto the action already created by a failed attempt', async () => {
    state.issue.mockRejectedValueOnce(new Error('Service unavailable.')).mockResolvedValue({
      actionId: 'action-new',
      documentGenerationId: 'g',
      esignatureRequestId: 'sig',
      documentHash: 'h',
      invitationErrors: [],
    });
    renderWizard();
    walkToReview();
    submit();
    await screen.findByRole('alert');

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fillIncident('The scheduling rule was not followed on two shifts.');
    await advanceAndSettle();
    advance();
    advance();
    submit();

    expect(await screen.findByText('Corrective Action Issued')).toBeInTheDocument();
    expect(state.createAction).toHaveBeenCalledTimes(1);
    expect(state.updateAction).toHaveBeenCalledTimes(1);
    expect(state.updateAction.mock.calls[0][0]).toMatchObject({ actionId: 'action-new' });
    expect(state.updateAction.mock.calls[0][0].input.documentPayload.incidentNarrative).toBe(
      'The scheduling rule was not followed on two shifts.',
    );
  });

  it('reports invitation problems on the completion panel', async () => {
    state.issue.mockResolvedValue({
      actionId: 'action-new',
      documentGenerationId: 'g',
      esignatureRequestId: 'sig',
      documentHash: 'h',
      invitationErrors: ['The invitation email to the employee bounced.'],
    });
    renderWizard();
    walkToReview();
    submit();
    expect(
      await screen.findByText('The invitation email to the employee bounced.'),
    ).toBeInTheDocument();
  });
});
