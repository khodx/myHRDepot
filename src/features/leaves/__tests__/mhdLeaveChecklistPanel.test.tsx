import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MHD_LEAVE_CHECKLIST_EDITING_ROLES,
  mhdCanEditLeaveChecklist,
} from '@/appshell/mhdRouteAccess';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import { MHD_LEAVE_CHECKLIST_STAGE_KEYS, type MhdLeaveChecklistItem } from '../WorkflowTypes';
import {
  mhdLeaveDraftServiceMock as drafts,
  mhdRenderWithQueryClient,
  mhdResetLeaveDraftService,
  mhdTestLeaveDraft,
} from './leaveDraftTestKit';

const { addAsync, editAsync, statusAsync, removeAsync } = vi.hoisted(() => ({
  addAsync: vi.fn(),
  editAsync: vi.fn(),
  statusAsync: vi.fn(),
  removeAsync: vi.fn(),
}));

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
}));

vi.mock('../WorkflowHook', () => ({
  useMhdLeaveChecklistAdd: () => ({ mutateAsync: addAsync, isPending: false }),
  useMhdLeaveChecklistEdit: () => ({ mutateAsync: editAsync, isPending: false }),
  useMhdLeaveChecklistStatus: () => ({ mutateAsync: statusAsync, isPending: false }),
  useMhdLeaveChecklistRemove: () => ({ mutateAsync: removeAsync, isPending: false }),
}));

const { MhdLeaveChecklistPanel } = await import('../components/MhdLeaveChecklistPanel');

const CASE_ID = crypto.randomUUID();
const COMPANY_ID = crypto.randomUUID();
const EDIT = { caseId: CASE_ID, companyId: COMPANY_ID };

function item(overrides: Partial<MhdLeaveChecklistItem>): MhdLeaveChecklistItem {
  return {
    stage_no: 3,
    stage_key: 'NOTICES',
    item_key: 'ELIGIBILITY_NOTICE_ISSUED',
    label: 'Eligibility and rights notice issued',
    status: 'OPEN',
    due_at: null,
    is_custom: false,
    is_overridden: false,
    due_overridden: false,
    generated_status: 'OPEN',
    note: null,
    status_set_by_name: null,
    status_set_at: null,
    ...overrides,
  };
}

