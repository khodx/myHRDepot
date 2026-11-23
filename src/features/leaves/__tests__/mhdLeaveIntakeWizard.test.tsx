import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdLeaveIntakeWizard } from '../components/MhdLeaveIntakeWizard';
import {
  MHD_LEAVE_ADMIN_INTAKE_CHANNELS,
  MHD_LEAVE_FAMILY_RELATIONSHIPS,
  MHD_LEAVE_REQUESTED_MODES,
} from '../WorkflowTypes';

const createAsync = vi.fn();
const evaluateAsync = vi.fn();
const confirmAsync = vi.fn();
const overrideAsync = vi.fn();
const navigate = vi.fn();
const authRoles = vi.hoisted(() => ({ current: ['HR Partner'] as string[] }));

const draftController = vi.hoisted(() => ({
  current: {
    draft: null as null | {
      payload: Record<string, unknown>;
      stepKey: string | null;
      updatedAt: string;
    },
    isLoading: false,
    isSaving: false,
    savedAt: null as string | null,
    saveError: null as string | null,
    save: vi.fn(),
    discard: vi.fn(),
  },
}));
vi.mock('@/features/drafts/Hook', () => ({ useMhdDraft: () => draftController.current }));
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' }, roles: authRoles.current }),
}));
vi.mock('@/features/people/Hook', () => ({
  useMhdPeoplePicker: () => ({
    data: [{ id: 'person-1', firstName: 'Ada', lastName: 'Lovelace' }],
  }),
}));
vi.mock('../Hook', () => ({
  useMhdCreateLeaveCase: () => ({ mutateAsync: createAsync, isPending: false }),
}));
vi.mock('../WorkflowHook', () => ({
  useMhdLeaveEligibility: () => ({ mutateAsync: evaluateAsync, isPending: false }),
  useMhdConfirmLeaveEligibility: () => ({ mutateAsync: confirmAsync, isPending: false }),
  useMhdOverrideLeaveEligibility: () => ({ mutateAsync: overrideAsync, isPending: false }),
  useMhdLeaveReadiness: () => ({ data: null }),
}));
vi.mock('../components/MhdLeavesPage', () => ({ MhdLeavesPage: () => null }));
vi.mock('@/components/ui/MhdComplianceGateBanner', () => ({ MhdComplianceGateBanner: () => null }));
vi.mock('@/components/ui/MhdPageHeader', () => ({
  MhdPageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/components/ui/MhdCard', () => ({
  MhdCard: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const result = {
  determination_id: 'determination-1',
  snapshot_id: 'snapshot-1',
  leave_type_id: 'type-1',
  type_key: 'FMLA',
  evaluated_outcome: 'ELIGIBLE',
  entitlement_hours: 480,
  findings: [],
};

function renderWizard(initialEntry = '/leaves/new/intake') {
  // A bare <MhdLeaveIntakeWizard /> under MemoryRouter with no matching
  // <Route> leaves useParams() unable to resolve :caseId regardless of the
  // initial entry URL -- both real route patterns must be registered here,
  // matching AppRouter.tsx, for Entry B (/leaves/:caseId/intake) to work.
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/leaves/new/intake" element={<MhdLeaveIntakeWizard withBackdrop={false} />} />
        <Route
          path="/leaves/:caseId/intake"
          element={<MhdLeaveIntakeWizard withBackdrop={false} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

// Eligibility turns on these facts, so the wizard assumes none of them: each is entered.
function enterFacts() {
  fireEvent.change(screen.getByLabelText('Employer employee count'), { target: { value: '60' } });
  fireEvent.change(screen.getByLabelText('Months of service'), { target: { value: '24' } });
  fireEvent.change(screen.getByLabelText('Hours worked in last 12 months'), {
    target: { value: '1500' },
  });
  fireEvent.change(screen.getByLabelText('Worksite employees within 75 miles'), {
    target: { value: '60' },
  });
  fireEvent.change(screen.getByLabelText('Scheduled weekly hours'), { target: { value: '40' } });
}

describe('MhdLeaveIntakeWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authRoles.current = ['HR Partner'];
    createAsync.mockResolvedValue({ id: 'case-1', referenceId: 'LV-1' });
    evaluateAsync.mockResolvedValue([result]);
    confirmAsync.mockResolvedValue(undefined);
    overrideAsync.mockResolvedValue(undefined);
    draftController.current.draft = null;
    draftController.current.savedAt = null;
    draftController.current.save.mockResolvedValue(undefined);
    draftController.current.discard.mockResolvedValue(undefined);
  });

  it('uses the same wizard with Basics for a new case and without Basics for an existing case', () => {
    const { unmount } = renderWizard();
    expect(screen.getAllByText('Case Basics').length).toBeGreaterThan(0);
    unmount();
    renderWizard('/leaves/case-1/intake');
    expect(screen.queryByText('Case Basics')).not.toBeInTheDocument();
    expect(screen.getAllByText('Employer & Service Facts').length).toBeGreaterThan(0);
  });

  it('guards create and evaluate when navigating back and forward, while Previous stays side-effect-free', async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Subject person'), { target: { value: 'person-1' } });
    fireEvent.change(screen.getByLabelText('Reason category'), {
      target: { value: 'Medical leave' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(createAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(createAsync).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(screen.getAllByText('Employer & Service Facts').length).toBeGreaterThan(0),
    );
    expect(createAsync).toHaveBeenCalledTimes(1);
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
  });

  it('blocks Confirm or Override until the whole snapshot is confirmed', async () => {
    renderWizard('/leaves/case-1/intake');
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Confirm the snapshot before advancing.');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm all as evaluated' }));
    await waitFor(() => expect(confirmAsync).toHaveBeenCalledWith('snapshot-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getAllByText('Designation Summary').length).toBeGreaterThan(0);
  });
  it('marks the confirmation stale after an override and requires confirming again', async () => {
    renderWizard('/leaves/case-1/intake');
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm all as evaluated' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Snapshot confirmed' })).toBeDisabled(),
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Reason for override'), {
      target: { value: 'Verified service dates with payroll' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Override this one' }));
    await waitFor(() => expect(overrideAsync).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('confirmation is out of date'),
    );
    expect(screen.getByRole('button', { name: 'Confirm all as evaluated' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Confirm all as evaluated again');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm all as evaluated' }));
    await waitFor(() => expect(confirmAsync).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getAllByText('Designation Summary').length).toBeGreaterThan(0);
  });

  it('assumes no employer or service fact: the facts step is blank and cannot advance until they are entered', () => {
    renderWizard('/leaves/case-1/intake');
    for (const label of [
      'Employer employee count',
      'Months of service',
      'Hours worked in last 12 months',
      'Worksite employees within 75 miles',
      'Scheduled weekly hours',
    ]) {
      expect(screen.getByLabelText(label)).toHaveValue(null);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('none are assumed');
    expect(evaluateAsync).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Months of service'), { target: { value: '-3' } });
    enterFacts();
    fireEvent.change(screen.getByLabelText('Months of service'), { target: { value: '-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('none are assumed');
    expect(evaluateAsync).not.toHaveBeenCalled();
  });
  it('creates the case with the requested mode and intake channel from the shared vocabularies', async () => {
    renderWizard();
    expect(
      Array.from(
        screen.getByLabelText('Family relationship (optional)').querySelectorAll('option'),
      ).map((option) => option.value),
    ).toEqual(['', ...MHD_LEAVE_FAMILY_RELATIONSHIPS]);
    expect(
      Array.from(screen.getByLabelText('Requested mode').querySelectorAll('option')).map(
        (option) => option.value,
      ),
    ).toEqual([...MHD_LEAVE_REQUESTED_MODES]);
    const channel = screen.getByLabelText('Intake channel');
    expect(Array.from(channel.querySelectorAll('option')).map((option) => option.value)).toEqual([
      ...MHD_LEAVE_ADMIN_INTAKE_CHANNELS,
    ]);
    expect(screen.getByRole('option', { name: 'Manager Referral' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Subject person'), { target: { value: 'person-1' } });
    fireEvent.change(screen.getByLabelText('Reason category'), {
      target: { value: 'Family care' },
    });
    fireEvent.change(screen.getByLabelText('Requested mode'), {
      target: { value: 'REDUCED_SCHEDULE' },
    });
    fireEvent.change(channel, { target: { value: 'MANAGER_REFERRAL' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(createAsync).toHaveBeenCalledTimes(1));
    expect(createAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        personId: 'person-1',
        requestedMode: 'REDUCED_SCHEDULE',
        intakeChannel: 'MANAGER_REFERRAL',
      }),
    );
  });

  it('offers the intake channel only to administrators', async () => {
    authRoles.current = ['Employee'];
    renderWizard();
    expect(screen.queryByLabelText('Intake channel')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Subject person'), { target: { value: 'person-1' } });
    fireEvent.change(screen.getByLabelText('Reason category'), {
      target: { value: 'Medical leave' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(createAsync).toHaveBeenCalledTimes(1));
    expect(createAsync).toHaveBeenCalledWith(
      expect.objectContaining({ requestedMode: 'CONTINUOUS', intakeChannel: null }),
    );
  });

  it('no longer asks whether a designated person was selected', () => {
    renderWizard('/leaves/case-1/intake');
    expect(screen.queryByLabelText(/designated person selected/i)).not.toBeInTheDocument();
  });

  describe('as a popup with save and resume', () => {
    it('opens as a dialog over the page', () => {
      renderWizard();
      expect(screen.getByRole('dialog', { name: 'Guided Leave Intake' })).toBeInTheDocument();
    });

    it('saves the step and every value, the evaluation reason code included', async () => {
      renderWizard();
      fireEvent.change(screen.getByLabelText('Subject person'), { target: { value: 'person-1' } });
      fireEvent.change(screen.getByLabelText('Reason category'), {
        target: { value: 'Family care' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
      await waitFor(() => expect(draftController.current.save).toHaveBeenCalledTimes(1));
      const saved = draftController.current.save.mock.calls[0][0];
      expect(saved.stepKey).toBe('basics');
      expect(saved.payload.basics).toMatchObject({
        personId: 'person-1',
        reasonCategory: 'Family care',
        reasonCode: 'OWN_SERIOUS_HEALTH_CONDITION',
      });
      expect(saved.payload).toMatchObject({ overrideReasons: {}, overrideOutcomes: {} });
      expect(screen.queryByText(/not saved in drafts/)).not.toBeInTheDocument();
    });

    it('restores the override reason and outcome on Resume Draft', () => {
      draftController.current.draft = {
        payload: {
          results: [result],
          snapshotId: 'snapshot-1',
          overrideReasons: { [result.determination_id]: 'Hours log corrected by payroll' },
          overrideOutcomes: { [result.determination_id]: 'INELIGIBLE' },
        },
        stepKey: 'confirm',
        updatedAt: '2026-11-20T10:00:00Z',
      };
      renderWizard('/leaves/case-1/intake');
      fireEvent.click(screen.getByRole('button', { name: 'Resume Draft' }));
      expect(screen.getByPlaceholderText('Reason for override')).toHaveValue(
        'Hours log corrected by payroll',
      );
      expect(screen.getByDisplayValue('INELIGIBLE')).toBeInTheDocument();
    });

    it('resumes the saved values on the saved step', () => {
      draftController.current.draft = {
        payload: {
          facts: { employerEmployeeCount: '75', scheduledWeeklyHours: '32' },
          results: [result],
          snapshotId: 'snapshot-1',
        },
        stepKey: 'confirm',
        updatedAt: '2026-11-20T10:00:00Z',
      };
      renderWizard('/leaves/case-1/intake');
      fireEvent.click(screen.getByRole('button', { name: 'Resume Draft' }));
      expect(screen.getByRole('button', { name: 'Confirm all as evaluated' })).toBeInTheDocument();
      expect(screen.getByText(/snapshot-1/)).toBeInTheDocument();
    });

    it('restores entered facts when resuming on the facts step', () => {
      draftController.current.draft = {
        payload: { facts: { employerEmployeeCount: '75', scheduledWeeklyHours: '32' } },
        stepKey: 'facts',
        updatedAt: '2026-11-20T10:00:00Z',
      };
      renderWizard('/leaves/case-1/intake');
      expect(screen.getByLabelText('Employer employee count')).toHaveValue(null);
      fireEvent.click(screen.getByRole('button', { name: 'Resume Draft' }));
      expect(screen.getByLabelText('Employer employee count')).toHaveValue(75);
      expect(screen.getByLabelText('Scheduled weekly hours')).toHaveValue(32);
    });

    it('discards the draft when the intake is completed', async () => {
      renderWizard('/leaves/case-1/intake');
      enterFacts();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm all as evaluated' }));
      await waitFor(() => expect(confirmAsync).toHaveBeenCalled());
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      await waitFor(() => expect(draftController.current.discard).toHaveBeenCalled());
      await waitFor(() => expect(navigate).toHaveBeenCalledWith('/leaves/case-1'));
    });

    it('closes back to the case for an existing case and to the list for a new one', () => {
      const { unmount } = renderWizard('/leaves/case-1/intake');
      fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
      expect(navigate).toHaveBeenLastCalledWith('/leaves/case-1');
      unmount();
      renderWizard();
      fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
      expect(navigate).toHaveBeenLastCalledWith('/leaves');
    });
  });
});
