import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { optInMock } = vi.hoisted(() => ({ optInMock: vi.fn() }));

vi.mock('../Hook', () => ({
  useMhdCompleteTraining: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
  useMhdSetTrainingLeaderboardOptIn: () => ({
    mutateAsync: optInMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useMhdTrainingAssignments: () => ({ data: [] }),
  useMhdTrainingCompletions: () => ({ data: [] }),
  useMhdTrainingCourses: () => ({ data: [] }),
}));

const { MhdMyTrainingPage } = await import('../components/MhdMyTrainingPage');

describe('MhdMyTrainingPage — leaderboard opt-in', () => {
  it('opts in without claiming to know current status, and confirms success', async () => {
    optInMock.mockResolvedValue(undefined);
    render(<MhdMyTrainingPage companyId="company-1" personId="person-1" />);

    expect(
      screen.getByText(/current opt-in status cannot be shown here yet/),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Join the leaderboard' }));

    expect(optInMock).toHaveBeenCalledWith({ optedIn: true });
    expect(await screen.findByText("You're now opted in.")).toBeInTheDocument();
  });

  it('opts out and confirms with the matching message', async () => {
    optInMock.mockResolvedValue(undefined);
    render(<MhdMyTrainingPage companyId="company-1" personId="person-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Leave the leaderboard' }));

    expect(optInMock).toHaveBeenCalledWith({ optedIn: false });
    expect(await screen.findByText("You're now opted out.")).toBeInTheDocument();
  });
});
