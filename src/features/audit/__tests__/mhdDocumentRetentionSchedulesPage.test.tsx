import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { schedulesMock } = vi.hoisted(() => ({ schedulesMock: vi.fn() }));

vi.mock('../Hook', () => ({
  useMhdDocumentRetentionSchedules: schedulesMock,
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdDocumentRetentionSchedulesPage } = await import('../components/MhdDocumentRetentionSchedulesPage');

describe('MhdDocumentRetentionSchedulesPage', () => {
  it('shows an honest empty state when nothing is on file yet', () => {
    schedulesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdDocumentRetentionSchedulesPage />);

    expect(screen.getByText('No retention schedules are on file yet.')).toBeInTheDocument();
  });

  it('lists a real retention schedule row', () => {
    schedulesMock.mockReturnValue({
      data: [
        {
          id: 's1',
          entityType: 'I9_RECORD',
          entityId: 'i9-1',
          retentionBasis: 'IRCA: 3 years from hire or 1 year from termination, whichever is later',
          retentionExpiresAt: '2029-01-15',
          computedAt: '2026-01-15T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<MhdDocumentRetentionSchedulesPage />);

    expect(screen.getByText('I9_RECORD')).toBeInTheDocument();
    expect(screen.getByText(/IRCA: 3 years from hire/)).toBeInTheDocument();
  });
});
