import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PERSON_ID = '5c1f9a20-6d3e-4b87-8a14-0e2b7d9c3f51';
const LEAVE_ID = 'a7e3c2d4-1b58-4f09-9d6a-3c8e5b1f7a20';

const { auth, routeAsync, submitAsync, draft } = vi.hoisted(() => ({
  auth: {
    current: {
      profile: {
        personId: null as string | null,
        companyId: null as string | null,
        displayName: '',
      },
      roles: [] as string[],
    },
  },
  routeAsync: vi.fn(),
  submitAsync: vi.fn(),
  draft: {
    draft: null as unknown,
    shared: [],
    savedAt: null as string | null,
    saveError: null,
    isSaving: false,
    save: vi.fn(),
    discard: vi.fn(),
  },
}));

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => auth.current }));
vi.mock('@/features/drafts/Hook', () => ({ useMhdDraft: () => draft }));
vi.mock('@/features/people/Hook', () => ({
  useMhdPeoplePicker: () => ({
    data: [{ id: PERSON_ID, displayName: 'Imani Okonkwo-Reyes' }],
  }),
}));
vi.mock('@/features/benefit-intake/Hook', () => ({
  useMhdBenefitIntakeRoute: () => ({ mutateAsync: routeAsync, isPending: false }),
  useMhdSubmitBenefitIntake: () => ({ mutateAsync: submitAsync, isPending: false }),
}));

const { MhdBenefitIntakeModal } = await import('../MhdBenefitIntakeModal');

function renderModal(onSubmitted = vi.fn()) {
  render(
    <MemoryRouter>
      <MhdBenefitIntakeModal open onClose={vi.fn()} onSubmitted={onSubmitted} />
    </MemoryRouter>,
  );
  return onSubmitted;
}

const step = () => screen.getByRole('heading', { level: 2 }).textContent;
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }));

async function answerNeed(reason: string, timeAway: boolean, workplace: boolean) {
  fireEvent.change(screen.getByLabelText(/what is the reason for your request/i), {
    target: { value: reason },
  });
  fireEvent.click(
    within(screen.getByRole('group', { name: /time away from work/i })).getByLabelText(
      timeAway ? 'Yes' : 'No',
    ),
  );
  fireEvent.click(
    within(screen.getByRole('group', { name: /change to your job/i })).getByLabelText(
      workplace ? 'Yes' : 'No',
    ),
  );
}

async function reachRouting(outcome: string, reason = 'OWN_HEALTH', ...need: [boolean, boolean]) {
  routeAsync.mockResolvedValueOnce(outcome);
  next();
  await waitFor(() => expect(step()).toBe('Need'));
  await answerNeed(reason, ...need);
  next();
  await waitFor(() => expect(step()).toBe('Routing'));
}

beforeEach(() => {
  vi.clearAllMocks();
  draft.draft = null;
  draft.savedAt = null;
  draft.discard.mockResolvedValue(undefined);
  draft.save.mockResolvedValue(undefined);
  auth.current = {
    profile: { personId: PERSON_ID, companyId: null, displayName: 'Imani Okonkwo-Reyes' },
    roles: ['Client User'],
  };
});

describe('MhdBenefitIntakeModal', () => {
  it('shows an employee their own name and no person picker', () => {
    renderModal();
    expect(screen.getByText('This request is for Imani Okonkwo-Reyes.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Who is this request for?')).not.toBeInTheDocument();
  });

  it('shows an administrator the person picker', () => {
    auth.current = {
      profile: { personId: null, companyId: null, displayName: '' },
      roles: ['HR Partner'],
    };
    renderModal();
    expect(screen.getByLabelText('Who is this request for?')).toBeInTheDocument();
  });

  it('offers no input for headcount, hours worked, months of service or worksite counts', async () => {
    renderModal();
    await reachRouting('BOTH', 'OWN_HEALTH', true, true);
    expect(
      screen.queryByLabelText(/headcount|hours worked|months of service|worksite|employee count/i),
    ).toBeNull();
  });

  it('shows only the leave step for a leave-only route', async () => {
    renderModal();
    await reachRouting('LEAVE', 'OWN_HEALTH', true, false);
    next();
    await waitFor(() => expect(step()).toBe('Leave'));
    next();
    await waitFor(() => expect(step()).toBe('Review'));
  });

  it('shows only the accommodation step for an accommodation-only route', async () => {
    renderModal();
    await reachRouting('ACCOMMODATION', 'OWN_HEALTH', false, true);
    next();
    await waitFor(() => expect(step()).toBe('Accommodation'));
    next();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows both steps when the request needs leave and an accommodation', async () => {
    renderModal();
    await reachRouting('BOTH', 'PREGNANCY', true, true);
    next();
    await waitFor(() => expect(step()).toBe('Leave'));
    next();
    await waitFor(() => expect(step()).toBe('Accommodation'));
  });

  it('blocks a request that matches no path', async () => {
    renderModal();
    await reachRouting('NO_MATCH', 'OTHER', true, false);
    next();
    expect(await screen.findByRole('alert')).toHaveTextContent(/does not currently match/i);
    expect(step()).toBe('Routing');
  });

  it('saves a draft with the step key', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(draft.save).toHaveBeenCalledTimes(1));
    expect(draft.save.mock.calls[0][0]).toMatchObject({ stepKey: 'who', title: 'Benefit Intake' });
  });

  it('offers to resume a saved draft at its step', async () => {
    draft.draft = {
      id: 'd-1',
      updatedAt: '2026-11-22T10:00:00Z',
      stepKey: 'routing',
      payload: { form: { reason: 'OWN_HEALTH', needsTimeAway: true }, outcome: 'LEAVE' },
    };
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Resume Draft' }));
    await waitFor(() => expect(step()).toBe('Routing'));
  });

  it('shows the confirmation and discards the draft after a successful submit', async () => {
    const onSubmitted = renderModal();
    await reachRouting('LEAVE', 'OWN_HEALTH', true, false);
    next();
    await waitFor(() => expect(step()).toBe('Leave'));
    next();
    await waitFor(() => expect(step()).toBe('Review'));
    submitAsync.mockResolvedValueOnce({ outcome: 'LEAVE', leaveCaseId: LEAVE_ID });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }));
    expect(await screen.findByText('Request submitted. HR has been notified.')).toBeInTheDocument();
    expect(draft.discard).toHaveBeenCalled();
    expect(onSubmitted).toHaveBeenCalledWith({ outcome: 'LEAVE', leaveCaseId: LEAVE_ID });
    expect(screen.getByRole('link', { name: 'Open leave case' })).toHaveAttribute(
      'href',
      `/leaves/${LEAVE_ID}`,
    );
  });

  it('displays a server error and keeps the form', async () => {
    renderModal();
    await reachRouting('LEAVE', 'OWN_HEALTH', true, false);
    next();
    await waitFor(() => expect(step()).toBe('Leave'));
    next();
    await waitFor(() => expect(step()).toBe('Review'));
    submitAsync.mockRejectedValueOnce(new Error('You cannot submit for this person.'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }));
    expect(await screen.findByText('You cannot submit for this person.')).toBeInTheDocument();
    expect(step()).toBe('Review');
  });
});
