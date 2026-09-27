import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { leaderboardMock } = vi.hoisted(() => ({ leaderboardMock: vi.fn() }));

vi.mock('../Hook', () => ({
  useMhdTrainingLeaderboard: leaderboardMock,
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdTrainingLeaderboardPage } = await import('../components/MhdTrainingLeaderboardPage');

describe('MhdTrainingLeaderboardPage', () => {
  it('renders ranked rows with points and streak from the real data, in the order returned', () => {
    leaderboardMock.mockReturnValue({
      data: [
        { personId: 'p1', personDisplayName: 'Priya Natarajan', totalPoints: 140, currentStreakDays: 6 },
        { personId: 'p2', personDisplayName: 'Diego Alvarez', totalPoints: 95, currentStreakDays: 2 },
      ],
      isLoading: false,
    });
    render(<MhdTrainingLeaderboardPage />);

    const rows = screen.getAllByRole('row').slice(1); // skip header row
    expect(rows[0]).toHaveTextContent('1');
    expect(rows[0]).toHaveTextContent('Priya Natarajan');
    expect(rows[0]).toHaveTextContent('140');
    expect(rows[0]).toHaveTextContent('6');
    expect(rows[1]).toHaveTextContent('2');
    expect(rows[1]).toHaveTextContent('Diego Alvarez');
  });

  it('shows an honest empty state when no one has opted in', () => {
    leaderboardMock.mockReturnValue({ data: [], isLoading: false });
    render(<MhdTrainingLeaderboardPage />);

    expect(screen.getByText('No one has opted in to the leaderboard yet.')).toBeInTheDocument();
  });
});
