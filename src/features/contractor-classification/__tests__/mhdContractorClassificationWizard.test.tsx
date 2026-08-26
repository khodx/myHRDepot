import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdContractorClassificationWizard } from '../components/MhdContractorClassificationWizard';

const { mutate, auth, readiness } = vi.hoisted(() => ({
  mutate: { evaluate: vi.fn(), confirm: vi.fn() },
  auth: { roles: [] as string[] },
  readiness: { value: null as { release_ready: boolean; blocker_count: number } | null },
}));

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => ({ profile: { companyId: 'company-1' }, roles: auth.roles }) }));
vi.mock('@/features/people/Hook', () => ({ useMhdPeoplePicker: () => ({ data: [] }) }));
vi.mock('../Hook', () => ({
  useMhdContractorClassificationReadiness: () => ({ data: readiness.value }),
  useMhdCaAb5ExemptionCategories: () => ({ data: [{ id: 'category-1', categoryLabel: 'Licensed professional', citation: '§ 2775' }] }),
  useEvaluateContractorClassification: () => ({ mutateAsync: mutate.evaluate, isPending: false }),
  useConfirmContractorClassification: () => ({ mutateAsync: mutate.confirm, isPending: false }),
}));

const results = [
  { snapshotId: 'snapshot-1', determinationId: 'fed-1', jurisdiction: 'FEDERAL', testKey: 'FEDERAL_ECONOMIC_REALITY', ruleSetId: 'rf', evaluatedOutcome: 'CONTRACTOR', effectiveOutcome: 'CONTRACTOR', findings: { score: 6 } },
  { snapshotId: 'snapshot-1', determinationId: 'ca-1', jurisdiction: 'CA', testKey: 'CA_BORELLO', ruleSetId: 'rc', evaluatedOutcome: 'CONTRACTOR', effectiveOutcome: 'CONTRACTOR', findings: { score: 9 } },
] as const;

beforeEach(() => {
  auth.roles = [];
  readiness.value = null;
  mutate.evaluate.mockReset().mockResolvedValue(results);
  mutate.confirm.mockReset().mockResolvedValue(undefined);
});

async function submitIntake(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Engagement label'), 'Marketing consultant');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.selectOptions(screen.getByLabelText(/Opportunity for profit or loss/), 'CONTRACTOR');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(1));
}

describe('MhdContractorClassificationWizard', () => {
  it('renders the compliance gate banner only when readiness is not release-ready', () => {
    const { rerender } = render(<MhdContractorClassificationWizard />);
    expect(screen.queryByText('Pre-live compliance gate is active')).not.toBeInTheDocument();
    readiness.value = { release_ready: false, blocker_count: 4 };
    rerender(<MhdContractorClassificationWizard />);
    expect(screen.getByText('Pre-live compliance gate is active')).toBeInTheDocument();
    expect(screen.getByText(/4 regulated content items/)).toBeInTheDocument();
  });

  it('hides confirm and override controls for non-privileged roles', async () => {
    const user = userEvent.setup();
    render(<MhdContractorClassificationWizard />);
    await submitIntake(user);
    expect(screen.getByText('FEDERAL')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm recommendation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Override' })).not.toBeInTheDocument();
  });

  it.each(['Platform Admin', 'HR Partner', 'HR Admin'])('shows controls for %s', async (role) => {
    auth.roles = [role];
    const user = userEvent.setup();
    render(<MhdContractorClassificationWizard />);
    await submitIntake(user);
    expect(screen.getAllByRole('button', { name: 'Confirm recommendation' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Override' })).toHaveLength(2);
  });

  it('evaluates entered facts, renders both jurisdictions, and uses the returned CA test key', async () => {
    const user = userEvent.setup();
    render(<MhdContractorClassificationWizard />);
    await submitIntake(user);
    expect(mutate.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'company-1', personId: null, engagementLabel: 'Marketing consultant',
      engagementFacts: expect.objectContaining({ OPPORTUNITY_FOR_PROFIT_OR_LOSS: 'CONTRACTOR' }),
      selectedCaExemptionId: null,
    }));
    expect(screen.getByText('FEDERAL')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
    expect(screen.getByText('Applied test: CA_BORELLO')).toBeInTheDocument();
  });

  it('requires a reason for a changed outcome and confirms after a reason is provided', async () => {
    auth.roles = ['HR Admin'];
    const user = userEvent.setup();
    render(<MhdContractorClassificationWizard />);
    await submitIntake(user);
    await user.click(screen.getAllByRole('button', { name: 'Override' })[0]);
    await user.selectOptions(screen.getAllByLabelText('Effective outcome')[0], 'EMPLOYEE');
    await user.click(screen.getAllByRole('button', { name: 'Save override' })[0]);
    expect(screen.getByRole('alert')).toHaveTextContent('An override reason is required.');
    expect(mutate.confirm).not.toHaveBeenCalled();
    await user.type(screen.getAllByLabelText('Override reason')[0], 'Reviewed engagement facts');
    await user.click(screen.getAllByRole('button', { name: 'Save override' })[0]);
    await waitFor(() => expect(mutate.confirm).toHaveBeenCalledWith({
      determinationId: 'fed-1', confirmedOutcome: 'EMPLOYEE', overrideReason: 'Reviewed engagement facts',
    }));
  });
});
