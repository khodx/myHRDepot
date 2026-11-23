import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdActivity, MhdSubActivity } from '../Types';

const {
  mockDraft,
  mockActions,
  mockUseMhdActivity,
  mockUseMhdActivityParticipants,
  mockUseMhdActivityPeople,
  mockUseMhdActivityTasks,
  mockUseMhdActivityUsers,
  mockUseMhdSubActivities,
} = vi.hoisted(() => ({
  mockDraft: {
    draft: null as unknown,
    isLoading: false,
    isSaving: false,
    savedAt: null as string | null,
    saveError: null as string | null,
    save: vi.fn(),
    discard: vi.fn(),
  },
  mockActions: {
    createActivity: { mutateAsync: vi.fn(), isPending: false },
    updateActivity: { mutateAsync: vi.fn(), isPending: false },
    deleteActivity: { mutateAsync: vi.fn(), isPending: false },
    addParticipant: { mutateAsync: vi.fn(), isPending: false },
    removeParticipant: { mutateAsync: vi.fn(), isPending: false },
    createSubActivity: { mutateAsync: vi.fn(), isPending: false },
    updateSubActivity: { mutateAsync: vi.fn(), isPending: false },
    deleteSubActivity: { mutateAsync: vi.fn(), isPending: false },
    createFollowUpTask: { mutateAsync: vi.fn(), isPending: false },
  },
  mockUseMhdActivity: vi.fn(),
  mockUseMhdActivityParticipants: vi.fn(),
  mockUseMhdActivityPeople: vi.fn(),
  mockUseMhdActivityTasks: vi.fn(),
  mockUseMhdActivityUsers: vi.fn(),
  mockUseMhdSubActivities: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { userId: 'user-1', companyId: 'company-1' },
    roles: ['Employee'],
  }),
}));

vi.mock('@/features/drafts/Hook', () => ({
  useMhdDraft: () => mockDraft,
}));

vi.mock('../Hook', () => ({
  useMhdActivity: (...args: unknown[]) => mockUseMhdActivity(...args),
  useMhdActivityActions: () => mockActions,
  useMhdActivityParticipants: (...args: unknown[]) => mockUseMhdActivityParticipants(...args),
  useMhdActivityPeople: (...args: unknown[]) => mockUseMhdActivityPeople(...args),
  useMhdActivityTasks: (...args: unknown[]) => mockUseMhdActivityTasks(...args),
  useMhdActivityUsers: (...args: unknown[]) => mockUseMhdActivityUsers(...args),
  useMhdSubActivities: (...args: unknown[]) => mockUseMhdSubActivities(...args),
}));

vi.mock('../components/MhdActivityNotesPanel', () => ({ MhdActivityNotesPanel: () => null }));
vi.mock('../components/MhdActivityAttachmentsPanel', () => ({
  MhdActivityAttachmentsPanel: () => null,
}));

const { MhdActivityDetailPage } = await import('../components/MhdActivityDetailPage');

const activity: MhdActivity = {
  id: 'activity-1',
  referenceId: 'ACTV-000001',
  companyId: 'company-1',
  companyName: 'Harbor Light Dental',
  personId: null,
  personDisplayName: null,
  parentTaskId: null,
  activityType: 'MEETING',
  title: 'Onboarding walkthrough',
  descriptionPlainText: 'Review the first week',
  descriptionRichText: null,
  status: 'PLANNED',
  scheduledAt: '2026-07-18T15:00:00.000Z',
  occurredAt: null,
  durationMinutes: null,
  location: 'Front office',
  outcomeSummary: null,
  followUpTaskId: null,
  linkLabel: null,
  linkUrl: null,
  isConfidential: false,
  createdAt: '2026-07-18T14:00:00.000Z',
  createdBy: 'user-1',
  updatedAt: '2026-07-18T14:00:00.000Z',
  updatedBy: 'user-1',
  participantDisplayNames: [],
  subActivityTotalCount: 0,
  subActivityDoneCount: 0,
  noteCount: 0,
  attachmentCount: 0,
};

