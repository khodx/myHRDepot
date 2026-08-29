import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdCalendarEvent,
  MhdCalendarEventDetail,
  MhdCalendarEventInput,
  MhdCalendarFilters,
} from './Types';

interface MhdCalendarEventRow {
  event_id: string;
  source_type: string;
  source_id: string;
  title: string;
  event_date: string;
  event_end: string | null;
  person_id: string;
  person_name: string;
  status: string | null;
  company_id: string;
  link_path: string;
}

function mapCalendarEventRow(row: MhdCalendarEventRow): MhdCalendarEvent {
  return {
    eventId: row.event_id,
    sourceType: row.source_type as MhdCalendarEvent['sourceType'],
    sourceId: row.source_id,
    title: row.title,
    eventDate: row.event_date,
    eventEnd: row.event_end,
    personId: row.person_id,
    personName: row.person_name,
    status: row.status,
    companyId: row.company_id,
    linkPath: row.link_path,
  };
}

export const mhdCalendarService = {
  async listEvents(
    start: string,
    end: string,
    filters: MhdCalendarFilters,
  ): Promise<MhdCalendarEvent[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_calendar_list_events', {
        p_start: start,
        p_end: end,
        p_company_id: filters.companyId,
        p_person_ids: filters.personIds.length > 0 ? filters.personIds : null,
        p_source_types: filters.sourceTypes.length > 0 ? filters.sourceTypes : null,
        // gen:types omits null from defaulted RPC arguments even though
        // mhd_calendar_list_events accepts null for all three of these
        // (meaning "no filter") at runtime.
      } as never)
      .returns<MhdCalendarEventRow[]>();

    if (error) {
      throw new Error(`Unable to load calendar events: ${error.message}`);
    }

    return (data ?? []).map(mapCalendarEventRow);
  },

  async getEvent(id: string): Promise<MhdCalendarEventDetail> {
    const { data, error } = await supabaseClient.rpc('mhd_calendar_event_get', { p_id: id });
    if (error) {
      throw new Error(`Unable to load calendar event: ${error.message}`);
    }
    const row = (data ?? [])[0];
    if (!row) {
      throw new Error('Calendar event not found.');
    }
    return {
      id: row.id,
      personId: row.person_id,
      title: row.title,
      description: row.description,
      eventDate: row.event_date,
      eventEndDate: row.event_end_date,
      createdBy: row.created_by,
    };
  },

  async createEvent(input: MhdCalendarEventInput): Promise<string> {
    // gen:types omits null from these two optional RPC arguments even though
    // mhd_calendar_event_create accepts null (its SQL default) for both at
    // runtime -- same documented compatibility gap as the Forms RPC
    // arguments (see CLAUDE.md's Leaves v2 handoff section).
    const { data, error } = await supabaseClient.rpc('mhd_calendar_event_create', {
      p_person_id: input.personId,
      p_title: input.title,
      p_event_date: input.eventDate,
      p_description: input.description ?? null,
      p_event_end_date: input.eventEndDate ?? null,
    } as never);
    if (error) {
      throw new Error(`Unable to create calendar event: ${error.message}`);
    }
    return data as string;
  },

  async updateEvent(id: string, input: MhdCalendarEventInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_calendar_event_update', {
      p_id: id,
      p_title: input.title,
      p_event_date: input.eventDate,
      p_description: input.description ?? null,
      p_event_end_date: input.eventEndDate ?? null,
    } as never);
    if (error) {
      throw new Error(`Unable to update calendar event: ${error.message}`);
    }
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_calendar_event_delete', { p_id: id });
    if (error) {
      throw new Error(`Unable to delete calendar event: ${error.message}`);
    }
  },
};
