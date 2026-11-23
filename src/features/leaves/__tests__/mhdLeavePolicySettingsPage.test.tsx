import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdLeavePolicySettingsPage } from '../components/MhdLeavePolicySettingsPage';
import type { MhdLeavePolicy } from '../WorkflowTypes';

const companyId = 'company-under-test';

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId }, roles: ['HR Admin'] }),
}));

const getDraft = vi.fn();
const saveDraft = vi.fn();
const discardDraft = vi.fn();
vi.mock('@/features/drafts/Service', () => ({
  mhdDraftService: {
    get: (...args: unknown[]) => getDraft(...args),
    save: (...args: unknown[]) => saveDraft(...args),
    discard: (...args: unknown[]) => discardDraft(...args),
  },
}));

const getPolicy = vi.fn();
const setPolicy = vi.fn();
vi.mock('../PolicyService', () => ({
  mhdLeavePolicyService: {
    get: (...args: unknown[]) => getPolicy(...args),
    set: (...args: unknown[]) => setPolicy(...args),
  },
}));

const noElection: MhdLeavePolicy = {
  election_recorded: false,
  year_method: null,
  anchor_month: null,
  anchor_day: null,
  effective_from: null,
  limit_designated_person: false,
  rtw_certification_uniform_policy: false,
  method_text_key: 'LEAVE_YEAR_METHOD_MOST_FAVORABLE',
  upcoming: null,
  history: [],
};

const withElection: MhdLeavePolicy = {
  election_recorded: true,
  year_method: 'FIXED_YEAR',
  anchor_month: 7,
  anchor_day: 1,
  effective_from: '2026-01-01',
  limit_designated_person: true,
  rtw_certification_uniform_policy: false,
  method_text_key: 'LEAVE_YEAR_METHOD_FIXED_YEAR',
  upcoming: null,
  history: [
    {
      id: 'election-1',
      year_method: 'FIXED_YEAR',
      anchor_month: 7,
      anchor_day: 1,
      effective_from: '2026-01-01',
      limit_designated_person: true,
      rtw_certification_uniform_policy: false,
      change_reason: 'Aligned the leave year with the fiscal year.',
      set_by: 'user-1',
      created_at: '2025-12-01T10:00:00Z',
    },
  ],
};

