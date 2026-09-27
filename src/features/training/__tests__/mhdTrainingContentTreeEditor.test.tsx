import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdTrainingContentTree } from '../Types';

const { createBlockMock, treeMock, translationsMock, upsertTranslationMock, deleteTranslationMock } = vi.hoisted(() => ({
  createBlockMock: vi.fn().mockResolvedValue({ id: 'new-block' }),
  treeMock: vi.fn(),
  translationsMock: vi.fn(),
  upsertTranslationMock: vi.fn().mockResolvedValue(undefined),
  deleteTranslationMock: vi.fn().mockResolvedValue(undefined),
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
  useMhdTrainingScenarioGraph: () => ({ data: [], isLoading: false, isError: false }),
  useMhdCreateTrainingScenarioNode: () => noopMutation,
  useMhdUpdateTrainingScenarioNode: () => noopMutation,
  useMhdDeleteTrainingScenarioNode: () => noopMutation,
  useMhdCreateTrainingScenarioChoice: () => noopMutation,
  useMhdUpdateTrainingScenarioChoice: () => noopMutation,
  useMhdDeleteTrainingScenarioChoice: () => noopMutation,
  useMhdTrainingBlockTranslations: translationsMock,
  useMhdUpsertTrainingBlockTranslation: () => ({ mutateAsync: upsertTranslationMock }),
  useMhdDeleteTrainingBlockTranslation: () => ({ mutateAsync: deleteTranslationMock }),
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
  beforeEach(() => {
    upsertTranslationMock.mockClear();
    deleteTranslationMock.mockClear();
  });

  it('shows an existing SCENARIO_BRANCHING block with an Edit Graph action, not the plain block-content Edit action', () => {
    treeMock.mockReturnValue({ data: tree(), isLoading: false });
    render(<MhdTrainingContentTreeEditor courseId="course-1" />);

    const blockRow = screen.getByText('An Upset Employee').closest('div') as HTMLElement;
    const actions = blockRow.parentElement as HTMLElement;
    expect(within(actions).getByRole('button', { name: 'Edit Graph' })).toBeInTheDocument();
    expect(within(actions).queryByRole('button', { name: 'Edit' })).toBeNull();
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

  it('opens the Translations panel for a block, lists existing locales, and adds a new one', async () => {
    treeMock.mockReturnValue({ data: tree(), isLoading: false });
    translationsMock.mockReturnValue({
      data: [{ id: 't1', locale: 'es', content: { text: 'Hola' }, altText: null, transcript: null, updatedAt: '2026-09-01T00:00:00Z' }],
      isLoading: false,
    });
    render(<MhdTrainingContentTreeEditor courseId="course-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Translations' }));
    expect(translationsMock).toHaveBeenCalledWith('blk-1');
    expect(screen.getByText('es')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add translation' }));
    await userEvent.type(screen.getByLabelText('Locale *'), 'fr-CA');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(upsertTranslationMock).toHaveBeenCalledWith({
      blockId: 'blk-1',
      locale: 'fr-CA',
      content: {},
      altText: null,
      transcript: null,
    });
  });

  it('refuses to save a translation with invalid JSON content', async () => {
    treeMock.mockReturnValue({ data: tree(), isLoading: false });
    translationsMock.mockReturnValue({ data: [], isLoading: false });
    render(<MhdTrainingContentTreeEditor courseId="course-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Translations' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add translation' }));
    await userEvent.type(screen.getByLabelText('Locale *'), 'es');
    const jsonField = screen.getByLabelText('Translated content (JSON)');
    fireEvent.change(jsonField, { target: { value: '{not json' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Translated content must be valid JSON.');
    expect(upsertTranslationMock).not.toHaveBeenCalled();
  });

  it('deletes an existing translation after confirmation', async () => {
    treeMock.mockReturnValue({ data: tree(), isLoading: false });
    translationsMock.mockReturnValue({
      data: [{ id: 't1', locale: 'es', content: {}, altText: null, transcript: null, updatedAt: null }],
      isLoading: false,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MhdTrainingContentTreeEditor courseId="course-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Translations' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(deleteTranslationMock).toHaveBeenCalledWith({ translationId: 't1', blockId: 'blk-1' });
  });
});
