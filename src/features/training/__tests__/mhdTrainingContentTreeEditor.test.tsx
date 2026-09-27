import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MhdTrainingContentTree } from '../Types';

const { createBlockMock, treeMock } = vi.hoisted(() => ({
  createBlockMock: vi.fn().mockResolvedValue({ id: 'new-block' }),
  treeMock: vi.fn(),
}));
const noopMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined) };

vi.mock('../Hook', () => ({
  useMhdTrainingCourseContentTree: treeMock,
  useMhdCreateTrainingCourseModule: () => noopMutation,
  useMhdUpdateTrainingCourseModule: () => noopMutation,
  useMhdDeleteTrainingCourseModule: () => noopMutation,
  useMhdCreateTrainingLesson: () => noopMutation,
  useMhdUpdateTrainingLesson: () => noopMutation,
  useMhdDeleteTrainingLesson: () => noopMutation,
  useMhdCreateTrainingBlock: () => ({ mutateAsync: createBlockMock }),
  useMhdUpdateTrainingBlock: () => noopMutation,
  useMhdDeleteTrainingBlock: () => noopMutation,
  useMhdUploadTrainingVideo: () => noopMutation,
}));

const { MhdTrainingContentTreeEditor } = await import('../components/MhdTrainingContentTreeEditor');

function tree(): MhdTrainingContentTree {
  return [
    {
      id: 'mod-1',
      title: 'Module One',
      sortOrder: 0,
      lessons: [
        {
          id: 'lsn-1',
          title: 'Lesson One',
          sortOrder: 0,
          blocks: [
            {
              id: 'blk-1',
              blockType: 'SCENARIO_BRANCHING',
              title: 'An Upset Employee',
              content: {},
              sortOrder: 0,
              altText: null,
              transcript: null,
            },
          ],
        },
      ],
    },
  ];
}

describe('MhdTrainingContentTreeEditor', () => {
  it('shows an existing SCENARIO_BRANCHING block read-only with a Stage 2b note, and hides its Edit action', () => {
    treeMock.mockReturnValue({ data: tree(), isLoading: false });
    render(<MhdTrainingContentTreeEditor courseId="course-1" />);

    expect(screen.getByText(/Stage 2b/)).toBeInTheDocument();
    const blockRow = screen.getByText('An Upset Employee').closest('div') as HTMLElement;
    expect(within(blockRow.parentElement as HTMLElement).queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  it("the add-block type picker excludes SCENARIO_BRANCHING and AI_CONVERSATION", async () => {
    treeMock.mockReturnValue({ data: tree(), isLoading: false });
    render(<MhdTrainingContentTreeEditor courseId="course-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Add Block' }));
    const dialog = screen.getByRole('dialog');
    const options = within(dialog).getAllByRole('option').map((option) => option.textContent);
    expect(options).not.toContain('Scenario branching');
    expect(options).not.toContain('AI conversation');
    expect(options).toContain('Rich text');
  });

  it('refuses to save an IMAGE block without alt text', async () => {
    treeMock.mockReturnValue({ data: tree(), isLoading: false });
    render(<MhdTrainingContentTreeEditor courseId="course-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Add Block' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.selectOptions(within(dialog).getAllByRole('combobox')[0], 'IMAGE');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Alt text is required for images.');
    expect(createBlockMock).not.toHaveBeenCalled();
  });
});
