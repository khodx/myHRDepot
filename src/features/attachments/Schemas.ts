import { z } from 'zod';
import { MHD_ATTACHMENT_ALLOWED_MIME_TYPES, MHD_ATTACHMENT_MAX_SIZE_BYTES } from './Types';

export const mhdAttachmentUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= MHD_ATTACHMENT_MAX_SIZE_BYTES, {
      message: 'File must be 25 MB or smaller',
    })
    .refine((f) => (MHD_ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(f.type), {
      message: 'File type not allowed. Accepted: PDF, Word, Excel, images, text, CSV, ZIP',
    }),
  // Matches MhdAttachmentEntityType (TBL-013, extensible) -- must stay in sync with the CHECK-free
  // entity_type column and MhdAttachmentEntityType in Types.ts. There is no
  // companyId field: mhd_create_attachment resolves company_id server-side via
  // mhd_resolve_attachment_company_id(entityType, entityId); it is never client-supplied.
  entityType: z.enum(['TASK', 'SUBTASK', 'NOTE']),
  entityId: z.string().min(1, 'Entity ID is required'),
  // RT-001 rich text document (unknown shape) plus its generated plain-text companion, matching
  // the notes feature's own rich-text/plain-text pair. Required: the uploaded record must carry
  // a description.
  descriptionRichText: z.unknown().refine((value) => value !== null && value !== undefined, {
    message: 'A description is required for this upload',
  }),
  descriptionPlainText: z.string().trim().min(1, 'A description is required for this upload'),
});

export type MhdAttachmentUploadSchemaInput = z.infer<typeof mhdAttachmentUploadSchema>;
