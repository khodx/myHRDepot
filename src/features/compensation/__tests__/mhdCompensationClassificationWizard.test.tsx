import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdCompensationClassificationWizard } from '../components/MhdCompensationClassificationWizard';

const mutate = {
  evaluate: vi.fn(),
  score: vi.fn(),
  confirm: vi.fn(),
  override: vi.fn(),
  market: vi.fn(),
  careerOneStop: vi.fn(),
  recommend: vi.fn(),
  payConfirm: vi.fn(),
};

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => ({ profile: { companyId: 'company-1' } }) }));
// The document step has its own tests; here we only care that it is offered for the right record.
vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: { templateKey: string; entityType: string; entityId: string }) => (
    <p>{`Document step: ${props.templateKey} for ${props.entityType} ${props.entityId}`}</p>
  ),
}));
vi.mock('@/features/jobs/Hook', () => ({
  useMhdJobs: () => ({ data: [{ id: 'job-1', jobTitle: 'Analyst', jobCode: 'A1', onetSocCode: null, caWageOrderClassification: null }] }),
}));
vi.mock('../Hook', () => ({
  useMhdCompensationReadiness: () => ({ data: null }),
  useMhdJobClassificationEvaluate: () => ({ mutateAsync: mutate.evaluate, isPending: false }),
  useMhdJobEvaluationScore: () => ({ mutateAsync: mutate.score, isPending: false }),
  useMhdJobClassificationConfirm: () => ({ mutateAsync: mutate.confirm, isPending: false }),
  useMhdJobClassificationOverride: () => ({ mutateAsync: mutate.override, isPending: false }),
  useMhdMarketWageLookup: () => ({ mutateAsync: mutate.market, isPending: false }),
  useMhdCareerOneStopWageLookup: () => ({ mutateAsync: mutate.careerOneStop, isPending: false }),
  useMhdJobPayGradeRecommend: () => ({ mutateAsync: mutate.recommend, isPending: false }),
  useMhdJobPayGradeConfirm: () => ({ mutateAsync: mutate.payConfirm, isPending: false }),
}));

const determination = {
  snapshotId: 'snapshot-1',
  determinationId: 'determination-1',
  jurisdiction: 'FEDERAL',
  evaluatedOutcome: 'EXEMPT',
  findings: { code: 'salary-test' },
};

function renderWizard() {
  return render(
    <MemoryRouter>
      <MhdCompensationClassificationWizard />
    </MemoryRouter>,
  );
}

async function selectJobAndFacts(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole('combobox', { name: 'Job' }), 'job-1');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Exemption category' }), 'EXECUTIVE');
  await user.type(screen.getByRole('spinbutton', { name: 'Weekly salary' }), '1000');
}

beforeEach(() => {
  Object.values(mutate).forEach((fn) => fn.mockReset());
  mutate.evaluate.mockResolvedValue([determination]);
  mutate.score.mockResolvedValue(undefined);
  mutate.confirm.mockResolvedValue(undefined);
  mutate.override.mockResolvedValue(undefined);
  mutate.market.mockResolvedValue({ success: true, snapshotId: 'market-1', socCode: '13-0000', dataYear: 2025, source: 'BLS OEWS', hourlyMedian: 40 });
  mutate.recommend.mockResolvedValue([{ recommendationId: 'recommendation-1', totalPoints: 10, recommendedPayGradeId: null }]);
  mutate.payConfirm.mockResolvedValue(undefined);
});

describe('MhdCompensationClassificationWizard', () => {
  it('gates Select Job and Facts & Scoring before allowing Next', async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Select a job');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Job' }), 'job-1');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Select an exemption category');
  });

  it('evaluates once when moving forward, even after navigating back and forward, and Previous never mutates', async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(mutate.evaluate).not.toHaveBeenCalled();
    await selectJobAndFacts(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(1));
  });

  it('skips missing market data and renders a null pay-grade recommendation as no match', async () => {
    const user = userEvent.setup();
    renderWizard();
    await selectJobAndFacts(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Market data isn't available/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(screen.getByText('No matching pay grade configured')).toBeInTheDocument());
    expect(mutate.market).not.toHaveBeenCalled();
  });

  it('captures the license/credential evidence for PROFESSIONAL and omits it otherwise', async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Job' }), 'job-1');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Exemption category' }), 'PROFESSIONAL');
    await user.type(screen.getByRole('spinbutton', { name: 'Weekly salary' }), '1000');

    expect(screen.getByLabelText(/License or certification name/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /legally requires a professional license/ }));
    await user.type(screen.getByLabelText(/License or certification name/), 'California Bar');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(1));
    expect(mutate.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        ksaInputs: { requires_license: true, license_name: 'California Bar' },
      }),
    );
  });

  it('sends no ksaInputs for a non-PROFESSIONAL category', async () => {
    const user = userEvent.setup();
    renderWizard();
    await selectJobAndFacts(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(1));
    expect(mutate.evaluate).toHaveBeenCalledWith(expect.objectContaining({ ksaInputs: undefined }));
  });
  it('evaluates again when a fact changes after walking back, and drops the old confirmations', async () => {
    const user = userEvent.setup();
    renderWizard();
    await selectJobAndFacts(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.clear(screen.getByRole('spinbutton', { name: 'Weekly salary' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Weekly salary' }), '2500');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(2));
    expect(mutate.evaluate.mock.calls[1][0]).toMatchObject({ weeklySalary: 2500 });
    // The new determinations are unconfirmed: the Confirm step refuses to advance.
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Confirm or override every determination');
  });

  it('shows the server message when the evaluation fails and stays on the facts step', async () => {
    mutate.evaluate.mockRejectedValueOnce(new Error('No active exemption rules for this date.'));
    const user = userEvent.setup();
    renderWizard();
    await selectJobAndFacts(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No active exemption rules for this date.');
    expect(screen.getByRole('spinbutton', { name: 'Weekly salary' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(2));
  });

  it('offers the classification memo for the evaluated snapshot once the pay-grade recommendation is made', async () => {
    mutate.recommend.mockResolvedValue([
      { recommendationId: 'recommendation-1', totalPoints: 10, recommendedPayGradeId: 'grade-7' },
    ]);
    const user = userEvent.setup();
    renderWizard();
    await selectJobAndFacts(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Classification Recorded')).toBeInTheDocument();
    expect(
      screen.getByText('Document step: COMPENSATION_CLASSIFICATION_MEMO for JOB_CLASSIFICATION_SNAPSHOT snapshot-1'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm this grade' }));
    await waitFor(() =>
      expect(mutate.payConfirm).toHaveBeenCalledWith({
        recommendationId: 'recommendation-1',
        confirmedPayGradeId: 'grade-7',
        overrideReason: null,
      }),
    );
    expect(await screen.findByText('Pay grade confirmed.')).toBeInTheDocument();
  });
});
