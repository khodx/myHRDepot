import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { checkInMock, checkOutMock, overrideMock } = vi.hoisted(() => ({
  checkInMock: vi.fn().mockResolvedValue(undefined),
  checkOutMock: vi.fn().mockResolvedValue(undefined),
  overrideMock: vi.fn().mockResolvedValue(undefined),
}));
const { sessionsMock, rosterMock, peopleMock, coursesMock } = vi.hoisted(() => ({
  sessionsMock: vi.fn(),
  rosterMock: vi.fn(),
  peopleMock: vi.fn(),
  coursesMock: vi.fn(),
}));
const noopMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };

vi.mock('../Hook', () => ({
  useMhdTrainingIltSessionsByCompany: sessionsMock,
  useMhdCreateTrainingIltSession: () => noopMutation,
  useMhdTrainingIltRoster: rosterMock,
  useMhdTrainingPeople: peopleMock,
  useMhdTrainingCourses: coursesMock,
  useMhdEnrollTrainingIlt: () => noopMutation,
  useMhdCancelTrainingIltEnrollment: () => noopMutation,
  useMhdCheckInTrainingIlt: () => ({ mutateAsync: checkInMock, isPending: false }),
  useMhdCheckOutTrainingIlt: () => ({ mutateAsync: checkOutMock, isPending: false }),
  useMhdOverrideTrainingIltAttendance: () => ({ mutateAsync: overrideMock, isPending: false }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdIltSessionAdminPage } = await import('../components/MhdIltSessionAdminPage');

function session(overrides = {}) {
  return {
    id: 's1', referenceId: 'ILT-0001', courseId: 'c1', courseTitle: 'Forklift Safety',
    sessionDate: '2026-10-05', startTime: '09:00:00', endTime: '11:00:00', instructorName: 'Rowan Delgado',
    roomOrResourceLabel: 'Bay 3', capacity: 4, meetingProvider: 'NONE', isCancelled: false,
    enrolledCount: 1, waitlistedCount: 0, ...overrides,
  };
}

describe('MhdIltSessionAdminPage', () => {
  it("attaches the roster panel directly below the session row that opened it, not at the table's end", async () => {
    sessionsMock.mockReturnValue({ data: [session({ id: 's1', courseTitle: 'Forklift Safety' }), session({ id: 's2', courseTitle: 'Fire Safety' })], isLoading: false, error: null });
    rosterMock.mockReturnValue({ data: [], isLoading: false, error: null });
    peopleMock.mockReturnValue({ data: [] });
    coursesMock.mockReturnValue({ data: [] });
    render(<MhdIltSessionAdminPage />);

    const forkliftRow = screen.getByText('Forklift Safety').closest('tr') as HTMLElement;
    await userEvent.click(within(forkliftRow).getByRole('button', { name: 'Manage roster' }));

    const rosterMessage = await screen.findByText('No one is enrolled in this session yet.');
    // The roster row must be the very next sibling row after Forklift Safety's row,
    // not appended after every session row regardless of which was clicked.
    expect(forkliftRow.nextElementSibling?.contains(rosterMessage)).toBe(true);
  });

  it('only offers Check in for an enrolled person with no check-in yet, and Check out only after check-in', async () => {
    sessionsMock.mockReturnValue({ data: [session()], isLoading: false, error: null });
    rosterMock.mockReturnValue({
      data: [
        { enrollmentId: 'e1', personId: 'p1', personDisplayName: 'Harper Garcia', status: 'ENROLLED', enrolledAt: 'now', checkInAt: null, checkOutAt: null, attendanceSource: null, overrideReason: null },
        { enrollmentId: 'e2', personId: 'p2', personDisplayName: 'Casey Okafor', status: 'ENROLLED', enrolledAt: 'now', checkInAt: 'now', checkOutAt: null, attendanceSource: 'MANUAL', overrideReason: null },
      ],
      isLoading: false,
      error: null,
    });
    peopleMock.mockReturnValue({ data: [] });
    coursesMock.mockReturnValue({ data: [] });
    render(<MhdIltSessionAdminPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Manage roster' }));

    const harperRow = screen.getByText('Harper Garcia').closest('tr') as HTMLElement;
    const caseyRow = screen.getByText('Casey Okafor').closest('tr') as HTMLElement;
    expect(within(harperRow).getByRole('button', { name: 'Check in' })).toBeInTheDocument();
    expect(within(harperRow).queryByRole('button', { name: 'Check out' })).toBeNull();
    expect(within(caseyRow).queryByRole('button', { name: 'Check in' })).toBeNull();
    expect(within(caseyRow).getByRole('button', { name: 'Check out' })).toBeInTheDocument();
  });

  it('requires a reason for an attendance override', async () => {
    sessionsMock.mockReturnValue({ data: [session()], isLoading: false, error: null });
    rosterMock.mockReturnValue({
      data: [{ enrollmentId: 'e1', personId: 'p1', personDisplayName: 'Harper Garcia', status: 'ENROLLED', enrolledAt: 'now', checkInAt: null, checkOutAt: null, attendanceSource: null, overrideReason: null }],
      isLoading: false,
      error: null,
    });
    peopleMock.mockReturnValue({ data: [] });
    coursesMock.mockReturnValue({ data: [] });
    render(<MhdIltSessionAdminPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Manage roster' }));

    await userEvent.click(screen.getByRole('button', { name: 'Attendance override' }));
    await userEvent.type(screen.getByLabelText('Check-in timestamp'), '2026-10-05T09:00');
    await userEvent.type(screen.getByLabelText('Check-out timestamp'), '2026-10-05T11:00');
    await userEvent.click(screen.getByRole('button', { name: 'Save override' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A reason is required for an attendance override.');
    expect(overrideMock).not.toHaveBeenCalled();
  });
});
