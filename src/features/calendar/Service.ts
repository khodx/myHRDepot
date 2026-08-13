import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdCalendarEvent, MhdCalendarFilters } from './Types';

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
};
