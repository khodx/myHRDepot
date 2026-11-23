import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdDraft, MhdDraftPayload, MhdSaveDraftInput } from './Types';

interface DraftRow {
  id: string;
  draft_kind: string;
  draft_key: string;
  title: string | null;
  step_key: string | null;
  payload: unknown;
  updated_at: string;
  expires_at: string;
}

function toDraft(row: DraftRow): MhdDraft {
  return {
    id: row.id,
    draftKind: row.draft_kind,
    draftKey: row.draft_key,
    title: row.title,
    stepKey: row.step_key,
    payload: (row.payload ?? {}) as MhdDraftPayload,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

// supabaseClient.rpc is called directly rather than bound to a local alias (see leaves/WorkflowService.ts).
export const mhdDraftService = {
  async get(draftKind: string, draftKey: string): Promise<MhdDraft | null> {
    const { data, error } = await supabaseClient.rpc('mhd_draft_get', {
      p_draft_kind: draftKind,
      p_draft_key: draftKey,
    });
    if (error) throw error;
    const row = (data as DraftRow[] | null)?.[0];
    return row ? toDraft(row) : null;
  },

  async list(draftKind?: string): Promise<MhdDraft[]> {
    const { data, error } = await supabaseClient.rpc('mhd_draft_list', {
      p_draft_kind: draftKind,
      p_limit: 50,
    });
    if (error) throw error;
    return ((data as DraftRow[] | null) ?? []).map(toDraft);
  },

  async save(input: MhdSaveDraftInput): Promise<MhdDraft> {
    const { data, error } = await supabaseClient.rpc('mhd_draft_save', {
      p_draft_kind: input.draftKind,
      p_draft_key: input.draftKey,
      p_payload: input.payload as never,
      p_company_id: input.companyId ?? undefined,
      p_title: input.title ?? undefined,
      p_step_key: input.stepKey ?? undefined,
    });
    if (error) throw error;
    return toDraft(data as unknown as DraftRow);
  },

  async discard(draftKind: string, draftKey: string): Promise<boolean> {
    const { data, error } = await supabaseClient.rpc('mhd_draft_discard', {
      p_draft_kind: draftKind,
      p_draft_key: draftKey,
    });
    if (error) throw error;
    return data === true;
  },
};
