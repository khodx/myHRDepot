import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdTrainingContentWizard } from '../components/MhdTrainingContentWizard';
import { validateWizardStep, WIZARD_STEPS } from '../components/MhdTrainingContentWizardSteps';

const mocks = vi.hoisted(() => ({
  createCurriculum: vi.fn().mockResolvedValue({ id: 'cur-new', referenceId: 'CUR-NEW' }),
  updateCurriculum: vi.fn().mockResolvedValue(undefined),
  createProgram: vi.fn().mockResolvedValue({ id: 'prog-new', referenceId: 'PRG-NEW' }),
  updateProgram: vi.fn().mockResolvedValue(undefined),
  updateCourse: vi.fn().mockResolvedValue(undefined),
  createCourse: vi.fn().mockResolvedValue({ id: 'course-new', referenceId: 'TRN-NEW' }),
  createCourseFromTemplate: vi
    .fn()
    .mockResolvedValue({ id: 'course-template', referenceId: 'TRN-TEMPLATE' }),
  setContentMode: vi.fn().mockResolvedValue(undefined),
  submitForReview: vi.fn().mockResolvedValue(undefined),
  approveContent: vi.fn().mockResolvedValue(undefined),
  publishContent: vi.fn().mockResolvedValue(undefined),
  addPrerequisite: vi.fn().mockResolvedValue(undefined),
  removePrerequisite: vi.fn().mockResolvedValue(undefined),
  trainingCurriculums: vi.fn(() => ({ data: [] })),
  trainingPrograms: vi.fn(() => ({ data: [] })),
  trainingCourses: vi.fn(() => ({ data: [] })),
  prerequisites: vi.fn(() => ({ data: [] })),
  trainingTemplates: vi.fn(() => ({ data: [] })),
  templateSlots: vi.fn(() => ({ data: [] })),
}));

vi.mock('../Hook', () => ({
  useMhdCreateTrainingCurriculum: () => ({ mutateAsync: mocks.createCurriculum }),
  useMhdUpdateTrainingCurriculum: () => ({ mutateAsync: mocks.updateCurriculum }),
  useMhdCreateTrainingProgram: () => ({ mutateAsync: mocks.createProgram }),
  useMhdUpdateTrainingProgram: () => ({ mutateAsync: mocks.updateProgram }),
  useMhdUpdateTrainingCourse: () => ({ mutateAsync: mocks.updateCourse }),
  useMhdCreateTrainingCourse: () => ({ mutateAsync: mocks.createCourse }),
  useMhdCreateTrainingCourseFromTemplate: () => ({ mutateAsync: mocks.createCourseFromTemplate }),
  useMhdSetTrainingCourseContentMode: () => ({ mutateAsync: mocks.setContentMode }),
  useMhdSubmitTrainingContentForReview: () => ({ mutateAsync: mocks.submitForReview }),
  useMhdApproveTrainingContent: () => ({ mutateAsync: mocks.approveContent }),
  useMhdPublishTrainingContent: () => ({ mutateAsync: mocks.publishContent }),
  useMhdAddTrainingPrerequisite: () => ({ mutateAsync: mocks.addPrerequisite }),
  useMhdRemoveTrainingPrerequisite: () => ({ mutateAsync: mocks.removePrerequisite }),
  useMhdTrainingPrerequisites: () => mocks.prerequisites(),
  useMhdTrainingCurriculums: () => mocks.trainingCurriculums(),
  useMhdTrainingPrograms: () => mocks.trainingPrograms(),
  useMhdTrainingCourses: () => mocks.trainingCourses(),
  useMhdTrainingTemplates: () => mocks.trainingTemplates(),
  useMhdTrainingTemplateSlots: () => mocks.templateSlots(),
}));

vi.mock('../components/MhdTrainingContentTreeEditor', () => ({
  MhdTrainingContentTreeEditor: ({ courseId }: { courseId: string }) => (
    <div data-testid="content-tree-editor">Content tree for {courseId}</div>
  ),
}));

