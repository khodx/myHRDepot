import { z } from 'zod';

// Matches the TBL-012 (Locked) shape. A rich-text editor UI is expected to produce both
// `noteRichText` (the editor's JSON document) and `notePlainText` (its plain-text extraction) at
// the same time, so both are required inputs here rather than derived server-side.

export const mhdNoteEntityTypeSchema = z.enum(['TASK', 'SUBTASK', 'ACTIVITY']);
export const mhdNoteVisibilitySchema = z.enum(['PUBLIC', 'ADMIN', 'PRIVATE']);

const notePlainTextSchema = z
  .string()
  .trim()
  .min(1, 'Note text is required.')
  .max(10000, 'Note cannot exceed 10,000 characters.');

// The rich-text document itself: any non-null JSON value produced by the RT-001 editor.
const noteRichTextSchema = z.custom<unknown>((value) => value !== null && value !== undefined, {
  message: 'Note rich text is required.',
});

export const mhdCreateNoteSchema = z.object({
  entityType: mhdNoteEntityTypeSchema,
  entityId: z.string().trim().min(1, 'Entity ID is required.'),
  noteRichText: noteRichTextSchema,
  notePlainText: notePlainTextSchema,
  visibility: mhdNoteVisibilitySchema.default('PUBLIC'),
  parentNoteId: z.string().trim().min(1).nullish(),
});

export const mhdUpdateNoteSchema = z.object({
  noteId: z.string().trim().min(1, 'Note ID is required.'),
  noteRichText: noteRichTextSchema,
  notePlainText: notePlainTextSchema,
  visibility: mhdNoteVisibilitySchema.optional(),
});

export type MhdCreateNoteFormValues = z.infer<typeof mhdCreateNoteSchema>;
export type MhdUpdateNoteFormValues = z.infer<typeof mhdUpdateNoteSchema>;
