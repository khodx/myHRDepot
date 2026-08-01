// Matches the TBL-012 (Locked) shape: polymorphic entity_type/entity_id ('TASK'|'SUBTASK'|'ACTIVITY'), a
// real 3-tier `visibility` enum, and separate rich-text (jsonb) / plain-text (generated
// companion) columns.

export type MhdNoteEntityType = 'TASK' | 'SUBTASK' | 'ACTIVITY';
export type MhdNoteVisibility = 'PUBLIC' | 'ADMIN' | 'PRIVATE';

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
