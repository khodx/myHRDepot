import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { parseMhdLegalSearchResponse } from './Schemas';
import type { MhdLegalJurisdiction, MhdLegalSearchFilters, MhdLegalSearchResponse, MhdLegalTopic } from './Types';

export const mhdLegalSearchService = {
  async listJurisdictions(): Promise<MhdLegalJurisdiction[]> {
    const { data, error } = await supabaseClient.from('legal_jurisdictions').select('id, code, name, level').eq('is_active', true).order('level').order('name');
    if (error) throw error;
    return (data ?? []) as MhdLegalJurisdiction[];
  },
  async listTopics(): Promise<MhdLegalTopic[]> {
    const { data, error } = await supabaseClient.from('legal_topics').select('id, topic_key, display_name, description').eq('is_active', true).order('display_name');
    if (error) throw error;
    return ((data ?? []) as Array<{ id: string; topic_key: string; display_name: string; description: string | null }>).map((row) => ({ id: row.id, topicKey: row.topic_key, displayName: row.display_name, description: row.description }));
  },
  async search(filters: MhdLegalSearchFilters): Promise<MhdLegalSearchResponse> {
    const { data, error } = await supabaseClient.rpc('mhd_search_legal_content', {
      p_query: filters.query.trim(), p_jurisdiction_ids: filters.jurisdictionIds.length ? filters.jurisdictionIds : null,
      p_topic_ids: filters.topicIds.length ? filters.topicIds : null,
      // gen:types omits null from these optional array args even though the
      // RPC treats null the same as "not provided" at runtime (matches the
      // Forms Service `p_employee_file_category` cast convention).
    } as never);
    if (error) throw error;
    return parseMhdLegalSearchResponse(data);
  },
};
