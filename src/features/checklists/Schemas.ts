import { z } from 'zod';
import { MHD_CHECKLIST_CATEGORIES, type MhdChecklistCategory } from './Types';

export const mhdChecklistTemplateItemDraftSchema = z.object({
  title: z.string().trim().min(1, 'Enter an item title.'),
  description: z.string().trim().optional().nullable(),
  isRequired: z.boolean(),
  requiresEvidence: z.boolean(),
  sortOrder: z.number().int(),
});

export const mhdCreateChecklistTemplateSchema = z.object({
  companyId: z.string().uuid().nullable(),
  title: z.string().trim().min(1, 'Enter a checklist title.'),
  description: z.string().trim().optional().nullable(),
  category: z
    .enum([...MHD_CHECKLIST_CATEGORIES] as [MhdChecklistCategory, ...MhdChecklistCategory[]])
    .default('GENERAL'),
  sourceTemplateId: z.string().uuid().optional().nullable(),
  items: z.array(mhdChecklistTemplateItemDraftSchema).min(1, 'Add at least one checklist item.'),
});

export const mhdCompleteChecklistItemSchema = z.object({
  itemId: z.string().uuid(),
  isCompleted: z.boolean(),
  evidenceNote: z.string().trim().optional().nullable(),
  evidenceAttachmentId: z.string().uuid().optional().nullable(),
});
