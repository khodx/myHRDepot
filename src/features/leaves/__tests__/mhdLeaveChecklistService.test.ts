import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdLeaveWorkflowService, mhdLeaveChecklistDueAt, mhdLeaveChecklistDueDate } =
  await import('../WorkflowService');
const types = await import('../WorkflowTypes');

const CASE = crypto.randomUUID();
const CUSTOM_KEY = 'CUSTOM_9E2B47D1C05A4F38B6E1D72A3F0C8B54';

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockResolvedValue({ data: null, error: null });
});

describe('checklist vocabularies (0395)', () => {
  it('lists the status actions mhd_leave_checklist_set_status accepts', () => {
    expect([...types.MHD_LEAVE_CHECKLIST_ACTIONS]).toEqual([
      'MARK_DONE',
      'REOPEN',
      'MARK_NOT_APPLICABLE',
      'RESTORE',
    ]);
  });
});

describe('checklist due dates', () => {
  it('turns a calendar day into the end of that day, local time, and back', () => {
    const dueAt = mhdLeaveChecklistDueAt('2026-12-04');
    expect(dueAt).toBe(new Date('2026-12-04T23:59:59.999').toISOString());
    expect(mhdLeaveChecklistDueDate(dueAt)).toBe('2026-12-04');
  });

  it('treats an empty date as no date and refuses a malformed one', () => {
    expect(mhdLeaveChecklistDueAt('')).toBeNull();
    expect(mhdLeaveChecklistDueAt(null)).toBeNull();
    expect(mhdLeaveChecklistDueDate(null)).toBe('');
    expect(() => mhdLeaveChecklistDueAt('12/04/2026')).toThrow(
      'Enter the due date as a calendar date.',
    );
  });
});

describe('checklist writers', () => {
  it('adds an item with trimmed label and note and an end-of-day due date', async () => {
    rpcMock.mockResolvedValue({ data: CUSTOM_KEY, error: null });
    await expect(
      mhdLeaveWorkflowService.addChecklistItem({
        caseId: CASE,
        stageKey: 'BENEFITS',
        label: '  Union benefits trustee notified ',
        dueDate: '2026-12-04',
        note: ' Collective agreement requires notice ',
      }),
    ).resolves.toBe(CUSTOM_KEY);
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_checklist_add_item', {
      p_case_id: CASE,
      p_stage_key: 'BENEFITS',
      p_label: 'Union benefits trustee notified',
      p_due_at: new Date('2026-12-04T23:59:59.999').toISOString(),
      p_note: 'Collective agreement requires notice',
    });
  });

  it('refuses an empty label before calling the database', async () => {
    await expect(
      mhdLeaveWorkflowService.addChecklistItem({ caseId: CASE, stageKey: 'REQUEST', label: '   ' }),
    ).rejects.toThrow('Enter a label for the checklist item.');
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('edits an item, sending no due date or note when they are empty', async () => {
    await mhdLeaveWorkflowService.editChecklistItem({
      caseId: CASE,
      itemKey: 'ELIGIBILITY_NOTICE_ISSUED',
      stageKey: 'NOTICES',
      label: 'Notice of eligibility issued in Spanish',
      dueDate: null,
      note: '',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_checklist_edit_item', {
      p_case_id: CASE,
      p_item_key: 'ELIGIBILITY_NOTICE_ISSUED',
      p_stage_key: 'NOTICES',
      p_label: 'Notice of eligibility issued in Spanish',
      p_due_at: undefined,
      p_note: undefined,
    });
  });

  it('sets a status by action and removes an added item', async () => {
    await mhdLeaveWorkflowService.setChecklistStatus({
      caseId: CASE,
      itemKey: 'REQUEST_RECORDED',
      action: 'MARK_NOT_APPLICABLE',
      note: 'Handled by the union',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_checklist_set_status', {
      p_case_id: CASE,
      p_item_key: 'REQUEST_RECORDED',
      p_action: 'MARK_NOT_APPLICABLE',
      p_note: 'Handled by the union',
    });
    await mhdLeaveWorkflowService.removeChecklistItem({ caseId: CASE, itemKey: CUSTOM_KEY });
    expect(rpcMock).toHaveBeenCalledWith('mhd_leave_checklist_remove_item', {
      p_case_id: CASE,
      p_item_key: CUSTOM_KEY,
    });
  });

  it('surfaces the database refusal', async () => {
    const refusal = { message: 'Editing a leave checklist requires Platform Admin', code: '42501' };
    rpcMock.mockResolvedValue({ data: null, error: refusal });
    await expect(
      mhdLeaveWorkflowService.removeChecklistItem({ caseId: CASE, itemKey: CUSTOM_KEY }),
    ).rejects.toBe(refusal);
  });
});
