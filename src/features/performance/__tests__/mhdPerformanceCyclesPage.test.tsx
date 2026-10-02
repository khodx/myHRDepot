import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MhdPerformanceCyclesPage from '../Components/MhdPerformanceCyclesPage';

const state = vi.hoisted(() => ({
  cycles: [] as Array<Record<string, unknown>>,
  loading: false,
  error: null as Error | null,
  closeCycle: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-northstar' } }),
}));

vi.mock('../Hook-cycles', () => ({
  useMhdPerformanceCycles: () => ({
    data: state.cycles,
    isLoading: state.loading,
    isError: state.error !== null,
    error: state.error,
  }),
  useMhdPerformanceCycleProgress: () => ({
    isLoading: false,
    isError: false,
    data: {
      reviewsByStatus: { DRAFT: 4, COMPLETED: 8 },
      participants: [{ participantType: 'PEER', status: 'INVITED', count: 6 }],
      selfAssessmentsOverdue: 2,
      feedbackOverdue: 5,
      reviewsOverdue: 1,
    },
  }),
  useMhdClosePerformanceCycle: () => ({
    mutateAsync: state.closeCycle,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const ACTIVE_CYCLE = {
  id: 'cycle-annual',
  referenceId: '4D8-6-2D8C-F-B7',
  cycleName: '2026 Annual Reviews',
  reviewType: 'ANNUAL',
  reviewPeriodStart: '2026-01-01',
  reviewPeriodEnd: '2026-12-31',
  selfAssessmentDue: '2027-01-15',
  feedbackDue: null,
  reviewDue: '2027-02-05',
  status: 'ACTIVE',
  templateName: null,
  isMultiRater: true,
  launchedAt: '2026-12-20T17:00:00Z',
  reviewCount: 12,
  completedCount: 8,
  overdueCount: 1,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdPerformanceCyclesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.cycles = [ACTIVE_CYCLE];
  state.loading = false;
  state.error = null;
  state.closeCycle.mockReset().mockResolvedValue(undefined);
});

describe('MhdPerformanceCyclesPage', () => {
  it('lists the cycles with their progress counts and links to the wizard', () => {
    renderPage();
    expect(screen.getByText('2026 Annual Reviews')).toBeInTheDocument();
    expect(screen.getByText('8 of 12')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Cycle' })).toHaveAttribute(
      'href',
      '/performance/cycles/new',
    );
  });

  it('shows an empty state, a loading state and a load failure', () => {
    state.cycles = [];
    const empty = renderPage();
    expect(screen.getByText('No review cycles yet.')).toBeInTheDocument();
    empty.unmount();

    state.loading = true;
    const loading = renderPage();
    expect(screen.getByText('Loading review cycles…')).toBeInTheDocument();
    loading.unmount();

    state.loading = false;
    state.error = new Error('Unable to load review cycles: permission denied');
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('permission denied');
  });

  it('shows the progress of the chosen cycle and hides it again', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await user.click(screen.getByRole('button', { name: 'View Progress' }));
    expect(screen.getByText('2026 Annual Reviews — Progress')).toBeInTheDocument();
    expect(screen.getByText('Self-assessments overdue')).toBeInTheDocument();
    expect(screen.getByText('Feedback overdue')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hide Progress' }));
    expect(screen.queryByText('2026 Annual Reviews — Progress')).not.toBeInTheDocument();
  });

  it('asks to confirm before closing an active cycle', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await user.click(screen.getByRole('button', { name: 'View Progress' }));
    await user.click(screen.getByRole('button', { name: 'Close Cycle' }));
    expect(screen.getByText('Close this cycle? This cannot be undone.')).toBeInTheDocument();
    expect(state.closeCycle).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Keep Open' }));
    expect(state.closeCycle).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close Cycle' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Close' }));
    await waitFor(() => expect(state.closeCycle).toHaveBeenCalledWith('cycle-annual'));
  });

  it('offers no close action for a cycle that is already closed', async () => {
    state.cycles = [{ ...ACTIVE_CYCLE, status: 'CLOSED' }];
    const user = userEvent.setup({ delay: null });
    renderPage();
    await user.click(screen.getByRole('button', { name: 'View Progress' }));
    expect(screen.queryByRole('button', { name: 'Close Cycle' })).not.toBeInTheDocument();
  });
});
