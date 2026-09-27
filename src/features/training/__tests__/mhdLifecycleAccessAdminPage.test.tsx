import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MhdTrainingCourse } from '../Types';

const {
  coursesMock,
  licensesMock,
  grantsMock,
  timeOnTaskMock,
  retireMock,
  setLicenseMock,
  createGrantMock,
  revokeGrantMock,
  setTimeOnTaskMock,
} = vi.hoisted(() => ({
  coursesMock: vi.fn(),
  licensesMock: vi.fn(),
  grantsMock: vi.fn(),
  timeOnTaskMock: vi.fn(),
  retireMock: vi.fn().mockResolvedValue(undefined),
  setLicenseMock: vi.fn().mockResolvedValue(undefined),
  createGrantMock: vi.fn().mockResolvedValue(undefined),
  revokeGrantMock: vi.fn().mockResolvedValue(undefined),
  setTimeOnTaskMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../Hook', () => ({
  useMhdTrainingCourses: coursesMock,
  useMhdTrainingContentLicenses: licensesMock,
  useMhdTrainingExternalAuditorGrants: grantsMock,
  useMhdTrainingTimeOnTaskSettings: timeOnTaskMock,
  useMhdRetireTrainingCourse: () => ({ mutateAsync: retireMock, isPending: false }),
  useMhdSetTrainingContentLicense: () => ({ mutateAsync: setLicenseMock, isPending: false }),
  useMhdCreateTrainingExternalAuditorGrant: () => ({ mutateAsync: createGrantMock, isPending: false }),
  useMhdRevokeTrainingExternalAuditorGrant: () => ({ mutateAsync: revokeGrantMock, isPending: false }),
  useMhdSetTrainingTimeOnTask: () => ({ mutateAsync: setTimeOnTaskMock, isPending: false }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdLifecycleAccessAdminPage } = await import('../components/MhdLifecycleAccessAdminPage');

function course(overrides: Partial<MhdTrainingCourse>): MhdTrainingCourse {
  return {
    id: 'course-1',
    referenceId: 'TRN-0001',
    companyId: 'company-1',
    courseKey: 'key',
    title: 'Course',
    description: null,
    category: 'OTHER',
    deliveryMode: 'DOCUMENT',
    durationMinutes: null,
    recurrenceMonths: null,
    requiresEvidence: false,
    externalUrl: null,
    isActive: true,
    isGlobal: false,
    contentMode: 'EVIDENCE_ONLY',
    programId: null,
    templateId: null,
    sourceCourseId: null,
    forkState: 'FORKED',
    contentVersion: 1,
    approvalStatus: 'PUBLISHED',
    retiredAt: null,
    successorCourseId: null,
    successorCourseTitle: null,
    ...overrides,
  };
}

function setDefaultMocks() {
  licensesMock.mockReturnValue({ data: [], isLoading: false, error: null });
  grantsMock.mockReturnValue({ data: [], isLoading: false, error: null });
  timeOnTaskMock.mockReturnValue({ data: { maxSessionMinutes: 480, updatedAt: null }, isLoading: false, error: null });
}

describe('MhdLifecycleAccessAdminPage — Course Retirement', () => {
  it('hides the Retire action for a global course and offers it for an active company course', () => {
    setDefaultMocks();
    coursesMock.mockReturnValue({
      data: [
        course({ id: 'global-1', title: 'Global Orientation', isGlobal: true }),
        course({ id: 'company-1c', title: 'Local Onboarding', isGlobal: false }),
      ],
      isLoading: false,
      error: null,
    });
    render(<MhdLifecycleAccessAdminPage />);

    // Only company-owned courses appear on the Retirement tab at all.
    expect(screen.queryByText('Global Orientation')).toBeNull();
    const row = screen.getByText('Local Onboarding').closest('tr') as HTMLElement;
    expect(within(row).getByRole('button', { name: 'Retire' })).toBeInTheDocument();
  });

  it('shows a retired course\'s successor and no further action, with no way to un-retire', () => {
    setDefaultMocks();
    coursesMock.mockReturnValue({
      data: [
        course({ id: 'old', title: 'Old Ethics Course', retiredAt: '2026-08-01T00:00:00Z', successorCourseTitle: 'New Ethics Course' }),
      ],
      isLoading: false,
      error: null,
    });
    render(<MhdLifecycleAccessAdminPage />);

    const row = screen.getByText('Old Ethics Course').closest('tr') as HTMLElement;
    expect(within(row).getByText('New Ethics Course')).toBeInTheDocument();
    expect(within(row).queryByRole('button')).toBeNull();
  });

  it("the successor picker excludes the course itself and already-retired courses", async () => {
    setDefaultMocks();
    coursesMock.mockReturnValue({
      data: [
        course({ id: 'a', title: 'Course A' }),
        course({ id: 'b', title: 'Course B', retiredAt: '2026-08-01T00:00:00Z' }),
      ],
      isLoading: false,
      error: null,
    });
    render(<MhdLifecycleAccessAdminPage />);

    const row = screen.getByText('Course A').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Retire' }));

    const select = screen.getByLabelText('Successor course (optional)') as HTMLSelectElement;
    const options = within(select).getAllByRole('option').map((option) => option.textContent);
    expect(options).not.toContain('Course A');
    expect(options).not.toContain('Course B');
  });
});

describe('MhdLifecycleAccessAdminPage — Content Licensing', () => {
  it('lists only global courses and shows Unrestricted when no license row exists', async () => {
    setDefaultMocks();
    coursesMock.mockReturnValue({
      data: [
        course({ id: 'g1', title: 'Global Compliance', isGlobal: true }),
        course({ id: 'c1', title: 'Local Course', isGlobal: false }),
      ],
      isLoading: false,
      error: null,
    });
    render(<MhdLifecycleAccessAdminPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Content Licensing' }));

    expect(screen.getByText('Global Compliance')).toBeInTheDocument();
    expect(screen.queryByText('Local Course')).toBeNull();
    expect(screen.getByText('Unrestricted')).toBeInTheDocument();
  });
});

describe('MhdLifecycleAccessAdminPage — External Auditor Grants', () => {
  it('derives Active/Revoked/Expired status from real fields and hides Revoke once inactive', async () => {
    setDefaultMocks();
    coursesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    grantsMock.mockReturnValue({
      data: [
        { id: 'g1', referenceId: 'EAG-0001', courseId: 'c1', courseTitle: 'Course A', auditorLabel: 'OSHA', validFrom: '2026-01-01T00:00:00Z', validUntil: '2099-01-01T00:00:00Z', revokedAt: null, createdAt: '2026-01-01T00:00:00Z' },
        { id: 'g2', referenceId: 'EAG-0002', courseId: 'c1', courseTitle: 'Course A', auditorLabel: 'DOL', validFrom: '2026-01-01T00:00:00Z', validUntil: '2099-01-01T00:00:00Z', revokedAt: '2026-02-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'g3', referenceId: 'EAG-0003', courseId: 'c1', courseTitle: 'Course A', auditorLabel: 'State board', validFrom: '2020-01-01T00:00:00Z', validUntil: '2020-06-01T00:00:00Z', revokedAt: null, createdAt: '2020-01-01T00:00:00Z' },
      ],
      isLoading: false,
      error: null,
    });
    render(<MhdLifecycleAccessAdminPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'External Auditor Grants' }));

    const activeRow = screen.getByText('OSHA').closest('tr') as HTMLElement;
    const revokedRow = screen.getByText('DOL').closest('tr') as HTMLElement;
    const expiredRow = screen.getByText('State board').closest('tr') as HTMLElement;

    expect(within(activeRow).getByText('Active')).toBeInTheDocument();
    expect(within(activeRow).getByRole('button', { name: 'Revoke' })).toBeInTheDocument();

    expect(within(revokedRow).getByText('Revoked')).toBeInTheDocument();
    expect(within(revokedRow).queryByRole('button', { name: 'Revoke' })).toBeNull();

    expect(within(expiredRow).getByText('Expired')).toBeInTheDocument();
    expect(within(expiredRow).queryByRole('button', { name: 'Revoke' })).toBeNull();
  });
});

describe('MhdLifecycleAccessAdminPage — Time-on-Task', () => {
  it('prefills the current cap and saves a new one', async () => {
    coursesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    licensesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    grantsMock.mockReturnValue({ data: [], isLoading: false, error: null });
    timeOnTaskMock.mockReturnValue({ data: { maxSessionMinutes: 240, updatedAt: '2026-09-01T00:00:00Z' }, isLoading: false, error: null });
    render(<MhdLifecycleAccessAdminPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Time-on-Task' }));

    const input = screen.getByLabelText('Maximum session minutes') as HTMLInputElement;
    expect(input.value).toBe('240');

    await userEvent.clear(input);
    await userEvent.type(input, '120');
    await userEvent.click(screen.getByRole('button', { name: 'Save cap' }));

    expect(setTimeOnTaskMock).toHaveBeenCalledWith({ companyId: 'company-1', maxSessionMinutes: 120 });
  });
});
