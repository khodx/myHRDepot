import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { validateWizardStep, MhdTrainingContentWizard } from '../components/MhdTrainingContentWizard';

const mocks = vi.hoisted(() => ({
  createCurriculum: vi.fn().mockResolvedValue({ id: 'cur-new', referenceId: 'CUR-NEW' }),
  updateCurriculum: vi.fn().mockResolvedValue(undefined),
  createProgram: vi.fn().mockResolvedValue({ id: 'prog-new', referenceId: 'PRG-NEW' }),
  updateProgram: vi.fn().mockResolvedValue(undefined),
  updateCourse: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../Hook', () => ({
  useMhdCreateTrainingCurriculum: () => ({ mutateAsync: mocks.createCurriculum }),
  useMhdUpdateTrainingCurriculum: () => ({ mutateAsync: mocks.updateCurriculum }),
  useMhdCreateTrainingProgram: () => ({ mutateAsync: mocks.createProgram }),
  useMhdUpdateTrainingProgram: () => ({ mutateAsync: mocks.updateProgram }),
  useMhdUpdateTrainingCourse: () => ({ mutateAsync: mocks.updateCourse }),
  useMhdTrainingCurriculums: () => ({ data: [] }),
  useMhdTrainingPrograms: () => ({ data: [] }),
  useMhdTrainingCourses: () => ({ data: [] }),
}));

describe('MhdTrainingContentWizard', () => {
  it('requires a non-blank title only on the Details step', () => {
    expect(validateWizardStep(0, '   ')).toBe('Enter a title to continue.');
    expect(validateWizardStep(0, 'A real title')).toBeNull();
    expect(validateWizardStep(1, '')).toBeNull();
  });

  it('creates a new curriculum when Details advances from an unsaved wizard', async () => {
    const user = { name: 'New curriculum' };
    render(<MhdTrainingContentWizard entityType="CURRICULUM" companyId="company-1" entityId={null} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: user.name } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(mocks.createCurriculum).toHaveBeenCalledWith({ companyId: 'company-1', title: user.name, description: '' }));
    expect(mocks.updateCurriculum).not.toHaveBeenCalled();
  });

  it('jumping straight from the overview checklist to Review still creates the entity first, and blocks the jump when Details is invalid', async () => {
    vi.mocked(mocks.createCurriculum).mockClear();
    render(<MhdTrainingContentWizard entityType="CURRICULUM" companyId="company-1" entityId={null} onClose={vi.fn()} />);

    // Jumping straight to Review from a brand-new, blank-title wizard must be
    // blocked — this is the exact path that used to silently "Finish" without
    // ever creating a curriculum.
    fireEvent.click(screen.getAllByRole('button').find((el) => el.textContent?.includes('Review'))!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a title to continue.');
    expect(mocks.createCurriculum).not.toHaveBeenCalled();

    // Enter a title on Details without pressing Next, return to the overview,
    // then jump straight to Review from there.
    fireEvent.click(screen.getAllByRole('button').find((el) => el.textContent?.includes('Details'))!);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Onboarding curriculum' } });
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    fireEvent.click(screen.getAllByRole('button').find((el) => el.textContent?.includes('Review'))!);

    await vi.waitFor(() =>
      expect(mocks.createCurriculum).toHaveBeenCalledWith({
        companyId: 'company-1',
        title: 'Onboarding curriculum',
        description: '',
      }),
    );
    expect(await screen.findByRole('button', { name: 'Finish' })).toBeInTheDocument();
  });

  it('updates an existing program when Details advances from a resumed wizard', async () => {
    const program = { id: 'prog-1', title: 'Existing program', description: 'Old', curriculumId: null, sortOrder: 2 };
    vi.mocked(mocks.updateProgram).mockClear();
    render(<MhdTrainingContentWizard entityType="PROGRAM" companyId="company-1" entityId={program.id} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Renamed program' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(mocks.updateProgram).toHaveBeenCalledWith(expect.objectContaining({ programId: 'prog-1', title: 'Renamed program' })));
    expect(mocks.createProgram).not.toHaveBeenCalled();
  });
});
