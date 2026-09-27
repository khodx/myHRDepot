import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { createItemMock, createAssessmentMock, gradeMock, decideMock } = vi.hoisted(() => ({
  createItemMock: vi.fn().mockResolvedValue(undefined),
  createAssessmentMock: vi.fn().mockResolvedValue(undefined),
  gradeMock: vi.fn().mockResolvedValue(undefined),
  decideMock: vi.fn().mockResolvedValue(undefined),
}));
const { itemsMock, assessmentsMock, assessmentDetailMock, pendingReviewMock, accommodationsMock } = vi.hoisted(() => ({
  itemsMock: vi.fn(),
  assessmentsMock: vi.fn(),
  assessmentDetailMock: vi.fn(),
  pendingReviewMock: vi.fn(),
  accommodationsMock: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdAssessmentItems: itemsMock,
  useMhdCreateAssessmentItem: () => ({ mutateAsync: createItemMock, isPending: false }),
  useMhdAssessmentList: assessmentsMock,
  useMhdCreateAssessment: () => ({ mutateAsync: createAssessmentMock, isPending: false }),
  useMhdAssessment: assessmentDetailMock,
  useMhdAssessmentPendingReview: pendingReviewMock,
  useMhdGradeAssessmentAttempt: () => ({ mutateAsync: gradeMock, isPending: false }),
  useMhdAccommodationRequestList: accommodationsMock,
  useMhdDecideAccommodationRequest: () => ({ mutateAsync: decideMock, isPending: false }),
}));

vi.mock('@/features/training/Hook', () => ({
  useMhdTrainingCourses: () => ({ data: [] }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdAssessmentAdminPage } = await import('../components/MhdAssessmentAdminPage');

describe('MhdAssessmentAdminPage', () => {
  it('shows a manual-grading fallback (no options UI) for non-MCQ question types', async () => {
    itemsMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdAssessmentAdminPage />);

    await userEvent.click(screen.getByRole('button', { name: 'New Item' }));
    await userEvent.selectOptions(screen.getByLabelText('Question type'), 'LONG_TEXT_RUBRIC');

    expect(screen.getByText(/graded manually/)).toBeInTheDocument();
    expect(screen.queryByText('Options')).toBeNull();
  });

  it('the assembly mode picker only offers FIXED', async () => {
    itemsMock.mockReturnValue({ data: [{ id: 'i1', prompt: 'Q1', questionType: 'MCQ_SINGLE', difficulty: null, tags: [], requiresManualGrading: false, isActive: true }], isLoading: false, error: null });
    assessmentsMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdAssessmentAdminPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Assessments' }));
    await userEvent.click(screen.getByRole('button', { name: 'New Assessment' }));

    const select = screen.getByLabelText('Assembly mode') as HTMLSelectElement;
    const options = within(select).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Fixed']);
    expect(select).toBeDisabled();
  });

  it('refuses to create an assessment with zero items selected', async () => {
    itemsMock.mockReturnValue({ data: [{ id: 'i1', prompt: 'Q1', questionType: 'MCQ_SINGLE', difficulty: null, tags: [], requiresManualGrading: false, isActive: true }], isLoading: false, error: null });
    assessmentsMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdAssessmentAdminPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Assessments' }));
    await userEvent.click(screen.getByRole('button', { name: 'New Assessment' }));
    await userEvent.type(screen.getByLabelText('Title'), 'Ethics Check');
    await userEvent.click(screen.getByRole('button', { name: 'Create assessment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('at least one item');
    expect(createAssessmentMock).not.toHaveBeenCalled();
  });

  it('shows no edit or delete affordance for items or assessments (backend is create-only)', () => {
    itemsMock.mockReturnValue({ data: [{ id: 'i1', prompt: 'Q1', questionType: 'MCQ_SINGLE', difficulty: null, tags: [], requiresManualGrading: false, isActive: true }], isLoading: false, error: null });
    render(<MhdAssessmentAdminPage />);

    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('shows the honest empty state when nothing is waiting for review', async () => {
    pendingReviewMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MhdAssessmentAdminPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Grading Queue' }));

    expect(screen.getByText('Nothing is waiting for review right now.')).toBeInTheDocument();
  });

  it('submits a grade with the assessmentId/attemptId/scorePercent/passed shape', async () => {
    pendingReviewMock.mockReturnValue({
      data: [{ id: 'att1', assessmentId: 'a1', assessmentTitle: 'Ethics Check', personId: 'p1', personDisplayName: 'Jordan Martinez', attemptNumber: 1, submittedAt: 'now' }],
      isLoading: false,
      error: null,
    });
    render(<MhdAssessmentAdminPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Grading Queue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Grade' }));
    await userEvent.type(screen.getByLabelText('Score percent'), '85');
    await userEvent.selectOptions(screen.getByLabelText('Passed'), 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Save grade' }));

    expect(gradeMock).toHaveBeenCalledWith({ assessmentId: 'a1', attemptId: 'att1', scorePercent: 85, passed: true });
  });

  it('refuses to deny an accommodation request with a blank reason', async () => {
    accommodationsMock.mockReturnValue({
      data: [{
        id: 'r1', assessmentId: 'a1', assessmentTitle: 'Ethics Check', personId: 'p1', personDisplayName: 'Jordan Martinez',
        extendedTimePercent: 50, attemptCountOverride: null, integrityProfileOverride: null, status: 'PENDING',
        decidedByName: null, decidedAt: null, decisionNotes: null, createdAt: 'now',
      }],
      isLoading: false,
      error: null,
    });
    vi.spyOn(window, 'prompt').mockReturnValue('   ');
    render(<MhdAssessmentAdminPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Accommodations' }));
    await userEvent.click(screen.getByRole('button', { name: 'Deny' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A reason is required to deny an accommodation request.');
    expect(decideMock).not.toHaveBeenCalled();
  });

  it('approves an accommodation request with a real reason', async () => {
    accommodationsMock.mockReturnValue({
      data: [{
        id: 'r1', assessmentId: 'a1', assessmentTitle: 'Ethics Check', personId: 'p1', personDisplayName: 'Jordan Martinez',
        extendedTimePercent: 50, attemptCountOverride: null, integrityProfileOverride: null, status: 'PENDING',
        decidedByName: null, decidedAt: null, decisionNotes: null, createdAt: 'now',
      }],
      isLoading: false,
      error: null,
    });
    vi.spyOn(window, 'prompt').mockReturnValue('Documented accommodation on file.');
    render(<MhdAssessmentAdminPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Accommodations' }));
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(decideMock).toHaveBeenCalledWith({ assessmentId: 'a1', requestId: 'r1', approve: true, notes: 'Documented accommodation on file.' });
  });
});
