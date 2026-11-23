import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdDraft, MhdDraftPayload, MhdSaveDraftInput, MhdSharedDraft } from './Types';

interface SharedDraftRow extends Omit<DraftRow, 'title' | 'step_key'> {
  owner_user_id: string;
  owner_name: string;
  title: string | null;
  step_key: string | null;
}

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

function toSharedDraft(row: SharedDraftRow): MhdSharedDraft {
  return { ...toDraft(row), ownerUserId: row.owner_user_id, ownerName: row.owner_name };
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

  /** Other people's live drafts for this screen instance that the caller's role may see (migration 0394). */
  async listShared(draftKind: string, draftKey: string): Promise<MhdSharedDraft[]> {
    const { data, error } = await supabaseClient.rpc('mhd_draft_list_shared', {
      p_draft_kind: draftKind,
      p_draft_key: draftKey,
    });
    if (error) throw error;
    return ((data as SharedDraftRow[] | null) ?? []).map(toSharedDraft);
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
