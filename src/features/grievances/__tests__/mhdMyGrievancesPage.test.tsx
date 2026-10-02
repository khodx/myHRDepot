import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { MhdMyGrievance } from '../Types';

const { grievancesMock, withdrawMock } = vi.hoisted(() => ({
  grievancesMock: vi.fn(),
  withdrawMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../Hook', () => ({
  useMhdMyGrievances: grievancesMock,
  useMhdWithdrawGrievance: () => ({ mutateAsync: withdrawMock, isPending: false }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1', personId: 'person-1' } }),
}));

const { MhdMyGrievancesPage } = await import('../components/MhdMyGrievancesPage');

function myGrievance(overrides: Partial<MhdMyGrievance>): MhdMyGrievance {
  return {
    id: 'g1',
    referenceId: 'GRV-000001',
    status: 'SUBMITTED',
    submittedAt: '2026-09-01T00:00:00Z',
    acknowledgedAt: null,
    referredToProcess: null,
    resolutionAt: null,
    closedAt: null,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdMyGrievancesPage />
    </MemoryRouter>,
  );
}

describe('MhdMyGrievancesPage', () => {
  it('shows an honest empty state before any grievance has been filed', () => {
    grievancesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    renderPage();

    expect(screen.getByText('You have not filed a grievance.')).toBeInTheDocument();
  });

  it('sends filing to the guided wizard instead of a modal form', () => {
    grievancesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    renderPage();

    expect(screen.getByRole('link', { name: 'File A Grievance' })).toHaveAttribute(
      'href',
      '/my-grievances/new',
    );
  });

  it('offers Withdraw for an open grievance but not for a closed one', () => {
    grievancesMock.mockReturnValue({
      data: [
        myGrievance({ id: 'open', status: 'ACKNOWLEDGED' }),
        myGrievance({
          id: 'closed',
          status: 'RESOLVED',
          resolutionAt: '2026-09-05T00:00:00Z',
          closedAt: '2026-09-05T00:00:00Z',
        }),
      ],
      isLoading: false,
      error: null,
    });
    renderPage();

    expect(screen.getAllByRole('button', { name: 'Withdraw' })).toHaveLength(1);
  });

  it('withdraws an open grievance after confirmation', async () => {
    grievancesMock.mockReturnValue({
      data: [myGrievance({ status: 'SUBMITTED' })],
      isLoading: false,
      error: null,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

    expect(withdrawMock).toHaveBeenCalledWith('g1');
  });
});
