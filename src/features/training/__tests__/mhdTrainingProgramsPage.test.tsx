import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MhdTrainingProgram } from '../Types';

const { createMock, updateMock, deleteMock, coursesMock, createCurriculumMock, updateCourseMock } =
  vi.hoisted(() => ({
    createMock: vi.fn().mockResolvedValue(undefined),
    updateMock: vi.fn().mockResolvedValue(undefined),
    deleteMock: vi.fn().mockResolvedValue(undefined),
    coursesMock: vi.fn(() => ({ data: [] })),
    createCurriculumMock: vi.fn().mockResolvedValue({ id: 'curriculum-1' }),
    updateCourseMock: vi.fn().mockResolvedValue(undefined),
  }));
const { listMock, curriculaMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  curriculaMock: vi.fn(),
}));

vi.mock('../Hook', () => ({
  useMhdTrainingPrograms: listMock,
  useMhdTrainingCurriculums: curriculaMock,
  useMhdCreateTrainingProgram: () => ({ mutateAsync: createMock }),
  useMhdUpdateTrainingProgram: () => ({ mutateAsync: updateMock }),
  useMhdDeleteTrainingProgram: () => ({ mutateAsync: deleteMock }),
  useMhdTrainingCourses: coursesMock,
  useMhdCreateTrainingCurriculum: () => ({ mutateAsync: createCurriculumMock }),
  useMhdUpdateTrainingCurriculum: () => ({ mutateAsync: updateMock }),
  useMhdUpdateTrainingCourse: () => ({ mutateAsync: updateCourseMock }),
  useMhdCreateTrainingCourse: () => ({ mutateAsync: vi.fn() }),
  useMhdCreateTrainingCourseFromTemplate: () => ({ mutateAsync: vi.fn() }),
  useMhdSetTrainingCourseContentMode: () => ({ mutateAsync: vi.fn() }),
  useMhdSubmitTrainingContentForReview: () => ({ mutateAsync: vi.fn() }),
  useMhdApproveTrainingContent: () => ({ mutateAsync: vi.fn() }),
  useMhdPublishTrainingContent: () => ({ mutateAsync: vi.fn() }),
  useMhdAddTrainingPrerequisite: () => ({ mutateAsync: vi.fn() }),
  useMhdRemoveTrainingPrerequisite: () => ({ mutateAsync: vi.fn() }),
  useMhdTrainingPrerequisites: () => ({ data: [] }),
  useMhdTrainingTemplates: () => ({ data: [] }),
  useMhdTrainingTemplateSlots: () => ({ data: [] }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdTrainingProgramsPage } = await import('../components/MhdTrainingProgramsPage');

function program(overrides: Partial<MhdTrainingProgram>): MhdTrainingProgram {
  return {
    id: 'prog-1',
    referenceId: 'PRG-0001',
    companyId: 'company-1',
    curriculumId: null,
    title: 'First-Time Manager Track',
    description: null,
    sortOrder: 0,
    isActive: true,
    isGlobal: false,
    ...overrides,
  };
}

describe('MhdTrainingProgramsPage', () => {
  it('renders the Active/Inactive badge from the real isActive value, not hardcoded', () => {
    curriculaMock.mockReturnValue({ data: [] });
    listMock.mockReturnValue({
      data: [
        program({ id: 'a', title: 'Active Program', isActive: true }),
        program({ id: 'b', title: 'Retired Program', isActive: false }),
      ],
    });
    render(<MhdTrainingProgramsPage />);

    const activeRow = screen.getByText('Active Program').closest('tr') as HTMLElement;
    const inactiveRow = screen.getByText('Retired Program').closest('tr') as HTMLElement;
    expect(within(activeRow).getByText('Active')).toBeInTheDocument();
    expect(within(inactiveRow).getByText('Inactive')).toBeInTheDocument();
  });

  it('marks a program with no attached courses as Empty', () => {
    coursesMock.mockReturnValue({ data: [] });
    curriculaMock.mockReturnValue({ data: [] });
    listMock.mockReturnValue({ data: [program({ title: 'Unstarted Program' })] });
    render(<MhdTrainingProgramsPage />);

    const row = screen.getByText('Unstarted Program').closest('tr') as HTMLElement;
    expect(within(row).getByText('Empty')).toBeInTheDocument();
  });

  it("edit form's Active checkbox defaults to the program's real state, not always checked", async () => {
    curriculaMock.mockReturnValue({ data: [] });
    listMock.mockReturnValue({ data: [program({ title: 'Retired Program', isActive: false })] });
    render(<MhdTrainingProgramsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: /Details/ }));

    expect(screen.getByRole('checkbox', { name: 'Active' })).not.toBeChecked();
  });

  it('resolves the curriculum name for a program', () => {
    curriculaMock.mockReturnValue({ data: [{ id: 'cur-1', title: 'People Leadership' }] });
    listMock.mockReturnValue({ data: [program({ curriculumId: 'cur-1' })] });
    render(<MhdTrainingProgramsPage />);

    expect(screen.getByText('People Leadership')).toBeInTheDocument();
  });
});