describe('MhdTrainingContentWizard', () => {
  it('requires a non-blank title only on the Details step', () => {
    expect(validateWizardStep(0, '   ')).toBe('Enter a title to continue.');
    expect(validateWizardStep(0, 'A real title')).toBeNull();
    expect(validateWizardStep(1, '')).toBeNull();
  });

  it('requires both a course key and title for Course Details', () => {
    expect(validateWizardStep(0, 'Course title', '   ', true)).toBe(
      'Enter a course key to continue.',
    );
    // A genuinely blank ('') courseKey, not just whitespace -- the exact case
    // that used to slip through when isCourseStep was inferred from the
    // courseKey string being non-empty instead of passed explicitly.
    expect(validateWizardStep(0, 'Course title', '', true)).toBe('Enter a course key to continue.');
    expect(validateWizardStep(0, '   ', 'course-key', true)).toBe('Enter a title to continue.');
    expect(validateWizardStep(0, 'Course title', 'course-key', true)).toBeNull();
    // Non-course steps never require a course key, regardless of the value
    // passed for it.
    expect(validateWizardStep(0, 'Curriculum title', '', false)).toBeNull();
  });

  it('creates a new curriculum when Details advances from an unsaved wizard', async () => {
    const user = { name: 'New curriculum' };
    render(
      <MhdTrainingContentWizard
        entityType="CURRICULUM"
        companyId="company-1"
        entityId={null}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: user.name } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(mocks.createCurriculum).toHaveBeenCalledWith({
        companyId: 'company-1',
        title: user.name,
        description: '',
      }),
    );
    expect(mocks.updateCurriculum).not.toHaveBeenCalled();
  });

  it('jumping straight from the overview checklist to Review still creates the entity first, and blocks the jump when Details is invalid', async () => {
    vi.mocked(mocks.createCurriculum).mockClear();
    render(
      <MhdTrainingContentWizard
        entityType="CURRICULUM"
        companyId="company-1"
        entityId={null}
        onClose={vi.fn()}
      />,
    );

    // Jumping straight to Review from a brand-new, blank-title wizard must be
    // blocked — this is the exact path that used to silently "Finish" without
    // ever creating a curriculum.
    fireEvent.click(
      screen.getAllByRole('button').find((el) => el.textContent?.includes('Review'))!,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a title to continue.');
    expect(mocks.createCurriculum).not.toHaveBeenCalled();

    // Enter a title on Details without pressing Next, return to the overview,
    // then jump straight to Review from there.
    fireEvent.click(
      screen.getAllByRole('button').find((el) => el.textContent?.includes('Details'))!,
    );
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Onboarding curriculum' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    fireEvent.click(
      screen.getAllByRole('button').find((el) => el.textContent?.includes('Review'))!,
    );

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
    const program = {
      id: 'prog-1',
      title: 'Existing program',
      description: 'Old',
      curriculumId: null,
      sortOrder: 2,
    };
    vi.mocked(mocks.updateProgram).mockClear();
    render(
      <MhdTrainingContentWizard
        entityType="PROGRAM"
        companyId="company-1"
        entityId={program.id}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Renamed program' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(mocks.updateProgram).toHaveBeenCalledWith(
        expect.objectContaining({ programId: 'prog-1', title: 'Renamed program' }),
      ),
    );
    expect(mocks.createProgram).not.toHaveBeenCalled();
  });

  it('hydrates a resumed curriculum and updates it without recreating it', async () => {
    vi.mocked(mocks.trainingCurriculums).mockReturnValue({
      data: [
        {
          id: 'cur-existing',
          title: 'Existing curriculum',
          description: 'Saved curriculum description',
          isActive: true,
        },
      ],
    } as never);
    vi.mocked(mocks.updateCurriculum).mockClear();
    vi.mocked(mocks.createCurriculum).mockClear();
    render(
      <MhdTrainingContentWizard
        entityType="CURRICULUM"
        companyId="company-1"
        entityId="cur-existing"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Title')).toHaveValue('Existing curriculum'),
    );
    expect(screen.getByLabelText('Description')).toHaveValue('Saved curriculum description');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(mocks.updateCurriculum).toHaveBeenCalledWith({
        curriculumId: 'cur-existing',
        title: 'Existing curriculum',
        description: 'Saved curriculum description',
        isActive: true,
      }),
    );
    expect(mocks.createCurriculum).not.toHaveBeenCalled();
  });

  it('hydrates a resumed program placement fields and updates it without recreating it', async () => {
    vi.mocked(mocks.trainingCurriculums).mockReturnValue({
      data: [
        {
          id: 'cur-parent',
          title: 'Parent curriculum',
          description: null,
          isActive: true,
        },
      ],
    } as never);
    vi.mocked(mocks.trainingPrograms).mockReturnValue({
      data: [
        {
          id: 'prog-existing',
          title: 'Existing program',
          description: 'Saved program description',
          curriculumId: 'cur-parent',
          sortOrder: 4,
          isActive: true,
        },
      ],
    } as never);
    vi.mocked(mocks.updateProgram).mockClear();
    vi.mocked(mocks.createProgram).mockClear();
    render(
      <MhdTrainingContentWizard
        entityType="PROGRAM"
        companyId="company-1"
        entityId="prog-existing"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    await vi.waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Existing program'));
    expect(screen.getByLabelText('Description')).toHaveValue('Saved program description');
    expect(screen.getByLabelText('Curriculum')).toHaveValue('cur-parent');
    expect(screen.getByLabelText('Sort order')).toHaveValue(4);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(mocks.updateProgram).toHaveBeenCalledWith({
        programId: 'prog-existing',
        title: 'Existing program',
        description: 'Saved program description',
        curriculumId: 'cur-parent',
        clearCurriculumId: false,
        sortOrder: 4,
        isActive: true,
      }),
    );
    expect(mocks.createProgram).not.toHaveBeenCalled();
  });

  it('renders Complete and Incomplete checklist indicators from the entity state', async () => {
    vi.mocked(mocks.trainingCurriculums).mockReturnValue({
      data: [
        {
          id: 'cur-checklist',
          title: 'Checklist curriculum',
          description: 'Has details',
          isActive: true,
        },
      ],
    } as never);
    vi.mocked(mocks.trainingPrograms).mockReturnValue({
      data: [
        {
          id: 'prog-attached',
          title: 'Attached program',
          description: null,
          curriculumId: 'cur-checklist',
          sortOrder: 0,
          isActive: true,
        },
      ],
    } as never);
    render(
      <MhdTrainingContentWizard
        entityType="CURRICULUM"
        companyId="company-1"
        entityId="cur-checklist"
        onClose={vi.fn()}
      />,
    );
    const checklist = screen.getByRole('list', { name: 'Wizard overview' });
    expect(within(checklist).getByRole('button', { name: /Details[\s\S]*Complete/ })).toBeInTheDocument();
    expect(within(checklist).getByRole('button', { name: /Programs[\s\S]*Complete/ })).toBeInTheDocument();
    expect(within(checklist).getByRole('button', { name: /Review[\s\S]*Complete/ })).toBeInTheDocument();

    vi.mocked(mocks.trainingPrograms).mockReturnValue({ data: [] });
    render(
      <MhdTrainingContentWizard
        entityType="CURRICULUM"
        companyId="company-1"
        entityId="cur-checklist"
        onClose={vi.fn()}
      />,
    );
    const incompleteChecklist = screen.getAllByRole('list', { name: 'Wizard overview' }).at(-1)!;
    expect(
      within(incompleteChecklist).getByRole('button', { name: /Programs[\s\S]*Incomplete/ }),
    ).toBeInTheDocument();
  });

  it('creates a blank course only after the Template step is left', async () => {
    vi.mocked(mocks.createCourse).mockClear();
    vi.mocked(mocks.setContentMode).mockClear();
    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId={null}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Course key'), { target: { value: 'course-blank' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Blank course' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course template')).toBeInTheDocument());
    expect(mocks.createCourse).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(mocks.createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseKey: 'course-blank', title: 'Blank course' }),
      ),
    );
    // A blank-started course must be flipped to AUTHORED, or
    // mhd_training_module_create refuses every module on it (verified
    // against the real local Supabase RPC, not just this mock).
    await vi.waitFor(() =>
      expect(mocks.setContentMode).toHaveBeenCalledWith({
        courseId: 'course-new',
        contentMode: 'AUTHORED',
      }),
    );
  });

  it('creates a course from the selected template and previews its slots', async () => {
    vi.mocked(mocks.createCourseFromTemplate).mockClear();
    vi.mocked(mocks.trainingTemplates).mockReturnValue({
      data: [
        {
          id: 'tpl-1',
          title: 'Locked onboarding',
          description: null,
          rigidity: 'LOCKED',
          isGlobal: false,
        },
      ],
    } as never);
    vi.mocked(mocks.templateSlots).mockReturnValue({
      data: [
        {
          id: 'slot-1',
          slotLabel: 'Welcome module',
          expectedBlockType: 'RICH_TEXT',
          isRequired: true,
        },
      ],
    } as never);
    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId={null}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Course key'), { target: { value: 'course-locked' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Locked course' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course template')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Course template'), { target: { value: 'tpl-1' } });
    expect(screen.getByText(/create these slots automatically/)).toBeInTheDocument();
    expect(screen.getByText('Welcome module')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(mocks.createCourseFromTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ templateId: 'tpl-1', courseKey: 'course-locked' }),
      ),
    );
  });

  it('hydrates a resumed course and does not recreate it when leaving Template', async () => {
    vi.mocked(mocks.trainingCourses).mockReturnValue({
      data: [
        {
          id: 'course-existing',
          courseKey: 'existing-key',
          title: 'Existing course',
          description: 'Saved',
          category: 'SAFETY',
          deliveryMode: 'ONLINE',
          durationMinutes: 30,
          recurrenceMonths: 12,
          requiresEvidence: true,
          externalUrl: null,
          programId: null,
          isActive: true,
          templateId: 'tpl-existing',
        },
      ],
    } as never);
    vi.mocked(mocks.createCourse).mockClear();
    vi.mocked(mocks.createCourseFromTemplate).mockClear();
    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId="course-existing"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course key')).toHaveValue('existing-key'));
    expect(screen.getByLabelText('Course key')).toHaveAttribute('readonly');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course template')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByTestId('content-tree-editor')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Prerequisite course')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument(),
    );
    expect(mocks.createCourse).not.toHaveBeenCalled();
    expect(mocks.createCourseFromTemplate).not.toHaveBeenCalled();
  });

  it('renders the inline Content step with the saved course id', async () => {
    vi.mocked(mocks.createCourse).mockClear();
    vi.mocked(mocks.createCourse).mockResolvedValueOnce({
      id: 'course-content',
      referenceId: 'TRN-CONTENT',
    });
    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId={null}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Course key'), { target: { value: 'content-course' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Content course' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course template')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() =>
      expect(screen.getByTestId('content-tree-editor')).toHaveTextContent('course-content'),
    );
  });

  it('places Prerequisites after Content and persists add/remove choices', async () => {
    vi.mocked(mocks.trainingCourses).mockReturnValue({
      data: [
        {
          id: 'course-existing',
          courseKey: 'existing-key',
          title: 'Current course',
          description: null,
          category: 'OTHER',
          deliveryMode: 'DOCUMENT',
          durationMinutes: null,
          recurrenceMonths: null,
          requiresEvidence: false,
          externalUrl: null,
          programId: null,
          isActive: true,
          templateId: null,
          approvalStatus: 'DRAFT',
        },
        { id: 'course-prereq', title: 'Already required' },
        { id: 'course-available', title: 'Available course' },
      ],
    } as never);
    vi.mocked(mocks.prerequisites).mockReturnValue({
      data: [{ prerequisiteCourseId: 'course-prereq', prerequisiteTitle: 'Already required' }],
    } as never);
    const courseSteps = WIZARD_STEPS.COURSE.map((step) => step.id);
    expect(courseSteps).toEqual(['details', 'template', 'content', 'prerequisites', 'review']);

    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId="course-existing"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course key')).toHaveValue('existing-key'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course template')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByTestId('content-tree-editor')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    const select = await screen.findByLabelText('Prerequisite course');
    expect(screen.queryByRole('option', { name: 'Current course' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Already required' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Available course' })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'course-available' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await vi.waitFor(() =>
      expect(mocks.addPrerequisite).toHaveBeenCalledWith({
        courseId: 'course-existing',
        prerequisiteCourseId: 'course-available',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mocks.removePrerequisite).toHaveBeenCalledWith({
      courseId: 'course-existing',
      prerequisiteCourseId: 'course-prereq',
    });
  });

  it('shows the course approval status and submits a draft for review from Review', async () => {
    vi.mocked(mocks.trainingCourses).mockReturnValue({
      data: [
        {
          id: 'course-approval',
          courseKey: 'approval-key',
          title: 'Approval course',
          description: 'Description',
          category: 'SAFETY',
          deliveryMode: 'ONLINE',
          durationMinutes: 30,
          recurrenceMonths: 12,
          requiresEvidence: true,
          externalUrl: null,
          programId: null,
          isActive: true,
          templateId: null,
          approvalStatus: 'DRAFT',
        },
      ],
    } as never);
    vi.mocked(mocks.prerequisites).mockReturnValue({ data: [] });
    vi.mocked(mocks.submitForReview).mockClear();
    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId="course-approval"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course key')).toHaveValue('approval-key'));
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    fireEvent.click(
      screen.getAllByRole('button').find((el) => el.textContent?.includes('Review'))!,
    );
    await vi.waitFor(() => expect(screen.getByText('Draft')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Submit for Review' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit for Review' }));
    await vi.waitFor(() =>
      expect(mocks.submitForReview).toHaveBeenCalledWith({ courseId: 'course-approval' }),
    );
  });

  it.each([
    ['IN_REVIEW', 'Approve Content', 'approveContent', { courseId: 'course-approval', reviewNotes: 'Looks good' }],
    ['APPROVED', 'Publish Content', 'publishContent', { courseId: 'course-approval' }],
  ] as const)('advances %s courses through the Review action', async (approvalStatus, action, hook, expected) => {
    vi.mocked(mocks.trainingCourses).mockReturnValue({
      data: [
        {
          id: 'course-approval',
          courseKey: 'approval-key',
          title: 'Approval course',
          description: 'Description',
          category: 'SAFETY',
          deliveryMode: 'ONLINE',
          durationMinutes: 30,
          recurrenceMonths: 12,
          requiresEvidence: true,
          externalUrl: null,
          programId: null,
          isActive: true,
          templateId: null,
          approvalStatus,
        },
      ],
    } as never);
    vi.mocked(mocks[hook]).mockClear();
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Looks good');
    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId="course-approval"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course key')).toHaveValue('approval-key'));
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    fireEvent.click(screen.getAllByRole('button').find((el) => el.textContent?.includes('Review'))!);
    await vi.waitFor(() => expect(screen.getByRole('button', { name: action })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: action }));
    await vi.waitFor(() => expect(mocks[hook]).toHaveBeenCalledWith(expected));
    promptSpy.mockRestore();
  });

  it('guards the Content step when the course id is still missing', async () => {
    vi.mocked(mocks.createCourse).mockResolvedValueOnce({ id: '', referenceId: 'TRN-MISSING' });
    render(
      <MhdTrainingContentWizard
        entityType="COURSE"
        companyId="company-1"
        entityId={null}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Course key'), { target: { value: 'missing-course' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Missing course' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(screen.getByLabelText('Course template')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText(
        'Complete the Details and Template steps before authoring course content.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps Curriculum and Program composition and Review rendering by step id', async () => {
    const { unmount } = render(
      <MhdTrainingContentWizard
        entityType="CURRICULUM"
        companyId="company-1"
        entityId="cur-1"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Curriculum' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Attached programs')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
    unmount();

    render(
      <MhdTrainingContentWizard
        entityType="PROGRAM"
        companyId="company-1"
        entityId="program-1"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Program' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Attached courses')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
  });
});
