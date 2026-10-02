import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdOnboardingPacketSuggestion } from '../Types';
import { MhdOnboardingWizard } from '../components/MhdOnboardingWizard';

const state = vi.hoisted(() => ({
  start: vi.fn(),
  suggestionInputs: [] as Array<{
    personId: string | null;
    stateCode: string | null;
    employmentType: string | null;
  }>,
  context: null as Record<string, unknown> | null,
  suggestions: [] as MhdOnboardingPacketSuggestion[],
  roster: [
    { personId: 'person-amara', displayName: 'Amara Okafor', isStarted: false },
    { personId: 'person-liam', displayName: 'Liam Chen', isStarted: true },
  ],
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

vi.mock('@/utils/useMhdModuleComplianceReadiness', () => ({
  useMhdModuleComplianceReadiness: () => ({ data: null }),
}));

vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: { templateKey: string; entityType: string; entityId: string }) => (
    <p>{`Document step: ${props.templateKey} for ${props.entityType} ${props.entityId}`}</p>
  ),
}));

vi.mock('../Hook', () => ({
  useMhdOnboardingRoster: () => ({ rows: state.roster, isLoading: false, errorMessage: null }),
  useMhdOnboardingHireContext: () => ({
    data: state.context,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useMhdOnboardingPacketSuggestions: (input: {
    personId: string | null;
    stateCode: string | null;
    employmentType: string | null;
  }) => {
    state.suggestionInputs.push(input);
    return { data: state.suggestions, isLoading: false, isError: false, error: null };
  },
  useMhdStartOnboardingPacket: () => ({ mutateAsync: state.start, isPending: false }),
}));

const offer = {
  hasAcceptedOffer: true,
  offerReference: 'OFFER-204',
  startDate: '2026-11-02',
  jobTitle: 'People Operations Analyst',
  employmentType: 'Full-time',
  department: 'People',
  location: 'Oakland, CA',
  stateCode: 'CA',
  managerName: 'Mina Patel',
  companyName: 'Northstar',
  packetItemsStarted: 1,
};

const suggestions: MhdOnboardingPacketSuggestion[] = [
  {
    documentKey: 'onboarding_i9_records',
    label: 'Form I-9',
    isRequired: true,
    reason: 'Required for employment eligibility.',
    alreadyStarted: false,
  },
  {
    documentKey: 'onboarding_offer_letters',
    label: 'Offer Letter',
    isRequired: true,
    reason: 'The accepted offer belongs in the packet.',
    alreadyStarted: true,
  },
  {
    documentKey: 'onboarding_badge_acknowledgments',
    label: 'Badge Acknowledgment',
    isRequired: false,
    reason: 'Suggested for this worksite.',
    alreadyStarted: false,
  },
];

function renderWizard(initialEntry = '/onboarding/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/onboarding/new" element={<MhdOnboardingWizard />} />
        <Route path="/onboarding/:personId" element={<p>Checklist opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

function choose(personId = 'person-amara') {
  fireEvent.change(screen.getByLabelText('Employee'), { target: { value: personId } });
}

beforeEach(() => {
  vi.clearAllMocks();
  state.suggestionInputs = [];
  state.context = offer;
  state.suggestions = suggestions;
  state.start.mockResolvedValue([]);
});

describe('MhdOnboardingWizard', () => {
  it('starts the packet once, sends the right keys and UTC due date, and opens the checklist', async () => {
    const user = userEvent.setup();
    renderWizard();
    choose();
    next();
    await user.type(screen.getByLabelText('Due date for new items'), '11/02/2026');
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(state.start).toHaveBeenCalledTimes(1));
    expect(state.start).toHaveBeenCalledWith({
      companyId: 'company-1',
      personId: 'person-amara',
      documentKeys: ['onboarding_i9_records', 'onboarding_badge_acknowledgments'],
      dueDate: '2026-11-02T00:00:00.000Z',
    });
    expect(screen.getByText('Onboarding Started')).toBeInTheDocument();
    expect(
      screen.getByText("2 documents were added to Amara Okafor's packet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Document step: ONBOARDING_WELCOME_PACKET for ONBOARDING_PACKET person-amara',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Checklist' }));
    expect(await screen.findByText('Checklist opened')).toBeInTheDocument();
  });

  it('validates the person and shows only present offer fields, including the no-offer state', () => {
    renderWizard();
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an employee.');
    choose();
    expect(screen.getByText('From the accepted offer')).toBeInTheDocument();
    expect(screen.getByText('Offer reference:').parentElement).toHaveTextContent('OFFER-204');
    expect(screen.getByText('Reporting manager:').parentElement).toHaveTextContent('Mina Patel');
    expect(screen.queryByText('Company name:')).not.toBeInTheDocument();
    expect(screen.queryByText(/Company name/)).not.toBeInTheDocument();
    state.context = { hasAcceptedOffer: false };
    fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'person-liam' } });
    expect(screen.getByText('No accepted offer on file.')).toBeInTheDocument();
  });

  it('prefills overrides from the offer and passes overtyped values to suggestions', async () => {
    renderWizard();
    choose();
    expect(screen.getByLabelText('Governing state')).toHaveValue('CA');
    expect(screen.getByLabelText('Employment type')).toHaveValue('Full-time');
    fireEvent.change(screen.getByLabelText('Governing state'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText('Employment type'), { target: { value: 'Seasonal' } });
    next();
    expect(screen.getByText('Suggested for this worksite.')).toBeInTheDocument();
    expect(state.suggestionInputs[state.suggestionInputs.length - 1]).toMatchObject({
      personId: 'person-amara',
      stateCode: 'NY',
      employmentType: 'Seasonal',
    });
  });

  it('shows reasons, disables already-started items, allows unchecking, and validates an empty packet', () => {
    renderWizard();
    choose();
    next();
    expect(screen.getByText('Required for employment eligibility.')).toBeInTheDocument();
    // Both required documents carry the tag; the optional badge document does not.
    expect(screen.getAllByText('Required')).toHaveLength(2);
    const started = screen.getByLabelText(/Offer Letter/);
    expect(started).toBeChecked();
    expect(started).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Form I-9/));
    fireEvent.click(screen.getByLabelText(/Badge Acknowledgment/));
    expect(screen.getByLabelText(/Form I-9/)).not.toBeChecked();
    // Only the already-started offer letter remains chosen, so Review lists it as such.
    next();
    expect(screen.getByText('Offer Letter (already started)')).toBeInTheDocument();
  });

  it('blocks the packet step when there is nothing to choose', () => {
    state.suggestions = [];
    renderWizard();
    choose();
    next();
    expect(screen.getByText('No packet documents were suggested.')).toBeInTheDocument();
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose at least one document.');
  });

  it('rejects a selection containing only already-started documents without mutating', async () => {
    state.suggestions = [suggestions[1]];
    renderWizard();
    choose();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Every chosen document has already been started.',
    );
    expect(state.start).not.toHaveBeenCalled();
  });

  it('shows a server refusal on Review and retries successfully', async () => {
    state.start
      .mockRejectedValueOnce(new Error('Pre-live compliance gate is active.'))
      .mockResolvedValueOnce([]);
    renderWizard();
    choose();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Pre-live compliance gate is active.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Onboarding Started')).toBeInTheDocument();
    expect(state.start).toHaveBeenCalledTimes(2);
  });

  it('preselects the person from the query parameter', () => {
    renderWizard('/onboarding/new?personId=person-liam');
    expect(screen.getByLabelText('Employee')).toHaveValue('person-liam');
    expect(screen.getByText('From the accepted offer')).toBeInTheDocument();
  });

  it('never sends an actor id', async () => {
    renderWizard();
    choose();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(state.start).toHaveBeenCalled());
    expect(state.start.mock.calls[0][0].dueDate).toBeNull();
    expect(state.start.mock.calls[0][0]).not.toHaveProperty('actorId');
    expect(state.start.mock.calls[0][0]).not.toHaveProperty('actorUserId');
  });
});
