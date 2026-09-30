import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CASE_ID = 'd4b91e60-2c73-4a58-9e1f-6a0c8d35b27e';

const { evaluateAsync } = vi.hoisted(() => ({ evaluateAsync: vi.fn() }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ authUserId: 'user-1', profile: { companyId: null }, roles: ['HR Partner'] }),
}));

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: { listTemplates: vi.fn().mockResolvedValue([]) },
}));

function mutation(mutateAsync: (input: never) => Promise<unknown> = vi.fn()) {
  return { mutateAsync, isPending: false };
}

vi.mock('../WorkflowHook', () => ({
  useMhdLeaveWorkflow: () => ({
    isLoading: false,
    data: { eligibility: [], notices: [], segments: [], events: [], benefits: [], returnToWork: [] },
  }),
  useMhdLeaveReadiness: () => ({ data: undefined }),
  useMhdLeaveEligibility: () => mutation(evaluateAsync),
  useMhdConfirmLeaveEligibility: () => mutation(),
  useMhdOverrideLeaveEligibility: () => mutation(),
  useMhdLeaveEvent: () => mutation(),
  useMhdLeaveReturnToWork: () => mutation(),
  useMhdLeaveNotice: () => mutation(),
  useMhdLeaveNoticeDelivery: () => mutation(),
}));

const { MhdLeaveWorkflowPanel } = await import('../components/MhdLeaveWorkflowPanel');

const LABELS = {
  weekly: 'Scheduled weekly hours',
  employer: 'Employer employee count',
  worksite: 'FMLA worksite count within 75 miles',
  months: 'Months of service',
  hours: 'Hours worked in prior 12 months',
};

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MhdLeaveWorkflowPanel caseId={CASE_ID} privileged />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function enterFacts() {
  fireEvent.change(screen.getByLabelText(LABELS.weekly), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText(LABELS.employer), { target: { value: '62' } });
  fireEvent.change(screen.getByLabelText(LABELS.worksite), { target: { value: '58' } });
  fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '19' } });
  fireEvent.change(screen.getByLabelText(LABELS.hours), { target: { value: '1310' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  evaluateAsync.mockResolvedValue([]);
});

describe('MhdLeaveWorkflowPanel eligibility facts', () => {
  it('assumes no employer or service fact and cannot evaluate until each is entered', () => {
    renderPanel();
    for (const label of Object.values(LABELS)) {
      expect(screen.getByLabelText(label)).toHaveValue(null);
    }
    expect(screen.getByText(/none are assumed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evaluate all bases' })).toBeDisabled();
  });

  it('stays disabled for a negative count or zero weekly hours', () => {
    renderPanel();
    enterFacts();
    expect(screen.getByRole('button', { name: 'Evaluate all bases' })).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: 'Evaluate all bases' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(LABELS.months), { target: { value: '19' } });
    fireEvent.change(screen.getByLabelText(LABELS.weekly), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Evaluate all bases' })).toBeDisabled();
  });

  it('sends exactly the facts that were entered', async () => {
    renderPanel();
    enterFacts();
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate all bases' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    expect(evaluateAsync.mock.calls[0][0]).toMatchObject({
      caseId: CASE_ID,
      employerEmployeeCount: 62,
      worksiteEmployeeCount75: 58,
      monthsOfService: 19,
      hoursWorked12Months: 1310,
      scheduledWeeklyHours: 30,
    });
  });
});
