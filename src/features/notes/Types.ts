// Matches the TBL-012 (Locked) shape: polymorphic entity_type/entity_id ('TASK'|'SUBTASK'|'ACTIVITY'), a
// real 3-tier `visibility` enum, and separate rich-text (jsonb) / plain-text (generated
// companion) columns.

export type MhdNoteEntityType = 'TASK' | 'SUBTASK' | 'ACTIVITY';
export type MhdNoteVisibility = 'PUBLIC' | 'ADMIN' | 'PRIVATE';

/**
 * Single source of truth for how each visibility tier is labeled and who can
 * read it, shared by the composer, the pre-submit confirmation dialog, and
 * the badge shown on existing notes — so the three never drift out of sync.
 * The `PRIVATE` stored value keeps its display label "Private Internal SHR"
 * to make clear it is scoped to the platform operator, not the client's own
 * HR staff. Role list must match the RLS policy on `public.notes`
 * (`notes_select_visibility_scoped`, most recently 0242_notes_visibility_tier_rescope.sql).
 */
export const MHD_NOTE_VISIBILITY_COPY: Record<
  MhdNoteVisibility,
  { label: string; description: string }
> = {
  PUBLIC: {
    label: 'Public',
    description: 'Visible to everyone in the company.',
  },
  ADMIN: {
    label: 'Admin',
    description: 'Visible to Client Admin, HR Partner, and HR Admin.',
  },
  PRIVATE: {
    label: 'Private Internal SHR',
    description: 'Visible to Platform Admin only.',
  },
};

export interface MhdNote {
  id: string;
  referenceId: string;
  companyId: string;
  entityType: MhdNoteEntityType;
  entityId: string;
  /** Top-level note this reply belongs to. Null for top-level notes. One level only —
   *  a note whose own parentNoteId is set may not itself be replied to. */
  parentNoteId: string | null;
  /** RT-001 rich text editor document (e.g. Tiptap/ProseMirror JSON). */
  noteRichText: unknown;
  /** Generated plain-text companion, used for search/reporting/audit. */
  notePlainText: string;
  visibility: MhdNoteVisibility;
  createdAt: string;
  createdBy: string;
  createdByDisplayName: string | null;
  updatedAt: string;
  updatedBy: string;
  /** True when the caller is the author or holds an admin role that may edit this note. */
  canEdit: boolean;
  /** True when the caller is the author or holds an admin role that may delete this note. */
  canDelete: boolean;
}

export interface MhdCreateNoteInput {
  entityType: MhdNoteEntityType;
  entityId: string;
  noteRichText: unknown;
  notePlainText: string;
  visibility?: MhdNoteVisibility;
  /** Top-level note id to reply to. Omit for a top-level note. The parent must itself be
   *  top-level — replies to replies are rejected server-side. */
  parentNoteId?: string | null;
}

export interface MhdUpdateNoteInput {
  noteId: string;
  noteRichText: unknown;
  notePlainText: string;
  visibility?: MhdNoteVisibility;
}

export interface MhdNoteMutationResult {
  id: string;
  referenceId: string;
}

export interface MhdNoteSearchResult {
  id: string;
  referenceId: string;
  companyId: string;
  entityType: MhdNoteEntityType;
  entityId: string;
  notePlainText: string;
  visibility: MhdNoteVisibility;
  createdBy: string;
  createdAt: string;
  matchRank: number;
}

/**
 * The scaffold has no RT-001 rich text editor yet (plain <textarea> composer), so the
 * rich-text jsonb companion is derived from the plain text as a minimal ProseMirror-style
 * document. Replace with the real editor document once RT-001 lands.
 */
export function mhdPlainTextToRichText(plainText: string): unknown {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: plainText }] }],
  };
}
