import { z } from 'zod';

export const mhdAnnouncementFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Enter a title.'),
    bodyPlainText: z.string().trim().min(1, 'Enter the announcement body.'),
    audienceScope: z.enum(['company', 'roles']),
    audienceRoles: z.array(z.string()).optional().nullable(),
    publishMode: z.enum(['now', 'scheduled']),
    scheduledPublishAt: z.string().optional().nullable(),
    expirationMode: z.enum(['none', 'onDate']),
    expiresAt: z.string().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.audienceScope === 'roles' && (!value.audienceRoles || value.audienceRoles.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one role.',
        path: ['audienceRoles'],
      });
    }
    if (value.publishMode === 'scheduled' && !value.scheduledPublishAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose a scheduled publish date/time.',
        path: ['scheduledPublishAt'],
      });
    }
    if (value.expirationMode === 'onDate' && !value.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose an expiration date/time.',
        path: ['expiresAt'],
      });
    }
  });

export type MhdAnnouncementFormValues = z.infer<typeof mhdAnnouncementFormSchema>;
