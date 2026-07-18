import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createTaskMock, returnsMock, rpcMock } = vi.hoisted(() => {
  const createTaskMock = vi.fn();
  const returnsMock = vi.fn();
  const rpcMock = vi.fn<(name: string, args?: unknown) => unknown>();
  return { createTaskMock, returnsMock, rpcMock };
});

vi.mock('@/features/tasks/Service', () => ({
  mhdTaskService: {
    createTask: createTaskMock,
  },
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
  },
}));

const { mhdActivityService } = await import('../Service');

const baseActivityRow = {
  id: 'activity-1',
  reference_id: 'ACTV-000001',
  company_id: 'company-1',
  company_name: 'Acme Co',
  person_id: 'person-1',
  person_display_name: 'Pat Person',
  parent_task_id: 'task-1',
  activity_type: 'MEETING',
  title: 'Quarterly check-in',
  description_plain_text: 'Discuss goals',
  description_rich_text: null,
  status: 'PLANNED',
  scheduled_at: '2026-07-18T15:00:00.000Z',
  occurred_at: null,
  duration_minutes: null,
  location: 'Conference Room',
  outcome_summary: null,
  follow_up_task_id: null,
  is_confidential: false,
  created_at: '2026-07-18T14:00:00.000Z',
  created_by: 'user-1',
  updated_at: '2026-07-18T14:00:00.000Z',
  updated_by: 'user-1',
  participant_display_names: ['Pat Person'],
  sub_activity_total_count: 2,
  sub_activity_done_count: 1,
  note_count: 3,
  attachment_count: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  returnsMock.mockReset();
  rpcMock.mockReset();
  rpcMock.mockImplementation(() => ({ returns: returnsMock }));
  createTaskMock.mockReset();
});

describe('mhdActivityService', () => {
  it('lists activities through the board RPC, omits ALL filters, and maps rows to camelCase', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [baseActivityRow],
      error: null,
    });

    const result = await mhdActivityService.listActivities({
      companyId: 'ALL',
      personId: 'ALL',
      taskId: 'ALL',
      activityType: 'ALL',
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_activity_board', {});
    expect(result[0]).toMatchObject({
      id: 'activity-1',
      referenceId: 'ACTV-000001',
      companyName: 'Acme Co',
      participantDisplayNames: ['Pat Person'],
      subActivityTotalCount: 2,
      noteCount: 3,
    });
  });

  it('updates an activity without sending the drifted p_actor_user_id argument', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdActivityService.updateActivity('activity-1', {
      companyId: 'company-1',
      activityType: 'MEETING',
      title: 'Quarterly check-in',
      personId: 'person-1',
      actorUserId: 'user-should-not-be-sent',
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_update_activity',
      expect.objectContaining({
        p_activity_id: 'activity-1',
        p_activity_type: 'MEETING',
        p_title: 'Quarterly check-in',
        p_person_id: 'person-1',
      }),
    );
    const updateCall = rpcMock.mock.calls.find(([fnName]) => fnName === 'mhd_update_activity');
    const updateArgs = (updateCall?.[1] ?? {}) as Record<string, unknown>;
    expect(updateArgs).not.toHaveProperty('p_actor_user_id');
  });

  it('creates a follow-up task with live default status/priority ids and links it back to the activity', async () => {
    returnsMock
      .mockResolvedValueOnce({ data: [baseActivityRow], error: null })
      .mockResolvedValueOnce({
        data: [{ ...baseActivityRow, follow_up_task_id: 'task-9' }],
        error: null,
      });

    rpcMock
      .mockImplementationOnce(() => ({ returns: returnsMock }))
      .mockResolvedValueOnce({ data: 'status-1', error: null })
      .mockResolvedValueOnce({ data: 'priority-1', error: null })
      .mockResolvedValueOnce({ error: null })
      .mockImplementationOnce(() => ({ returns: returnsMock }));

    createTaskMock.mockResolvedValueOnce({ id: 'task-9' });

    const result = await mhdActivityService.createFollowUpTask(
      'activity-1',
      { title: 'Prepare next steps', descriptionPlainText: 'Document decisions.' },
      { actorUserId: 'user-1' },
    );

    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        title: 'Prepare next steps',
        statusId: 'status-1',
        priorityId: 'priority-1',
      }),
      { actorUserId: 'user-1' },
    );

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_update_activity',
      expect.objectContaining({
        p_activity_id: 'activity-1',
        p_follow_up_task_id: 'task-9',
      }),
    );

    expect(result.followUpTaskId).toBe('task-9');
  });
});
