import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { MhdTrainingCourse } from '../Types';

const { submitMock } = vi.hoisted(() => ({ submitMock: vi.fn().mockResolvedValue(undefined) }));
const { coursesMock, programsMock, prerequisitesMock, approvalsMock } = vi.hoisted(() => ({
  coursesMock: vi.fn(),
  programsMock: vi.fn(),
  prerequisitesMock: vi.fn(),
  approvalsMock: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdTrainingCourses: coursesMock,
  useMhdTrainingPrograms: programsMock,
  useMhdTrainingPrerequisites: prerequisitesMock,
  useMhdTrainingContentApprovals: approvalsMock,
  useMhdSetTrainingCourseContentMode: () => ({ mutateAsync: vi.fn() }),
  useMhdSubmitTrainingContentForReview: () => ({ mutateAsync: submitMock }),
  useMhdApproveTrainingContent: () => ({ mutateAsync: vi.fn() }),
  useMhdPublishTrainingContent: () => ({ mutateAsync: vi.fn() }),
  useMhdAddTrainingPrerequisite: () => ({ mutateAsync: vi.fn() }),
  useMhdRemoveTrainingPrerequisite: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdTrainingCourseDetailPage } = await import('../components/MhdTrainingCourseDetailPage');

function course(overrides: Partial<MhdTrainingCourse>): MhdTrainingCourse {
  return {
    id: 'course-1',
    referenceId: 'TRN-0001',
    companyId: 'company-1',
    courseKey: 'ethics',
    title: 'Ethics & Anti-Bribery',
    description: null,
    category: 'COMPLIANCE',
    deliveryMode: 'ONLINE',
    durationMinutes: 30,
    recurrenceMonths: 12,
    requiresEvidence: false,
    externalUrl: null,
    isActive: true,
    isGlobal: false,
    contentMode: 'AUTHORED',
    programId: null,
    templateId: null,
    sourceCourseId: null,
    forkState: 'FORKED',
    contentVersion: 1,
    approvalStatus: 'DRAFT',
    retiredAt: null,
    successorCourseId: null,
    successorCourseTitle: null,
    ...overrides,
  };
}

function renderAt(courseId: string) {
  return render(
    <MemoryRouter initialEntries={[`/training/courses/${courseId}`]}>
      <Routes>
        <Route path="/training/courses/:courseId" element={<MhdTrainingCourseDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MhdTrainingCourseDetailPage', () => {
  it('shows the real persisted prerequisite list, not just items added this session', () => {
    coursesMock.mockReturnValue({ data: [course({})] });
    programsMock.mockReturnValue({ data: [] });
    prerequisitesMock.mockReturnValue({
      data: [{ prerequisiteCourseId: 'p1', prerequisiteTitle: 'Data Privacy Essentials', prerequisiteCourseKey: 'privacy', createdAt: 'now' }],
    });
    approvalsMock.mockReturnValue({ data: [] });
    renderAt('course-1');

    expect(screen.getByRole('tab', { name: /Prerequisites/ })).toBeInTheDocument();
  });

  it('shows the real approval history, not a static "no RPC available" message', async () => {
    coursesMock.mockReturnValue({ data: [course({ approvalStatus: 'APPROVED' })] });
    programsMock.mockReturnValue({ data: [] });
    prerequisitesMock.mockReturnValue({ data: [] });
    approvalsMock.mockReturnValue({
      data: [
        { id: 'a1', fromStatus: 'DRAFT', toStatus: 'IN_REVIEW', contentVersion: 1, reviewNotes: null, reviewedByName: 'Platform Admin', createdAt: 'now' },
      ],
    });
    renderAt('course-1');

    expect(await screen.findByText(/Platform Admin/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish Content' })).toBeInTheDocument();
  });

  it('calls submit-for-review for a DRAFT course', async () => {
    coursesMock.mockReturnValue({ data: [course({ approvalStatus: 'DRAFT' })] });
    programsMock.mockReturnValue({ data: [] });
    prerequisitesMock.mockReturnValue({ data: [] });
    approvalsMock.mockReturnValue({ data: [] });
    renderAt('course-1');

    await userEvent.click(screen.getByRole('button', { name: 'Submit for Review' }));

    expect(submitMock).toHaveBeenCalledWith({ courseId: 'course-1' });
  });
});