const items: MhdLeaveChecklistItem[] = [
  item({
    label: 'Notice of eligibility and rights issued',
    status: 'OVERDUE',
    generated_status: 'OVERDUE',
    due_at: '2026-08-10T15:00:00Z',
  }),
  item({
    item_key: 'EDD_PAMPHLET_PROVIDED',
    label: 'EDD Paid Family Leave pamphlet provided',
    status: 'DONE',
    generated_status: 'DONE',
  }),
  item({
    stage_no: 4,
    stage_key: 'CERTIFICATION',
    item_key: 'CERTIFICATION_REQUESTED',
    label: 'Medical certification requested',
    status: 'NOT_APPLICABLE',
    generated_status: 'OPEN',
    is_overridden: true,
    note: 'Bonding leave, no certification',
    status_set_by_name: 'Renata Okafor',
    status_set_at: '2026-11-18T17:00:00Z',
  }),
  item({
    stage_no: 4,
    stage_key: 'CERTIFICATION',
    item_key: 'CUSTOM_4F1A9C27B3E84D6A9E1F52C0B7D3A816',
    label: 'Second-opinion provider letter received',
    status: 'OPEN',
    generated_status: null,
    is_custom: true,
    due_at: '2026-12-04T07:59:59Z',
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
  addAsync.mockResolvedValue('CUSTOM_0C3E');
  editAsync.mockResolvedValue(undefined);
  statusAsync.mockResolvedValue(undefined);
  removeAsync.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MhdLeaveChecklistPanel, read-only', () => {
  it('renders one section per stage, in the database stage order', () => {
    render(<MhdLeaveChecklistPanel items={items} />);
    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings).toEqual([
      'Request',
      'Eligibility',
      'Notices',
      'Certification',
      'Designation',
      'Tracking',
      'Pay Coordination',
      'Benefits',
      'Return To Work',
    ]);
    expect(headings).toHaveLength(MHD_LEAVE_CHECKLIST_STAGE_KEYS.length);
  });

  it('lists each item with its status, due date, adjustment flags and who set the status', () => {
    render(<MhdLeaveChecklistPanel items={items} />);
    const notices = screen.getByRole('list', { name: 'Notices Checklist' });
    expect(within(notices).getAllByRole('listitem')).toHaveLength(2);
    expect(within(notices).getByText('Overdue')).toBeInTheDocument();
    expect(within(notices).getByText('Done')).toBeInTheDocument();
    expect(
      within(notices).getByText(`Due ${mhdFormatDate('2026-08-10T15:00:00Z')}`),
    ).toBeInTheDocument();
    const certification = screen.getByRole('list', { name: 'Certification Checklist' });
    expect(within(certification).getByText('Not Applicable')).toBeInTheDocument();
    expect(within(certification).getByText('Adjusted')).toBeInTheDocument();
    expect(within(certification).getByText('Added')).toBeInTheDocument();
    expect(
      within(certification).getByText(
        `Not Applicable set by Renata Okafor on ${mhdFormatDate('2026-11-18T17:00:00Z')}`,
      ),
    ).toBeInTheDocument();
    expect(within(certification).getByText('Bonding leave, no certification')).toBeInTheDocument();
  });

  it('offers no edit controls without an edit scope', () => {
    render(<MhdLeaveChecklistPanel items={items} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says so when a stage, or the whole checklist, has no items', () => {
    render(<MhdLeaveChecklistPanel items={[]} />);
    expect(screen.getAllByText('No checklist items for this stage.')).toHaveLength(
      MHD_LEAVE_CHECKLIST_STAGE_KEYS.length,
    );
  });
});

describe('who may edit the checklist', () => {
  it('is Platform Admin, HR Partner, HR Admin and Client Admin only', () => {
    expect(MHD_LEAVE_CHECKLIST_EDITING_ROLES).toEqual([
      'Platform Admin',
      'HR Partner',
      'HR Admin',
      'Client Admin',
    ]);
    for (const role of MHD_LEAVE_CHECKLIST_EDITING_ROLES) {
      expect(mhdCanEditLeaveChecklist([role])).toBe(true);
    }
    const others: MhdAuthRoleName[] = ['Employee', 'Viewer', 'HR Coordinator', 'Director'];
    for (const role of others) {
      expect(mhdCanEditLeaveChecklist([role])).toBe(false);
    }
  });
});

describe('MhdLeaveChecklistPanel, editable', () => {
  function renderEditable(list = items) {
    return mhdRenderWithQueryClient(<MhdLeaveChecklistPanel items={list} edit={EDIT} />);
  }

  it('offers per-row actions that fit each item', () => {
    renderEditable();
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    // Open generated item: Edit, Mark Done, Mark Not Applicable; never Remove.
    expect(
      screen.getByRole('button', { name: 'Mark Done Notice of eligibility and rights issued' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Mark Not Applicable Notice of eligibility and rights issued',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove Notice of eligibility and rights issued' }),
    ).not.toBeInTheDocument();
    // Done item: Reopen.
    expect(
      screen.getByRole('button', { name: 'Reopen EDD Paid Family Leave pamphlet provided' }),
    ).toBeInTheDocument();
    // Not Applicable by hand: Restore, no Mark Done.
    expect(
      screen.getByRole('button', { name: 'Restore Medical certification requested' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Mark Done Medical certification requested' }),
    ).not.toBeInTheDocument();
    // Custom item: Remove, never Not Applicable.
    expect(
      screen.getByRole('button', { name: 'Remove Second-opinion provider letter received' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Mark Not Applicable Second-opinion provider letter received',
      }),
    ).not.toBeInTheDocument();
  });

  it('calls the status service for Mark Done, Reopen, Mark Not Applicable and Restore', async () => {
    renderEditable();
    fireEvent.click(
      screen.getByRole('button', { name: 'Mark Done Notice of eligibility and rights issued' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Reopen EDD Paid Family Leave pamphlet provided' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Mark Not Applicable Notice of eligibility and rights issued',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Restore Medical certification requested' }),
    );
    await waitFor(() => expect(statusAsync).toHaveBeenCalledTimes(4));
    expect(statusAsync.mock.calls.map(([input]) => input)).toEqual([
      { caseId: CASE_ID, itemKey: 'ELIGIBILITY_NOTICE_ISSUED', action: 'MARK_DONE' },
      { caseId: CASE_ID, itemKey: 'EDD_PAMPHLET_PROVIDED', action: 'REOPEN' },
      { caseId: CASE_ID, itemKey: 'ELIGIBILITY_NOTICE_ISSUED', action: 'MARK_NOT_APPLICABLE' },
      { caseId: CASE_ID, itemKey: 'CERTIFICATION_REQUESTED', action: 'RESTORE' },
    ]);
  });

  it('shows the server refusal of a one-click action', async () => {
    statusAsync.mockRejectedValue(new Error('Editing a leave checklist requires Platform Admin'));
    renderEditable();
    fireEvent.click(
      screen.getByRole('button', { name: 'Mark Done Notice of eligibility and rights issued' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Editing a leave checklist requires Platform Admin',
    );
  });

  it('removes a custom item only after confirmation', async () => {
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    renderEditable();
    const removeButton = screen.getByRole('button', {
      name: 'Remove Second-opinion provider letter received',
    });
    fireEvent.click(removeButton);
    expect(confirm).toHaveBeenCalledWith(
      'Remove "Second-opinion provider letter received" from this case\'s checklist?',
    );
    expect(removeAsync).not.toHaveBeenCalled();
    fireEvent.click(removeButton);
    await waitFor(() =>
      expect(removeAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        itemKey: 'CUSTOM_4F1A9C27B3E84D6A9E1F52C0B7D3A816',
      }),
    );
  });

  it('adds an item in a modal and discards its draft on success', async () => {
    renderEditable();
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Add Checklist Item');
    const submit = within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Item' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Stage'), { target: { value: 'BENEFITS' } });
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Union benefits trustee notified' },
    });
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '12/04/2026' } });
    fireEvent.blur(screen.getByLabelText('Due date'));
    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: 'Collective agreement requires notice' },
    });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(addAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        stageKey: 'BENEFITS',
        label: 'Union benefits trustee notified',
        dueDate: '2026-12-04',
        note: 'Collective agreement requires notice',
      }),
    );
    await waitFor(() =>
      expect(drafts.discard).toHaveBeenCalledWith(
        'LEAVE_CHECKLIST_ITEM',
        `${CASE_ID}:checklist:new`,
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('edits a generated item without copying in its rule-based deadline', async () => {
    renderEditable();
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit Notice of eligibility and rights issued' }),
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Edit Checklist Item');
    expect(screen.getByLabelText('Label')).toHaveValue('Notice of eligibility and rights issued');
    expect(screen.getByLabelText('Due date')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Notice of eligibility issued in Spanish' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() =>
      expect(editAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        itemKey: 'ELIGIBILITY_NOTICE_ISSUED',
        stageKey: 'NOTICES',
        label: 'Notice of eligibility issued in Spanish',
        dueDate: null,
        note: null,
      }),
    );
  });

  it('saves the typed item as a LEAVE_CHECKLIST_ITEM draft keyed by case and item, and resumes it', async () => {
    renderEditable();
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit Second-opinion provider letter received' }),
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Second-opinion letter filed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    expect(drafts.save.mock.calls[0][0]).toMatchObject({
      draftKind: 'LEAVE_CHECKLIST_ITEM',
      draftKey: `${CASE_ID}:checklist:CUSTOM_4F1A9C27B3E84D6A9E1F52C0B7D3A816`,
      companyId: COMPANY_ID,
      payload: { stageKey: 'CERTIFICATION', label: 'Second-opinion letter filed' },
    });
  });

  it('restores a saved draft into the item form', async () => {
    drafts.get.mockResolvedValue(
      mhdTestLeaveDraft(`${CASE_ID}:checklist:new`, {
        stageKey: 'TRACKING',
        label: 'Intermittent schedule reviewed with the supervisor',
        dueDate: '',
        note: '',
      }),
    );
    renderEditable();
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('Label')).toHaveValue(
      'Intermittent schedule reviewed with the supervisor',
    );
    expect(screen.getByLabelText('Stage')).toHaveValue('TRACKING');
  });
});
