import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MhdMyGrievance } from '../Types';

const { grievancesMock, submitMock, withdrawMock } = vi.hoisted(() => ({
  grievancesMock: vi.fn(),
  submitMock: vi.fn().mockResolvedValue('new-grievance-id'),
  withdrawMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../Hook', () => ({
  useMhdMyGrievances: grievancesMock,
  useMhdSubmitGrievance: () => ({ mutateAsync: submitMock, isPending: false }),
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

describe('MhdMyGrievancesPage', () => {
  it('shows an honest empty state before any grievance has been filed', () => {
    grievancesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdMyGrievancesPage />);

    expect(screen.getByText('You have not filed a grievance.')).toBeInTheDocument();
  });

  it('refuses to submit without the required fields', async () => {
    grievancesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdMyGrievancesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'File A Grievance' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit Grievance' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'What happened, why you disagree, the remedy requested, and your signature are all required.',
    );
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('submits a complete grievance with the signed-in person and company', async () => {
    grievancesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdMyGrievancesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'File A Grievance' }));
    await userEvent.type(screen.getByLabelText('What happened'), 'What happened');
    await userEvent.type(screen.getByLabelText('Why you disagree with what happened'), 'Why I disagree');
    await userEvent.type(screen.getByLabelText('The remedy you are requesting'), 'The remedy');
    await userEvent.type(screen.getByLabelText('Your signature (type your full name)'), 'Dana Doe');
    await userEvent.click(screen.getByRole('button', { name: 'Submit Grievance' }));

    expect(submitMock).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'company-1',
      personId: 'person-1',
      grievanceWhat: 'What happened',
      disagreementExplanation: 'Why I disagree',
      remedyRequested: 'The remedy',
      employeeSignatureName: 'Dana Doe',
      isHarassmentRelated: false,
    }));
  });

  it('offers Withdraw for an open grievance but not for a closed one', () => {
    grievancesMock.mockReturnValue({
      data: [
        myGrievance({ id: 'open', status: 'ACKNOWLEDGED' }),
        myGrievance({ id: 'closed', status: 'RESOLVED', resolutionAt: '2026-09-05T00:00:00Z', closedAt: '2026-09-05T00:00:00Z' }),
      ],
      isLoading: false,
      error: null,
    });
    render(<MhdMyGrievancesPage />);

    expect(screen.getAllByRole('button', { name: 'Withdraw' })).toHaveLength(1);
  });

  it('withdraws an open grievance after confirmation', async () => {
    grievancesMock.mockReturnValue({ data: [myGrievance({ status: 'SUBMITTED' })], isLoading: false, error: null });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MhdMyGrievancesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

    expect(withdrawMock).toHaveBeenCalledWith('g1');
  });
});
