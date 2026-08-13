import { beforeEach, describe, expect, it, vi } from 'vitest';

const { returnsMock, rpcMock } = vi.hoisted(() => {
  const returnsMock = vi.fn();
  const rpcMock = vi.fn<(name: string, args?: unknown) => unknown>();
  return { returnsMock, rpcMock };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: rpcMock,
  },
}));

const { mhdCalendarService } = await import('../Service');

const baseCalendarRow = {
  event_id: 'event-1',
  source_type: 'TASK',
  source_id: 'task-1',
  title: 'Finalize onboarding packet',
  event_date: '2026-08-15T16:00:00.000Z',
  event_end: '2026-08-15T17:00:00.000Z',
  person_id: 'person-1',
  person_name: 'Pat Person',
  status: 'OPEN',
  company_id: 'company-1',
  link_path: '/tasks/task-1',
};

beforeEach(() => {
  vi.clearAllMocks();
  returnsMock.mockReset();
  rpcMock.mockReset();
  rpcMock.mockImplementation(() => ({ returns: returnsMock }));
});

describe('mhdCalendarService', () => {
  it('lists events through the calendar RPC and maps rows to camelCase', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [baseCalendarRow],
      error: null,
    });

    const result = await mhdCalendarService.listEvents('2026-08-01', '2026-08-31', {
      companyId: 'company-1',
      personIds: ['person-1'],
      sourceTypes: ['TASK'],
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_calendar_list_events', {
      p_start: '2026-08-01',
      p_end: '2026-08-31',
      p_company_id: 'company-1',
      p_person_ids: ['person-1'],
      p_source_types: ['TASK'],
    });
    expect(result[0]).toEqual({
      eventId: 'event-1',
      sourceType: 'TASK',
      sourceId: 'task-1',
      title: 'Finalize onboarding packet',
      eventDate: '2026-08-15T16:00:00.000Z',
      eventEnd: '2026-08-15T17:00:00.000Z',
      personId: 'person-1',
      personName: 'Pat Person',
      status: 'OPEN',
      companyId: 'company-1',
      linkPath: '/tasks/task-1',
    });
  });

  it('sends null RPC filters for empty person and source type arrays', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await mhdCalendarService.listEvents('2026-08-01', '2026-08-31', {
      companyId: null,
      personIds: [],
      sourceTypes: [],
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_calendar_list_events', {
      p_start: '2026-08-01',
      p_end: '2026-08-31',
      p_company_id: null,
      p_person_ids: null,
      p_source_types: null,
    });
  });

  it('passes non-empty person and source type filters through unchanged', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await mhdCalendarService.listEvents('2026-08-01', '2026-08-31', {
      companyId: 'company-1',
      personIds: ['person-1', 'person-2'],
      sourceTypes: ['TASK', 'ACTIVITY'],
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_calendar_list_events', {
      p_start: '2026-08-01',
      p_end: '2026-08-31',
      p_company_id: 'company-1',
      p_person_ids: ['person-1', 'person-2'],
      p_source_types: ['TASK', 'ACTIVITY'],
    });
  });

  it('throws a calendar-specific error when the RPC fails', async () => {
    returnsMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied for calendar events' },
    });

    await expect(
      mhdCalendarService.listEvents('2026-08-01', '2026-08-31', {
        companyId: 'company-1',
        personIds: [],
        sourceTypes: [],
      }),
    ).rejects.toThrow('Unable to load calendar events: permission denied for calendar events');
  });
});
