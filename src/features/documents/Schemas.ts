import { z } from 'zod';

const mhdMergeFieldSchema = z.object({
  path: z.string().trim().min(1, 'Merge field path is required.'),
  label: z.string().trim().min(1, 'Merge field label is required.'),
  source: z.enum(['person', 'company', 'user', 'task', 'system', 'custom']),
});

export const mhdDocumentTemplateFormSchema = z.object({
  companyId: z.string().nullable(),
  name: z.string().trim().min(2, 'Template name must be at least 2 characters.'),
  templateType: z.enum([
    'OFFER_LETTER',
    'CONTRACT',
    'FORM',
    'CERTIFICATE',
    'CORRESPONDENCE',
    'REPORT',
  ]),
  contentFormat: z.enum(['HTML', 'DOCX', 'MARKDOWN']),
  content: z.string().trim().min(1, 'Template content is required.'),
  mergeFields: z.array(mhdMergeFieldSchema).default([]),
  description: z.string().trim().max(500).optional(),
  requiresSignature: z.boolean().default(false),
  isActive: z.boolean().default(true),
  applicableEntityType: z.string().trim().optional().nullable(),
});

export type MhdDocumentTemplateFormValues = z.infer<typeof mhdDocumentTemplateFormSchema>;