function savedDraft(payload: Record<string, unknown>) {
  return {
    id: 'draft-1',
    draftKind: 'ACTIVITY_COMPLETE',
    draftKey: 'activity-1',
    title: null,
    stepKey: null,
    payload,
    updatedAt: '2026-07-18T16:00:00.000Z',
    expiresAt: '2026-08-18T16:00:00.000Z',
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/activities/activity-1']}>
      <Routes>
        <Route path="/activities/:activityId" element={<MhdActivityDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDraft.draft = null;
  mockDraft.savedAt = null;
  mockDraft.discard.mockResolvedValue(undefined);
  mockDraft.save.mockResolvedValue(undefined);
  mockUseMhdActivity.mockReturnValue({ data: activity, isLoading: false, error: null });
  mockUseMhdActivityParticipants.mockReturnValue({ data: [] });
  mockUseMhdActivityPeople.mockReturnValue({
    data: [{ id: 'person-9', displayName: 'Imani Okafor' }],
  });
  mockUseMhdActivityTasks.mockReturnValue({ data: [] });
  mockUseMhdActivityUsers.mockReturnValue({
    data: [{ id: 'user-9', displayName: 'Lucas Brandt' }],
  });
  mockUseMhdSubActivities.mockReturnValue({ data: [] as MhdSubActivity[] });
  mockActions.updateActivity.mutateAsync.mockResolvedValue(undefined);
  mockActions.createSubActivity.mutateAsync.mockResolvedValue(undefined);
  mockActions.addParticipant.mutateAsync.mockResolvedValue(undefined);
});

describe('Activity detail input screens', () => {
  it('opens Edit Activity as a dialog with Save Draft', async () => {
    renderPage();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Activity' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Edit Activity' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload.form).toEqual(
      expect.objectContaining({ title: 'Onboarding walkthrough' }),
    );
  });

  it('saves, resumes and discards the Mark Completed draft', async () => {
    mockDraft.draft = savedDraft({ outcomeSummary: 'Agreed on a start date' });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Mark Activity Completed' }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/not saved in drafts/)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    const outcome = within(dialog).getByPlaceholderText('What was the result of this interaction?');
    expect(outcome).toHaveValue('Agreed on a start date');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({ outcomeSummary: 'Agreed on a start date' }),
    );

    const occurred = dialog.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    fireEvent.change(occurred, { target: { value: '2026-07-18T15:00' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark Completed' }));
    await waitFor(() => expect(mockActions.updateActivity.mutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalled());
  });

  it('opens Create Follow-up Task as a dialog with Save Draft', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Create Follow-up Task' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Create Follow-up Task' }),
    ).toBeInTheDocument();

    fireEvent.change(dialog.querySelector('input') as HTMLInputElement, {
      target: { value: 'Send welcome packet' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({ title: 'Send welcome packet' }),
    );
  });

  it('adds a participant from a dialog, resumes a draft and discards on submit', async () => {
    mockDraft.draft = savedDraft({ kind: 'PERSON', subjectId: 'person-9', role: 'PARTICIPANT' });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Add Participant' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Save Draft' })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByLabelText('Participant person')).toHaveValue('person-9');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual({
      kind: 'PERSON',
      subjectId: 'person-9',
      role: 'PARTICIPANT',
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Participant' }));
    await waitFor(() => expect(mockActions.addParticipant.mutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalled());
  });

  it('adds a checklist item from a dialog, resumes a draft and discards on submit', async () => {
    mockDraft.draft = savedDraft({ title: 'Collect signed I-9' });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Add Checklist Item' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Save Draft' })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByLabelText('Item')).toHaveValue('Collect signed I-9');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual({ title: 'Collect signed I-9' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Item' }));
    await waitFor(() => expect(mockActions.createSubActivity.mutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalled());
  });
});
