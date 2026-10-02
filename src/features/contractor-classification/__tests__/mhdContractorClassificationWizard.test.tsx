import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdContractorClassificationWizard } from '../components/MhdContractorClassificationWizard';

const { mutate, auth, readiness } = vi.hoisted(() => ({
  mutate: { evaluate: vi.fn(), confirm: vi.fn() },
  auth: { roles: [] as string[] },
  readiness: { value: null as { release_ready: boolean; blocker_count: number } | null },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' }, roles: auth.roles }),
}));
vi.mock('@/features/people/Hook', () => ({ useMhdPeoplePicker: () => ({ data: [] }) }));
vi.mock('../Hook', () => ({
  useMhdContractorClassificationReadiness: () => ({ data: readiness.value }),
  useMhdCaAb5ExemptionCategories: () => ({
    data: [{ id: 'category-1', categoryLabel: 'Licensed professional', citation: '§ 2775' }],
  }),
  useEvaluateContractorClassification: () => ({ mutateAsync: mutate.evaluate, isPending: false }),
  useConfirmContractorClassification: () => ({ mutateAsync: mutate.confirm, isPending: false }),
}));
// The document step has its own tests; here we only care that it is offered for the right record.
vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: { templateKey: string; entityType: string; entityId: string }) => (
    <p>{`Document step: ${props.templateKey} for ${props.entityType} ${props.entityId}`}</p>
  ),
}));

const results = [
  {
    snapshotId: 'snapshot-1',
    determinationId: 'fed-1',
    jurisdiction: 'FEDERAL',
    testKey: 'FEDERAL_ECONOMIC_REALITY',
    ruleSetId: 'rf',
    evaluatedOutcome: 'CONTRACTOR',
    effectiveOutcome: 'CONTRACTOR',
    findings: { score: 6 },
  },
  {
    snapshotId: 'snapshot-1',
    determinationId: 'ca-1',
    jurisdiction: 'CA',
    testKey: 'CA_BORELLO',
    ruleSetId: 'rc',
    evaluatedOutcome: 'CONTRACTOR',
    effectiveOutcome: 'CONTRACTOR',
    findings: { score: 9 },
  },
] as const;

beforeEach(() => {
  auth.roles = [];
  readiness.value = null;
  mutate.evaluate.mockReset().mockResolvedValue(results);
  mutate.confirm.mockReset().mockResolvedValue(undefined);
});

function inRouter(element: ReactElement) {
  return <MemoryRouter>{element}</MemoryRouter>;
}

async function submitIntake(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Engagement label'), 'Marketing consultant');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.selectOptions(screen.getByLabelText(/Opportunity for profit or loss/), 'CONTRACTOR');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(1));
}

describe('MhdContractorClassificationWizard', () => {
  it('renders the compliance gate banner only when readiness is not release-ready', () => {
    const { rerender } = render(inRouter(<MhdContractorClassificationWizard />));
    expect(screen.queryByText('Pre-live compliance gate is active')).not.toBeInTheDocument();
    readiness.value = { release_ready: false, blocker_count: 4 };
    rerender(inRouter(<MhdContractorClassificationWizard />));
    expect(screen.getByText('Pre-live compliance gate is active')).toBeInTheDocument();
    expect(screen.getByText(/4 regulated content items/)).toBeInTheDocument();
  });

  it('hides confirm and override controls for non-privileged roles', async () => {
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await submitIntake(user);
    expect(screen.getByText('FEDERAL')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Confirm recommendation' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Override' })).not.toBeInTheDocument();
  });

  it.each(['Platform Admin', 'HR Partner', 'HR Admin'])('shows controls for %s', async (role) => {
    auth.roles = [role];
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await submitIntake(user);
    expect(screen.getAllByRole('button', { name: 'Confirm recommendation' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Override' })).toHaveLength(2);
  });

  it('evaluates entered facts, renders both jurisdictions, and uses the returned CA test key', async () => {
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await submitIntake(user);
    expect(mutate.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        personId: null,
        engagementLabel: 'Marketing consultant',
        engagementFacts: expect.objectContaining({ OPPORTUNITY_FOR_PROFIT_OR_LOSS: 'CONTRACTOR' }),
        selectedCaExemptionId: null,
      }),
    );
    expect(screen.getByText('FEDERAL')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
    expect(screen.getByText('Applied test: CA_BORELLO')).toBeInTheDocument();
  });

  it('requires a reason for a changed outcome and confirms after a reason is provided', async () => {
    auth.roles = ['HR Admin'];
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await submitIntake(user);
    await user.click(screen.getAllByRole('button', { name: 'Override' })[0]);
    await user.selectOptions(screen.getAllByLabelText('Effective outcome')[0], 'EMPLOYEE');
    await user.click(screen.getAllByRole('button', { name: 'Save override' })[0]);
    expect(screen.getByRole('alert')).toHaveTextContent('An override reason is required.');
    expect(mutate.confirm).not.toHaveBeenCalled();
    await user.type(screen.getAllByLabelText('Override reason')[0], 'Reviewed engagement facts');
    await user.click(screen.getAllByRole('button', { name: 'Save override' })[0]);
    await waitFor(() =>
      expect(mutate.confirm).toHaveBeenCalledWith({
        determinationId: 'fed-1',
        confirmedOutcome: 'EMPLOYEE',
        overrideReason: 'Reviewed engagement facts',
      }),
    );
  });

  it('evaluates again when an answer changes after walking back, but not on an unchanged walk', async () => {
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await submitIntake(user);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(mutate.evaluate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.selectOptions(screen.getByLabelText(/Opportunity for profit or loss/), 'EMPLOYEE');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mutate.evaluate).toHaveBeenCalledTimes(2));
    expect(mutate.evaluate.mock.calls[1][0].engagementFacts).toMatchObject({
      OPPORTUNITY_FOR_PROFIT_OR_LOSS: 'EMPLOYEE',
    });
  });

  it('shows the gate message instead of the raw failure when evaluation is refused while the gate is active', async () => {
    readiness.value = { release_ready: false, blocker_count: 2 };
    mutate.evaluate.mockRejectedValueOnce(new Error('content not approved'));
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await user.type(screen.getByLabelText('Engagement label'), 'Marketing consultant');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /pre-live compliance gate is active/,
    );
    expect(screen.getByLabelText(/Opportunity for profit or loss/)).toBeInTheDocument();
  });

  it('offers the classification memo only once a reviewer has confirmed every recommendation', async () => {
    auth.roles = ['HR Partner'];
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await submitIntake(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    for (const button of screen.getAllByRole('button', { name: 'Confirm recommendation' })) {
      await user.click(button);
    }
    await waitFor(() => expect(mutate.confirm).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getAllByText('Recorded')).toHaveLength(2));
    await user.click(await screen.findByRole('button', { name: /submit|finish/i }));
    expect(await screen.findByText('Classification Recorded')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Document step: CONTRACTOR_CLASSIFICATION_MEMO for CONTRACTOR_CLASSIFICATION_SNAPSHOT snapshot-1',
      ),
    ).toBeInTheDocument();
  });

  it('does not offer the memo when nothing has been confirmed', async () => {
    auth.roles = ['HR Partner'];
    const user = userEvent.setup();
    render(inRouter(<MhdContractorClassificationWizard />));
    await submitIntake(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: /submit|finish/i }));
    expect(await screen.findByText('Classification Recorded')).toBeInTheDocument();
    expect(screen.getByText(/not yet confirmed/)).toBeInTheDocument();
    expect(screen.queryByText(/Document step:/)).not.toBeInTheDocument();
  });
});
