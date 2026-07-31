import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdTask } from '@/features/tasks/Types';

const { rpcMock, getTemplateByKeyMock, generateAndPollMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  getTemplateByKeyMock: vi.fn(),
  generateAndPollMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: {
    getTemplateByKey: getTemplateByKeyMock,
    generateAndPoll: generateAndPollMock,
  },
}));

const { mhdAuditService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

// RPC rows exactly as mhd_get_task_audit_timeline returns them: performed_at
// desc, several nullable columns genuinely null at runtime.
const rpcRowLatest = {
  id: 'audit-2',
  entity_type: 'TASK',
  entity_id: 'task-1',
  action_type: 'FIELD_CHANGED',
  field_name: 'status_name',
  old_value: 'Open',
  new_value: 'In Progress',
  summary: null,
  performed_by: 'user-1',
  actor_name: 'Avery Admin',
  performed_at: '2026-07-29T12:00:00.000Z',
  ip_address: '10.0.0.1',
  user_agent: 'Mozilla/5.0',
  source_module: 'TASKS',
  metadata: null,
};

const rpcRowEarliest = {
  id: 'audit-1',
  entity_type: 'TASK',
  entity_id: 'task-1',
  action_type: 'CREATED',
  field_name: null,
  old_value: null,
  new_value: null,
  summary: 'Task created.',
  performed_by: 'user-1',
  actor_name: 'Avery Admin',
  performed_at: '2026-07-01T09:00:00.000Z',
  ip_address: null,
  user_agent: null,
  source_module: 'TASKS',
  metadata: null,
};

describe('mhdAuditService.listTaskAuditTimeline', () => {
  it('calls the RPC with the task id and maps rows, translating undefined nullable columns to null', async () => {
    rpcMock.mockResolvedValueOnce({ data: [rpcRowLatest, rpcRowEarliest], error: null });

    const timeline = await mhdAuditService.listTaskAuditTimeline('task-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_get_task_audit_timeline', { p_task_id: 'task-1' });
    expect(timeline).toHaveLength(2);
    expect(timeline[0]).toEqual({
      id: 'audit-2',
      entityType: 'TASK',
      entityId: 'task-1',
      actionType: 'FIELD_CHANGED',
      fieldName: 'status_name',
      oldValue: 'Open',
      newValue: 'In Progress',
      summary: null,
      performedBy: 'user-1',
      performedByName: 'Avery Admin',
      performedAt: '2026-07-29T12:00:00.000Z',
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0',
      sourceModule: 'TASKS',
      metadata: null,
    });
    // A non-field-change row: field_name/old_value/new_value/ip_address/user_agent
    // are genuinely null, mapped through rather than coerced to empty strings.
    expect(timeline[1]).toMatchObject({
      id: 'audit-1',
      fieldName: null,
      oldValue: null,
      newValue: null,
      ipAddress: null,
      userAgent: null,
      summary: 'Task created.',
    });
  });

  it('returns an empty array rather than throwing when the RPC data is null', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await mhdAuditService.listTaskAuditTimeline('task-1')).toEqual([]);
  });

  it('surfaces a 42501 denial for a non-Platform-Admin/HR-Partner caller', async () => {
    rpcMock.mockResolvedValueOnce({
      error: { code: '42501', message: 'permission denied for function mhd_get_task_audit_timeline' },
    });

    await expect(mhdAuditService.listTaskAuditTimeline('task-1')).rejects.toMatchObject({
      code: '42501',
    });
  });
});