async function openElectionForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Record An Election' }));
  return screen.findByRole('dialog', { name: 'Record An Election' });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MhdLeavePolicySettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MhdLeavePolicySettingsPage', () => {
  beforeEach(() => {
    getPolicy.mockReset();
    setPolicy.mockReset();
    getDraft.mockReset().mockResolvedValue(null);
    saveDraft.mockReset();
    discardDraft.mockReset().mockResolvedValue(undefined);
  });

  it('shows the most-favorable wording when no election is recorded', async () => {
    getPolicy.mockResolvedValue(noElection);
    renderPage();
    expect(
      (await screen.findAllByText('Most Favorable To The Employee — No Election Recorded')).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('No election has been recorded.')).toBeInTheDocument();
  });

  it('renders the current election and its history row', async () => {
    getPolicy.mockResolvedValue(withElection);
    renderPage();
    expect(
      await screen.findByText('Aligned the leave year with the fiscal year.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Fixed Leave Year').length).toBeGreaterThan(1);
    expect(screen.getAllByText('July 1').length).toBeGreaterThan(1);
    expect(
      screen.getByText('Limit Designated Person To One Per 12 Months: On'),
    ).toBeInTheDocument();
  });

  it('enables the anchor inputs only for a Fixed Leave Year', async () => {
    getPolicy.mockResolvedValue(noElection);
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);
    const method = screen.getByLabelText('Leave-Year Method');
    expect(screen.getByLabelText('Anchor Month')).toBeDisabled();
    expect(screen.getByLabelText('Anchor Day')).toBeDisabled();
    await user.selectOptions(method, 'FIXED_YEAR');
    expect(screen.getByLabelText('Anchor Month')).toBeEnabled();
    expect(screen.getByLabelText('Anchor Day')).toBeEnabled();
    await user.selectOptions(method, 'CALENDAR_YEAR');
    expect(screen.getByLabelText('Anchor Month')).toBeDisabled();
  });

  it('shows the server refusal message when the 60-day notice is not met', async () => {
    getPolicy.mockResolvedValue(noElection);
    setPolicy.mockRejectedValue(new Error('A change of method needs 60 days notice.'));
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);
    await user.selectOptions(screen.getByLabelText('Leave-Year Method'), 'ROLLING_FORWARD');
    await user.click(screen.getByRole('button', { name: 'Record Election' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A change of method needs 60 days notice.',
    );
    expect(setPolicy).toHaveBeenCalledTimes(1);
  });

  it('requires a reason once an election exists, and sends it when given', async () => {
    getPolicy.mockResolvedValue(withElection);
    setPolicy.mockResolvedValue('new-election');
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);
    await user.click(screen.getByRole('button', { name: 'Record Election' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter the reason for this change.');
    expect(setPolicy).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Reason'), 'Switching to a calendar year.');
    await user.click(screen.getByRole('button', { name: 'Record Election' }));
    await waitFor(() => expect(setPolicy).toHaveBeenCalledTimes(1));
    expect(setPolicy.mock.calls[0][0]).toMatchObject({
      companyId,
      yearMethod: 'CALENDAR_YEAR',
      anchorMonth: null,
      anchorDay: null,
      reason: 'Switching to a calendar year.',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(discardDraft).toHaveBeenCalled();
  });

  it('does not require a reason before the first election', async () => {
    getPolicy.mockResolvedValue(noElection);
    setPolicy.mockResolvedValue('first-election');
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);
    await user.click(screen.getByRole('button', { name: 'Record Election' }));
    await waitFor(() => expect(setPolicy).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the current election read-only and opens the form as a dialog', async () => {
    getPolicy.mockResolvedValue(withElection);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Current Election');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const dialog = await openElectionForm(user);
    expect(dialog).toBeInTheDocument();
  });

  it('saves a draft of the form values', async () => {
    getPolicy.mockResolvedValue(noElection);
    saveDraft.mockResolvedValue({
      id: 'draft-1',
      draftKind: 'LEAVE_POLICY_SETTINGS',
      draftKey: 'new',
      title: null,
      stepKey: null,
      payload: {},
      updatedAt: '2026-11-20T10:00:00Z',
      expiresAt: '2026-12-20T10:00:00Z',
    });
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);
    await user.selectOptions(screen.getByLabelText('Leave-Year Method'), 'FIXED_YEAR');
    await user.selectOptions(screen.getByLabelText('Anchor Month'), '9');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledTimes(1));
    expect(saveDraft.mock.calls[0][0]).toMatchObject({
      draftKind: 'LEAVE_POLICY_SETTINGS',
      draftKey: 'new',
      payload: { yearMethod: 'FIXED_YEAR', anchorMonth: '9' },
    });
  });

  it('resumes a saved draft into the form', async () => {
    getPolicy.mockResolvedValue(noElection);
    getDraft.mockResolvedValue({
      id: 'draft-1',
      draftKind: 'LEAVE_POLICY_SETTINGS',
      draftKey: 'new',
      title: null,
      stepKey: null,
      payload: {
        yearMethod: 'FIXED_YEAR',
        anchorMonth: '4',
        anchorDay: '15',
        reason: 'Fiscal alignment',
      },
      updatedAt: '2026-11-20T10:00:00Z',
      expiresAt: '2026-12-20T10:00:00Z',
    });
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);
    await user.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('Leave-Year Method')).toHaveValue('FIXED_YEAR');
    expect(screen.getByLabelText('Anchor Month')).toHaveValue('4');
    expect(screen.getByLabelText('Anchor Day')).toHaveValue(15);
    expect(screen.getByLabelText(/^Reason/)).toHaveValue('Fiscal alignment');
  });
});
