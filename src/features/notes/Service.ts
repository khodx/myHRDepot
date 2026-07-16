import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import { mhdCreateNoteSchema, mhdUpdateNoteSchema } from './Schemas';
import type {
  MhdCreateNoteInput,
  MhdNote,
  MhdNoteEntityType,
  MhdNoteMutationResult,
  MhdNoteSearchResult,
  MhdUpdateNoteInput,
} from './Types';

// Calls the entity_type/entity_id + visibility RPCs. `created_by`/actor is derived server-side
// from `auth.uid()` inside each function (matching the platform-wide `mhd_current_user_id()`
// pattern) -- there is no `p_actor_user_id` parameter to pass from the client.
//
// Task/subtask header context (title, reference_id, company_name, etc.) is a 03.4 Tasks-module
// concern -- fetch it via `mhd_get_task_by_id` (Tasks module) if a notes panel needs to render a
// task header alongside its notes.

function normalizeSupabaseError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error('Unexpected Supabase notes service error.');
}

type MhdNoteRow = {
  id: string;
  reference_id: string;
  company_id: string;
  entity_type: MhdNoteEntityType;
  entity_id: string;
  note_rich_text: unknown;
  note_plain_text: string;
  visibility: MhdNote['visibility'];
  created_at: string;
  created_by: string;
  created_by_display_name: string | null;
  updated_at: string;
  updated_by: string;
  can_edit: boolean;
  can_delete: boolean;
};

function mapNoteRow(row: MhdNoteRow): MhdNote {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    noteRichText: row.note_rich_text,
    notePlainText: row.note_plain_text,
    visibility: row.visibility,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByDisplayName: row.created_by_display_name,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    canEdit: row.can_edit,
    canDelete: row.can_delete,
  };
}

export async function mhdListNotesForEntity(entityType: MhdNoteEntityType, entityId: string): Promise<MhdNote[]> {
  const { data, error } = await supabaseClient
    .rpc('mhd_list_notes_for_entity', {
      p_entity_type: entityType,
      p_entity_id: entityId,
    })
    .returns<MhdNoteRow[]>();
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(mapNoteRow);
}

export async function mhdCreateNote(input: MhdCreateNoteInput): Promise<MhdNoteMutationResult> {
  const parsed = mhdCreateNoteSchema.parse(input);
  const { data, error } = await supabaseClient.rpc('mhd_create_note', {
    p_entity_type: parsed.entityType,
    p_entity_id: parsed.entityId,
    p_note_rich_text: parsed.noteRichText as Json,
    p_note_plain_text: parsed.notePlainText,
    p_visibility: parsed.visibility,
  });
  if (error) throw normalizeSupabaseError(error);
  const row = (data ?? [])[0];
  if (!row) throw new Error('Unable to create note: no record returned.');
  return { id: row.id, referenceId: row.reference_id };
}

export async function mhdUpdateNote(input: MhdUpdateNoteInput): Promise<void> {
  const parsed = mhdUpdateNoteSchema.parse(input);
  // `p_visibility` is optional in the generated RPC signature — omit it (rather than
  // pass null) when the caller does not want to change visibility.
  const { error } = await supabaseClient.rpc('mhd_update_note', {
    p_note_id: parsed.noteId,
    p_note_rich_text: parsed.noteRichText as Json,
    p_note_plain_text: parsed.notePlainText,
    ...(parsed.visibility !== undefined ? { p_visibility: parsed.visibility } : {}),
  });
  if (error) throw normalizeSupabaseError(error);
}

export async function mhdDeleteNote(noteId: string): Promise<void> {
  const { error } = await supabaseClient.rpc('mhd_delete_note', { p_note_id: noteId });
  if (error) throw normalizeSupabaseError(error);
}

export async function mhdSearchNotes(
  query: string,
  companyId?: string | null,
  limit = 20,
  offset = 0,
): Promise<MhdNoteSearchResult[]> {
  type MhdNoteSearchRow = {
    id: string;
    reference_id: string;
    company_id: string;
    entity_type: MhdNoteEntityType;
    entity_id: string;
    note_plain_text: string;
    visibility: MhdNote['visibility'];
    created_by: string;
    created_at: string;
    match_rank: number;
  };
  // Optional RPC args are omitted rather than passed as null.
  const { data, error } = await supabaseClient
    .rpc('mhd_search_notes', {
      p_query: query,
      ...(companyId ? { p_company_id: companyId } : {}),
      p_limit: limit,
      p_offset: offset,
    })
    .returns<MhdNoteSearchRow[]>();
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    notePlainText: row.note_plain_text,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
    matchRank: row.match_rank,
  }));
}
