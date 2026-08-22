import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  return render(<MhdCompensationClassificationWizard />);
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
});
