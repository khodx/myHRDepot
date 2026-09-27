import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { rulesMock, coursesMock, requestsMock, peopleMock, teamStatusMock } = vi.hoisted(() => ({
  rulesMock: vi.fn(),
  coursesMock: vi.fn(),
  requestsMock: vi.fn(),
  peopleMock: vi.fn(),
  teamStatusMock: vi.fn(),
}));
const noopMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };

vi.mock('../Hook', () => ({
  useMhdTrainingComplianceRules: rulesMock,
  useMhdCreateTrainingComplianceRule: () => noopMutation,
  useMhdApplyTrainingComplianceRule: () => noopMutation,
  useMhdTrainingSelfEnrollments: requestsMock,
  useMhdDecideTrainingSelfEnrollment: () => noopMutation,
  useMhdTrainingManagerTeamStatus: teamStatusMock,
  useMhdTrainingPeople: peopleMock,
  useMhdTrainingCourses: coursesMock,
}));

vi.mock('@/features/jobs/Hook', () => ({
  useMhdJobs: () => ({ data: [] }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdComplianceAdminPage } = await import('../components/MhdComplianceAdminPage');

describe('MhdComplianceAdminPage', () => {
  it('the target-type picker excludes JURISDICTION with an honest caption', async () => {
    rulesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    coursesMock.mockReturnValue({ data: [] });
    render(<MhdComplianceAdminPage />);

    await userEvent.click(screen.getByRole('button', { name: 'New Rule' }));

    const select = screen.getByLabelText('Target type') as HTMLSelectElement;
    const options = within(select).getAllByRole('option').map((option) => option.textContent);
    expect(options).not.toContain('Jurisdiction');
    expect(screen.getByText(/Jurisdiction-based targeting is not supported/)).toBeInTheDocument();
  });

  it('shows no edit or delete affordance for compliance rules (backend is create-only)', () => {
    rulesMock.mockReturnValue({
      data: [{ id: 'r1', referenceId: 'CMR-0001', companyId: 'company-1', title: 'Rule', targetType: 'ORG_UNIT', targetDepartment: 'Sales', targetJobId: null, targetJurisdiction: null, courseId: 'c1', courseTitle: 'Ethics', dueOffsetDays: 30, isActive: true }],
      isLoading: false,
      error: null,
    });
    coursesMock.mockReturnValue({ data: [] });
    render(<MhdComplianceAdminPage />);

    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.getByText('Apply now')).toBeInTheDocument();
  });

  it('defaults the self-enrollment request filter to Pending', () => {
    rulesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    coursesMock.mockReturnValue({ data: [] });
    requestsMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdComplianceAdminPage />);

    expect(requestsMock).toHaveBeenCalledWith({ companyId: 'company-1', status: 'PENDING' });
  });

  it('shows the choose-a-manager prompt before any manager is selected', async () => {
    rulesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    coursesMock.mockReturnValue({ data: [] });
    peopleMock.mockReturnValue({ data: [{ id: 'p1', displayName: 'Avery Nguyen' }] });
    teamStatusMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdComplianceAdminPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Manager Team Status' }));

    expect(screen.getByText("Choose a manager to see their team's training status.")).toBeInTheDocument();
  });
});
