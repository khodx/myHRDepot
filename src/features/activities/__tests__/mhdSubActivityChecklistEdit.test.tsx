import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { mhdCanEditActivityChecklist } from '@/appshell/mhdRouteAccess';
import type { MhdSubActivity, MhdUpdateSubActivityInput } from '../Types';

type EditHandler = (subActivity: MhdSubActivity, input: MhdUpdateSubActivityInput) => Promise<void>;

const { mockDraft } = vi.hoisted(() => ({
  mockDraft: {
    draft: null as unknown,
    isLoading: false,
    isSaving: false,
    savedAt: null as string | null,
    saveError: null as string | null,
    save: vi.fn(),
    discard: vi.fn(),
  },
}));

vi.mock('@/features/drafts/Hook', () => ({ useMhdDraft: () => mockDraft }));

const { MhdSubActivityChecklist } = await import('../components/MhdSubActivityChecklist');

const item: MhdSubActivity = {
  id: 'sub-1',
  referenceId: 'SACT-000001',
  activityId: 'activity-1',
  title: 'Review onboarding paperwork',
  descriptionPlainText: 'Collect signed forms',
  status: 'PLANNED',
  scheduledAt: null,
  completedAt: null,
  sortOrder: 1,
  createdAt: '2026-07-18T16:00:00.000Z',
  createdBy: 'user-1',
  updatedAt: '2026-07-18T16:00:00.000Z',
  updatedBy: 'user-1',
};

function renderChecklist(props: { canEdit?: boolean; onEdit?: Mock<EditHandler> }) {
  const onEdit = props.onEdit ?? vi.fn<EditHandler>().mockResolvedValue(undefined);
  render(
    <MhdSubActivityChecklist
      activityId="activity-1"
      subActivities={[item]}
      canMutate
      canEdit={props.canEdit}
      isSubmitting={false}
      onToggleComplete={vi.fn()}
      onAdd={vi.fn()}
      onEdit={onEdit}
      onDelete={vi.fn()}
      onReorder={vi.fn()}
    />,
  );
  return onEdit;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDraft.draft = null;
  mockDraft.savedAt = null;
  mockDraft.discard.mockResolvedValue(undefined);
  mockDraft.save.mockResolvedValue(undefined);
});

describe('mhdCanEditActivityChecklist', () => {
  it('admits only admin and HR leadership roles', () => {
    expect(mhdCanEditActivityChecklist(['Platform Admin'])).toBe(true);
    expect(mhdCanEditActivityChecklist(['HR Partner'])).toBe(true);
    expect(mhdCanEditActivityChecklist(['HR Admin'])).toBe(true);
    expect(mhdCanEditActivityChecklist(['Client Admin'])).toBe(true);
    expect(mhdCanEditActivityChecklist(['Manager'])).toBe(false);
    expect(mhdCanEditActivityChecklist(['Employee'])).toBe(false);
    expect(mhdCanEditActivityChecklist(['Viewer'])).toBe(false);
  });
});

describe('Activity checklist item editing', () => {
  it('hides edit, delete and add when the role cannot edit, keeping reorder', () => {
    renderChecklist({ canEdit: false });
    expect(
      screen.queryByRole('button', { name: 'Edit Review onboarding paperwork' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete Review onboarding paperwork' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Checklist Item' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Move Review onboarding paperwork down' }),
    ).toBeInTheDocument();
  });

  it('shows edit, delete and add to the editing roles', () => {
    renderChecklist({ canEdit: true });
    expect(
      screen.getByRole('button', { name: 'Edit Review onboarding paperwork' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Review onboarding paperwork' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Checklist Item' })).toBeInTheDocument();
  });

  it('opens a modal prefilled with the item, resumes a draft and saves it', async () => {
    mockDraft.draft = {
      id: 'draft-1',
      draftKind: 'ACTIVITY_CHECKLIST_ITEM',
      draftKey: 'activity-1:edit:sub-1',
      title: null,
      stepKey: null,
      payload: {
        title: 'Review I-9 paperwork',
        descriptionPlainText: 'Verify IDs',
        scheduledAt: '',
      },
      updatedAt: '2026-07-18T16:00:00.000Z',
      expiresAt: '2026-08-18T16:00:00.000Z',
    };
    const onEdit = renderChecklist({ canEdit: true });
    fireEvent.click(screen.getByRole('button', { name: 'Edit Review onboarding paperwork' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Edit Checklist Item' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Item')).toHaveValue('Review onboarding paperwork');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByLabelText('Item')).toHaveValue('Review I-9 paperwork');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({
        title: 'Review I-9 paperwork',
        descriptionPlainText: 'Verify IDs',
      }),
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
    expect(onEdit.mock.calls[0][0]).toBe(item);
    expect(onEdit.mock.calls[0][1]).toEqual({
      title: 'Review I-9 paperwork',
      descriptionPlainText: 'Verify IDs',
      scheduledAt: null,
    });
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows a failure inside the modal and keeps the draft', async () => {
    const onEdit = vi
      .fn<EditHandler>()
      .mockRejectedValue(new Error('Unable to update sub-activity: denied'));
    renderChecklist({ canEdit: true, onEdit });
    fireEvent.click(screen.getByRole('button', { name: 'Edit Review onboarding paperwork' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Unable to update sub-activity: denied',
    );
    expect(mockDraft.discard).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
