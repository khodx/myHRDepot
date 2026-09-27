import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { createItemMock, createAssessmentMock } = vi.hoisted(() => ({
  createItemMock: vi.fn().mockResolvedValue(undefined),
  createAssessmentMock: vi.fn().mockResolvedValue(undefined),
}));
const { itemsMock, assessmentsMock, assessmentDetailMock } = vi.hoisted(() => ({
  itemsMock: vi.fn(),
  assessmentsMock: vi.fn(),
  assessmentDetailMock: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdAssessmentItems: itemsMock,
  useMhdCreateAssessmentItem: () => ({ mutateAsync: createItemMock, isPending: false }),
  useMhdAssessmentList: assessmentsMock,
  useMhdCreateAssessment: () => ({ mutateAsync: createAssessmentMock, isPending: false }),
  useMhdAssessment: assessmentDetailMock,
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
});
