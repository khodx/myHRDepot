import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdLeavePolicySettingsPage } from '../components/MhdLeavePolicySettingsPage';
import type { MhdLeavePolicy } from '../WorkflowTypes';

const COMPANY_ID = '2c9d6e14-8b37-4a05-91f2-d4e7a3b60c58';

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: COMPANY_ID }, roles: ['Client Admin'] }),
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

const election = {
  id: crypto.randomUUID(),
  year_method: 'ROLLING_BACKWARD' as const,
  anchor_month: null,
  anchor_day: null,
  effective_from: '2026-03-01',
  limit_designated_person: false,
  rtw_certification_uniform_policy: true,
  change_reason: 'Moved to a rolling look-back after the payroll vendor change.',
  set_by: crypto.randomUUID(),
  created_at: '2026-01-12T16:30:00Z',
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

describe('MhdLeavePolicySettingsPage effective date and history', () => {
  beforeEach(() => {
    getPolicy.mockReset();
    setPolicy.mockReset();
    getDraft.mockReset().mockResolvedValue(null);
    saveDraft.mockReset();
    discardDraft.mockReset().mockResolvedValue(undefined);
  });

  it('sends the typed effective date with the election', async () => {
    getPolicy.mockResolvedValue(noElection);
    setPolicy.mockResolvedValue(crypto.randomUUID());
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);

    await user.selectOptions(screen.getByLabelText('Leave-Year Method'), 'FIXED_YEAR');
    await user.selectOptions(screen.getByLabelText('Anchor Month'), '9');
    fireEvent.change(screen.getByLabelText('Anchor Day'), { target: { value: '15' } });
    const effective = screen.getByLabelText('Effective From');
    fireEvent.change(effective, { target: { value: '02/01/2027' } });
    fireEvent.blur(effective);
    await user.click(screen.getByRole('button', { name: 'Record Election' }));

    await waitFor(() => expect(setPolicy).toHaveBeenCalledTimes(1));
    expect(setPolicy.mock.calls[0][0]).toMatchObject({
      companyId: COMPANY_ID,
      yearMethod: 'FIXED_YEAR',
      anchorMonth: 9,
      anchorDay: 15,
      effectiveFrom: '2027-02-01',
    });
  });

  it('sends no effective date when the field is left empty', async () => {
    getPolicy.mockResolvedValue(noElection);
    setPolicy.mockResolvedValue(crypto.randomUUID());
    const user = userEvent.setup();
    renderPage();
    await openElectionForm(user);
    await user.click(screen.getByRole('button', { name: 'Record Election' }));

    await waitFor(() => expect(setPolicy).toHaveBeenCalledTimes(1));
    expect(setPolicy.mock.calls[0][0]).toMatchObject({ effectiveFrom: null });
  });

  it('lists every recorded election in the history table with its reason', async () => {
    const earlier = {
      ...election,
      id: crypto.randomUUID(),
      year_method: 'CALENDAR_YEAR' as const,
      effective_from: '2024-01-01',
      rtw_certification_uniform_policy: false,
      change_reason: 'First election recorded at onboarding.',
      created_at: '2023-12-04T09:10:00Z',
    };
    getPolicy.mockResolvedValue({
      ...noElection,
      election_recorded: true,
      year_method: election.year_method,
      effective_from: election.effective_from,
      rtw_certification_uniform_policy: true,
      method_text_key: 'LEAVE_YEAR_METHOD_ROLLING_BACKWARD',
      history: [election, earlier],
    } satisfies MhdLeavePolicy);
    renderPage();

    expect(
      await screen.findByText('Moved to a rolling look-back after the payroll vendor change.'),
    ).toBeInTheDocument();
    expect(screen.getByText('First election recorded at onboarding.')).toBeInTheDocument();
  });
});