describe('mhdAuditService.requestTaskAuditReport', () => {
  const task: Pick<
    MhdTask,
    | 'id'
    | 'companyId'
    | 'referenceId'
    | 'title'
    | 'assignedDate'
    | 'startDate'
    | 'dueDate'
    | 'completedDate'
    | 'statusName'
  > = {
    id: 'task-1' as MhdTask['id'],
    companyId: 'company-1' as MhdTask['companyId'],
    referenceId: 'TASK-000001' as MhdTask['referenceId'],
    title: 'Quarterly filing',
    assignedDate: '2026-07-01',
    startDate: '2026-07-02',
    dueDate: '2026-07-31',
    completedDate: null,
    statusName: 'In Progress',
  };
  const context = { actorUserId: 'user-1' };

  it('resolves the TASK_AUDIT_REPORT template scoped to the task company and throws when none exists', async () => {
    getTemplateByKeyMock.mockResolvedValueOnce(null);

    await expect(
      mhdAuditService.requestTaskAuditReport(task, context, 'Harper HR'),
    ).rejects.toThrow('No "TASK_AUDIT_REPORT" report template is available for this company.');

    expect(getTemplateByKeyMock).toHaveBeenCalledWith('TASK_AUDIT_REPORT', 'company-1');
    expect(generateAndPollMock).not.toHaveBeenCalled();
  });

  it('re-fetches the full unfiltered timeline and drives generateAndPoll with the built merge_data', async () => {
    getTemplateByKeyMock.mockResolvedValueOnce({ id: 'template-1' });
    // performed_at desc, exactly as the RPC orders it.
    rpcMock.mockResolvedValueOnce({ data: [rpcRowLatest, rpcRowEarliest], error: null });
    generateAndPollMock.mockResolvedValueOnce({
      id: 'gen-1',
      status: 'GENERATED',
      output_drive_file_id: 'drive-1',
    });

    const result = await mhdAuditService.requestTaskAuditReport(task, context, 'Harper HR');

    expect(rpcMock).toHaveBeenCalledWith('mhd_get_task_audit_timeline', { p_task_id: 'task-1' });
    expect(generateAndPollMock).toHaveBeenCalledWith(
      {
        templateId: 'template-1',
        companyId: 'company-1',
        entityType: 'TASK',
        entityId: 'task-1',
        mergeData: {
          'task.reference_id': 'TASK-000001',
          'task.title': 'Quarterly filing',
          'task.assigned_date': '2026-07-01',
          'task.start_date': '2026-07-02',
          'task.due_date': '2026-07-31',
          'task.completed_date': '',
          'task.status_name': 'In Progress',
          'audit.total_entry_count': '2',
          'audit.displayed_entry_count': '2',
          // First row is latest (desc), last row is earliest — the report
          // fields report earliest/latest, not array position.
          'audit.first_performed_at': '2026-07-01T09:00:00.000Z',
          'audit.latest_performed_at': '2026-07-29T12:00:00.000Z',
          'audit.timeline': [
            {
              performed_at: '2026-07-29T12:00:00.000Z',
              performed_by: 'user-1',
              action_type: 'FIELD_CHANGED',
              field_name: 'status_name',
              old_value: 'Open',
              new_value: 'In Progress',
              ip_address: '10.0.0.1',
              user_agent: 'Mozilla/5.0',
              source_module: 'TASKS',
            },
            {
              performed_at: '2026-07-01T09:00:00.000Z',
              performed_by: 'user-1',
              action_type: 'CREATED',
              field_name: '',
              old_value: '',
              new_value: '',
              ip_address: '',
              user_agent: '',
              source_module: 'TASKS',
            },
          ],
          'system.performed_by': 'Harper HR',
          'system.timestamp': expect.any(String),
        },
      },
      context,
    );
    expect(result).toMatchObject({ id: 'gen-1', status: 'GENERATED' });
  });

  it('sends empty-string first/latest performed_at and a zero count for a task with no timeline entries', async () => {
    getTemplateByKeyMock.mockResolvedValueOnce({ id: 'template-1' });
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    generateAndPollMock.mockResolvedValueOnce({ id: 'gen-1', status: 'GENERATED' });

    await mhdAuditService.requestTaskAuditReport(task, context, 'Harper HR');

    expect(generateAndPollMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mergeData: expect.objectContaining({
          'audit.total_entry_count': '0',
          'audit.displayed_entry_count': '0',
          'audit.first_performed_at': '',
          'audit.latest_performed_at': '',
          'audit.timeline': [],
        }),
      }),
      context,
    );
  });
});
