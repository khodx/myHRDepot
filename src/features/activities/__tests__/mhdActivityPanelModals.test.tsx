import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDraft, mockNotes, mockAttachments, mockActions } = vi.hoisted(() => ({
  mockDraft: {
    draft: null as unknown,
    isLoading: false,
    isSaving: false,
    savedAt: null as string | null,
    saveError: null as string | null,
    save: vi.fn(),
    discard: vi.fn(),
  },
  mockNotes: {
    notes: [] as unknown[],
    isLoading: false,
    isSaving: false,
    errorMessage: null as string | null,
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    refresh: vi.fn(),
  },
  mockAttachments: {
    attachments: [] as unknown[],
    isLoading: false,
    error: null as string | null,
    isUploading: false,
    uploadAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
    downloadAttachment: vi.fn(),
  },
  mockActions: {
    createActivity: { mutateAsync: vi.fn(), isPending: false },
    createSubActivity: { mutateAsync: vi.fn(), isPending: false },
  },
}));

vi.mock('@/features/drafts/Hook', () => ({ useMhdDraft: () => mockDraft }));
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { userId: 'user-1', companyId: 'company-1' },
    roles: ['Employee'],
  }),
}));
vi.mock('@/features/notes/Hook', () => ({ useMhdNotes: () => mockNotes }));
vi.mock('@/features/attachments/Hook', () => ({ useMhdAttachments: () => mockAttachments }));
vi.mock('@/features/companies/Hook', () => ({
  useMhdCompanies: () => ({ data: [{ id: 'company-1', companyName: 'Harbor Light Dental' }] }),
}));
vi.mock('../Hook', () => ({
  useMhdActivityActions: () => mockActions,
  useMhdActivityPeople: () => ({ data: [] }),
  useMhdActivityUsers: () => ({ data: [] }),
  useMhdActivityTasks: () => ({ data: [] }),
}));
vi.mock('../components/MhdTaskActivitiesPanel', () => ({ MhdTaskActivitiesPanel: () => null }));

const { MhdActivityNotesPanel } = await import('../components/MhdActivityNotesPanel');
const { MhdActivityAttachmentsPanel } = await import('../components/MhdActivityAttachmentsPanel');
const { MhdTaskActivitiesSection } = await import('../components/MhdTaskActivitiesSection');
const { MhdCommandCenterLogActivityModal } =
  await import('@/features/command-center/components/MhdCommandCenterLogActivityModal');

function savedDraft(payload: Record<string, unknown>) {
  return {
    id: 'draft-1',
    draftKind: 'ACTIVITY_NOTE',
    draftKey: 'activity-1:new',
    title: null,
    stepKey: null,
    payload,
    updatedAt: '2026-07-18T16:00:00.000Z',
    expiresAt: '2026-08-18T16:00:00.000Z',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDraft.draft = null;
  mockDraft.savedAt = null;
  mockDraft.discard.mockResolvedValue(undefined);
  mockDraft.save.mockResolvedValue(undefined);
  mockNotes.notes = [];
  mockNotes.createNote.mockResolvedValue(undefined);
  mockAttachments.attachments = [];
  mockAttachments.uploadAttachment.mockResolvedValue(undefined);
});

describe('Activity notes panel', () => {
  it('adds a note from a dialog, resumes a draft and discards it on submit', async () => {
    mockDraft.draft = savedDraft({
      notePlainText: 'Covered the benefits enrollment window',
      noteRichText: null,
      visibility: 'PUBLIC',
    });
    render(<MhdActivityNotesPanel activityId="activity-1" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Note' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Add Note' })).toBeInTheDocument();
    expect(within(dialog).queryByText(/not saved in drafts/)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({
        notePlainText: 'Covered the benefits enrollment window',
        visibility: 'PUBLIC',
      }),
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Note' }));
    await waitFor(() => expect(mockNotes.createNote).toHaveBeenCalledTimes(1));
    expect(mockNotes.createNote.mock.calls[0][1]).toBe('Covered the benefits enrollment window');
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalled());
  });
});

describe('Activity attachments panel', () => {
  it('opens the upload form as a dialog with a draft', async () => {
    render(<MhdActivityAttachmentsPanel activityId="activity-1" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upload Attachment' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Upload Attachment' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save Draft' })).toBeDisabled();
  });

  it('offers Resume Draft for a saved description', async () => {
    mockDraft.draft = savedDraft({ descriptionPlainText: 'Signed offer letter' });
    render(<MhdActivityAttachmentsPanel activityId="activity-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Upload Attachment' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByRole('button', { name: 'Save Draft' })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({ descriptionPlainText: 'Signed offer letter' }),
    );
  });
});

describe('Task activities section', () => {
  it('opens Add Activity as a titled dialog with Save Draft', async () => {
    render(<MhdTaskActivitiesSection taskId="task-1" companyId="company-1" canMutate />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Activity' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Add Activity' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
  });
});

describe('Command Center log activity modal', () => {
  it('renders as a titled dialog with Save Draft', async () => {
    render(
      <MhdCommandCenterLogActivityModal
        open
        onClose={vi.fn()}
        companyId="company-1"
        currentUserId="user-1"
        onCreated={vi.fn()}
      />,
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Log Activity' })).toBeInTheDocument();
    expect(within(dialog).getByText('Harbor Light Dental')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
  });
});
