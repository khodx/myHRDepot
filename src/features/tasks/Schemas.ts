import { z } from 'zod';

const mhdNullableDateStringSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use YYYY-MM-DD format.');

export const mhdTaskFilterSchema = z.object({
  companyId: z.string().min(1),
  statusId: z.string().min(1),
  priorityId: z.string().min(1),
  assignedUserId: z.string().min(1),
  searchTerm: z.string().max(100),
  dueFrom: mhdNullableDateStringSchema,
  dueTo: mhdNullableDateStringSchema,
});

export const mhdTaskFormSchema = z
  .object({
    companyId: z.string().min(1, 'Company is required.'),
    title: z.string().trim().min(2, 'Task title must be at least 2 characters.').max(200, 'Task title cannot exceed 200 characters.'),
    descriptionPlainText: z.string().max(5000, 'Description cannot exceed 5,000 characters.'),
    // Structured rich-text document (e.g. TipTap/ProseMirror JSON). Opaque to
    // this schema — the editor component owns its shape; only presence/
    // nullability is validated here. descriptionPlainText remains the
    // fallback/searchable/notification-preview representation.
    descriptionRichText: z.unknown().nullable().optional(),
    statusId: z.string().min(1, 'Status is required.'),
    priorityId: z.string(),
    startDate: mhdNullableDateStringSchema,
    dueDate: mhdNullableDateStringSchema,
    completedDate: mhdNullableDateStringSchema.optional().default(''),
    manualProgressPercent: z.coerce.number().int().min(0).max(100),
    assignedUserIds: z.array(z.string()).default([]),
  })
  .superRefine((value, context) => {
    if (value.startDate !== '' && value.dueDate !== '' && value.dueDate < value.startDate) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['dueDate'], message: 'Due date cannot be before start date.' });
    }
    if (value.startDate !== '' && value.completedDate !== '' && value.completedDate < value.startDate) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['completedDate'], message: 'Completed date cannot be before start date.' });
    }
  });

export type MhdTaskFormValues = z.infer<typeof mhdTaskFormSchema>;
export type MhdTaskFilterValues = z.infer<typeof mhdTaskFilterSchema>;
