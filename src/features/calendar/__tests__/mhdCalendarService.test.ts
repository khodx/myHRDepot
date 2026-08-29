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

  it('gets a single event and maps it to camelCase', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'event-1',
          person_id: 'person-1',
          title: 'Quarterly check-in',
          description: 'Discuss Q3 goals',
          event_date: '2026-08-15',
          event_end_date: '2026-08-16',
          created_by: 'user-1',
        },
      ],
      error: null,
    });

    const result = await mhdCalendarService.getEvent('event-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_calendar_event_get', { p_id: 'event-1' });
    expect(result).toEqual({
      id: 'event-1',
      personId: 'person-1',
      title: 'Quarterly check-in',
      description: 'Discuss Q3 goals',
      eventDate: '2026-08-15',
      eventEndDate: '2026-08-16',
      createdBy: 'user-1',
    });
  });

  it('throws when getEvent finds nothing', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await expect(mhdCalendarService.getEvent('missing')).rejects.toThrow('Calendar event not found.');
  });

  it('creates an event through the create RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'new-event-id', error: null });

    const result = await mhdCalendarService.createEvent({
      personId: 'person-1',
      title: 'Quarterly check-in',
      eventDate: '2026-08-15',
      description: 'Discuss Q3 goals',
      eventEndDate: '2026-08-16',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_calendar_event_create', {
      p_person_id: 'person-1',
      p_title: 'Quarterly check-in',
      p_event_date: '2026-08-15',
      p_description: 'Discuss Q3 goals',
      p_event_end_date: '2026-08-16',
    });
    expect(result).toBe('new-event-id');
  });

  it('throws a calendar-specific error when create fails', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'title is required' } });

    await expect(
      mhdCalendarService.createEvent({ personId: 'person-1', title: '', eventDate: '2026-08-15' }),
    ).rejects.toThrow('Unable to create calendar event: title is required');
  });

  it('updates an event through the update RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await mhdCalendarService.updateEvent('event-1', {
      personId: 'person-1',
      title: 'Updated title',
      eventDate: '2026-08-16',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_calendar_event_update', {
      p_id: 'event-1',
      p_title: 'Updated title',
      p_event_date: '2026-08-16',
      p_description: null,
      p_event_end_date: null,
    });
  });

  it('deletes an event through the delete RPC', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await mhdCalendarService.deleteEvent('event-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_calendar_event_delete', { p_id: 'event-1' });
  });

  it('throws a calendar-specific error when delete fails', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'not authorized' } });

    await expect(mhdCalendarService.deleteEvent('event-1')).rejects.toThrow(
      'Unable to delete calendar event: not authorized',
    );
  });
});
